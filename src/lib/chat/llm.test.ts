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

const { ChatLlmError, DEFAULT_GEMINI_MODEL, generateReply } =
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
}) {
  return {
    text: overrides.text,
    candidates: overrides.finishReason
      ? [{ finishReason: overrides.finishReason }]
      : undefined,
    promptFeedback: overrides.blockReason
      ? { blockReason: overrides.blockReason }
      : undefined,
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
});

afterEach(() => {
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
      maxOutputTokens: 1024,
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
});
