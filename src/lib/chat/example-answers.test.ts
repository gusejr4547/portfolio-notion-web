import { afterEach, describe, expect, it, vi } from "vitest";

import { EXAMPLE_QUESTIONS } from "./contract";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

const mocks = vi.hoisted(() => ({
  buildChatContext: vi.fn(),
  generateReply: vi.fn(),
}));

vi.mock("./build-context", () => ({
  buildChatContext: mocks.buildChatContext,
}));
vi.mock("./llm", () => ({ generateReply: mocks.generateReply }));

const { getExampleAnswer, isExampleQuestion } =
  await import("./example-answers");

afterEach(() => {
  vi.clearAllMocks();
});

describe("isExampleQuestion", () => {
  it.each(EXAMPLE_QUESTIONS)("예시 질문 '%s'은 true", (question) => {
    expect(isExampleQuestion(question)).toBe(true);
  });

  it("앞뒤 공백은 무시한다", () => {
    expect(isExampleQuestion(`  ${EXAMPLE_QUESTIONS[0]}  `)).toBe(true);
  });

  it("조금이라도 다르거나 자유 질문이면 false", () => {
    expect(isExampleQuestion(`${EXAMPLE_QUESTIONS[0]} 자세히`)).toBe(false);
    expect(isExampleQuestion("희망 연봉이 얼마예요?")).toBe(false);
    expect(isExampleQuestion("")).toBe(false);
  });
});

describe("getExampleAnswer", () => {
  it("서버가 만든 컨텍스트의 시스템 프롬프트와 빈 대화 기록으로 Gemini에 묻는다", async () => {
    mocks.buildChatContext.mockResolvedValue("프로젝트 컨텍스트");
    mocks.generateReply.mockResolvedValue("예시 답변");

    await expect(getExampleAnswer(EXAMPLE_QUESTIONS[2])).resolves.toBe(
      "예시 답변",
    );

    const args = mocks.generateReply.mock.calls[0][0];
    expect(args.message).toBe(EXAMPLE_QUESTIONS[2]);
    expect(args.history).toEqual([]);
    expect(args.system).toContain(
      "<portfolio>\n프로젝트 컨텍스트\n</portfolio>",
    );
  });

  it("Gemini 오류는 그대로 전달한다(캐시되지 않도록)", async () => {
    mocks.buildChatContext.mockResolvedValue("컨텍스트");
    mocks.generateReply.mockRejectedValue(new Error("quota"));

    await expect(getExampleAnswer(EXAMPLE_QUESTIONS[0])).rejects.toThrow(
      "quota",
    );
  });
});
