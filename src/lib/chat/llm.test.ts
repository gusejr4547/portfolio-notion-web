import { ApiError, FinishReason, ThinkingLevel } from "@google/genai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
  GoogleGenAI: vi.fn(),
  env: {
    GEMINI_API_KEY: "test-key" as string | undefined,
    GEMINI_MODEL: undefined as string | undefined,
  },
}));

vi.mock("@/env", () => ({ env: mocks.env }));

vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();
  mocks.GoogleGenAI.mockImplementation(function MockGoogleGenAI() {
    return { models: { generateContent: mocks.generateContent } };
  });
  return { ...actual, GoogleGenAI: mocks.GoogleGenAI };
});

const { ChatLlmError, DEFAULT_GEMINI_MODEL, generateReply, resetQuotaGuard } =
  await import("./llm");

const input = {
  system: "시스템 프롬프트",
  history: [
    { role: "user" as const, content: "안녕하세요" },
    { role: "assistant" as const, content: "반가워요" },
  ],
  message: "어떤 프로젝트 했나요?",
};

/** SDK의 `text` 접근자처럼 동작하는 최소 응답 객체. */
function response(overrides: {
  text?: string;
  finishReason?: FinishReason;
  blockReason?: string;
  usage?: { thoughtsTokenCount?: number; candidatesTokenCount?: number };
}) {
  return {
    text: overrides.text,
    candidates: overrides.finishReason
      ? [{ finishReason: overrides.finishReason }]
      : undefined,
    promptFeedback: overrides.blockReason
      ? { blockReason: overrides.blockReason }
      : undefined,
    usageMetadata: overrides.usage,
  };
}

async function captureError(): Promise<InstanceType<typeof ChatLlmError>> {
  try {
    await generateReply(input);
  } catch (error) {
    if (error instanceof ChatLlmError) return error;
    throw error;
  }
  throw new Error("expected generateReply to throw");
}

beforeEach(() => {
  mocks.env.GEMINI_API_KEY = "test-key";
  mocks.env.GEMINI_MODEL = undefined;
  resetQuotaGuard();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("generateReply", () => {
  it("대화 기록을 user/model 역할로 바꾸고 시스템 프롬프트와 생성 설정을 함께 보낸다", async () => {
    mocks.generateContent.mockResolvedValue(
      response({ text: "  저는 세 개의 프로젝트를 했어요.  " }),
    );

    await expect(generateReply(input)).resolves.toBe(
      "저는 세 개의 프로젝트를 했어요.",
    );

    const request = mocks.generateContent.mock.calls[0][0];
    expect(request.model).toBe(DEFAULT_GEMINI_MODEL);
    expect(request.contents).toEqual([
      { role: "user", parts: [{ text: "안녕하세요" }] },
      { role: "model", parts: [{ text: "반가워요" }] },
      { role: "user", parts: [{ text: "어떤 프로젝트 했나요?" }] },
    ]);
    expect(request.config).toMatchObject({
      systemInstruction: "시스템 프롬프트",
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    });
    expect(request.config.abortSignal).toBeInstanceOf(AbortSignal);
    expect(mocks.GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-key" });
  });

  it("GEMINI_MODEL이 있으면 그 모델을 쓴다", async () => {
    mocks.env.GEMINI_MODEL = "gemini-3.5-flash-lite";
    mocks.generateContent.mockResolvedValue(response({ text: "답변" }));

    await generateReply(input);

    expect(mocks.generateContent.mock.calls[0][0].model).toBe(
      "gemini-3.5-flash-lite",
    );
  });

  it("API 키가 없으면 호출하지 않고 config 오류를 던진다", async () => {
    mocks.env.GEMINI_API_KEY = undefined;

    expect((await captureError()).kind).toBe("config");
    expect(mocks.generateContent).not.toHaveBeenCalled();
  });

  it.each([
    [429, "quota"],
    [401, "auth"],
    [403, "auth"],
    [500, "unavailable"],
  ])("ApiError %i는 %s로 분류한다", async (status, kind) => {
    mocks.generateContent.mockRejectedValue(
      new ApiError({ message: "api error", status }),
    );

    expect((await captureError()).kind).toBe(kind);
  });

  it("타임아웃·네트워크 실패는 unavailable로 분류한다", async () => {
    mocks.generateContent.mockRejectedValue(
      new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError",
      ),
    );

    expect((await captureError()).kind).toBe("unavailable");
  });

  it("프롬프트가 차단되면(promptFeedback.blockReason) blocked로 분류한다", async () => {
    mocks.generateContent.mockResolvedValue(
      response({ blockReason: "SAFETY" }),
    );

    expect((await captureError()).kind).toBe("blocked");
  });

  it("응답이 안전 필터로 멈추면 blocked로 분류한다", async () => {
    mocks.generateContent.mockResolvedValue(
      response({ finishReason: FinishReason.SAFETY }),
    );

    expect((await captureError()).kind).toBe("blocked");
  });

  it("본문 없이 MAX_TOKENS로 끝나면 truncated로 분류한다", async () => {
    mocks.generateContent.mockResolvedValue(
      response({ finishReason: FinishReason.MAX_TOKENS }),
    );

    expect((await captureError()).kind).toBe("truncated");
  });

  it("이유 없이 빈 응답이면 unavailable로 분류한다", async () => {
    mocks.generateContent.mockResolvedValue(
      response({ text: "   ", finishReason: FinishReason.STOP }),
    );

    expect((await captureError()).kind).toBe("unavailable");
  });

  describe("답변 끊김", () => {
    it("본문이 있어도 MAX_TOKENS로 끝났으면 잘린 답이므로 truncated로 던진다", async () => {
      mocks.generateContent.mockResolvedValue(
        response({
          text: "- 2023.10 특화프로젝트 우수상(",
          finishReason: FinishReason.MAX_TOKENS,
        }),
      );

      expect((await captureError()).kind).toBe("truncated");
    });

    it("정상 종료(STOP)면 경고를 남기지 않는다", async () => {
      mocks.generateContent.mockResolvedValue(
        response({ text: "답변", finishReason: FinishReason.STOP }),
      );

      await generateReply(input);

      expect(console.warn).not.toHaveBeenCalled();
    });

    it("정상 종료가 아니면 종료 사유와 토큰 수만 경고로 남기고 내용은 남기지 않는다", async () => {
      mocks.generateContent.mockResolvedValue(
        response({
          text: "비밀 답변 내용",
          finishReason: FinishReason.MAX_TOKENS,
          usage: { thoughtsTokenCount: 982, candidatesTokenCount: 38 },
        }),
      );

      await captureError();

      expect(console.warn).toHaveBeenCalledWith(
        "[chat] finish=MAX_TOKENS thoughts=982 out=38",
      );
      const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
      expect(logged).not.toContain("비밀 답변 내용");
      expect(logged).not.toContain(input.message);
    });
  });

  describe("쿼터 차단", () => {
    it("429를 받으면 retryAfter 60초를 담은 quota 오류를 던진다", async () => {
      mocks.generateContent.mockRejectedValue(
        new ApiError({ message: "quota", status: 429 }),
      );

      const error = await captureError();

      expect(error.kind).toBe("quota");
      expect(error.retryAfter).toBe(60);
    });

    it("429 직후 60초 안에는 Gemini를 호출하지 않고 남은 시간을 담은 quota 오류를 던진다", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-11T00:00:00Z"));
      mocks.generateContent.mockRejectedValueOnce(
        new ApiError({ message: "quota", status: 429 }),
      );
      await captureError();
      expect(mocks.generateContent).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(20_000);
      const blocked = await captureError();

      expect(blocked.kind).toBe("quota");
      expect(blocked.retryAfter).toBe(40);
      expect(mocks.generateContent).toHaveBeenCalledTimes(1);
    });

    it("차단 시간이 지나면 다시 Gemini를 호출한다", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-11T00:00:00Z"));
      mocks.generateContent.mockRejectedValueOnce(
        new ApiError({ message: "quota", status: 429 }),
      );
      await captureError();

      vi.advanceTimersByTime(60_001);
      mocks.generateContent.mockResolvedValue(response({ text: "다시 답변" }));

      await expect(generateReply(input)).resolves.toBe("다시 답변");
      expect(mocks.generateContent).toHaveBeenCalledTimes(2);
    });

    it("차단 중에 건너뛴 요청은 차단 시간을 늘리지 않는다", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-11T00:00:00Z"));
      mocks.generateContent.mockRejectedValueOnce(
        new ApiError({ message: "quota", status: 429 }),
      );
      await captureError();

      vi.advanceTimersByTime(30_000);
      await captureError(); // 건너뜀
      vi.advanceTimersByTime(30_001); // 첫 429로부터 60초가 지남

      mocks.generateContent.mockResolvedValue(response({ text: "답변" }));
      await expect(generateReply(input)).resolves.toBe("답변");
    });

    it("429가 아닌 오류는 차단하지 않는다", async () => {
      mocks.generateContent.mockRejectedValueOnce(
        new ApiError({ message: "server", status: 500 }),
      );
      await captureError();

      mocks.generateContent.mockResolvedValue(response({ text: "답변" }));

      await expect(generateReply(input)).resolves.toBe("답변");
    });
  });
});
