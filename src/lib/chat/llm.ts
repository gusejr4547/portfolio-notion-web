import {
  ApiError,
  FinishReason,
  GoogleGenAI,
  ThinkingLevel,
  type Content,
  type GenerateContentResponse,
} from "@google/genai";

import { env } from "@/env";

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";
const TIMEOUT_MS = 15_000;
// maxOutputTokens에는 사고(thinking) 토큰도 포함되므로 본문이 비지 않게 넉넉히 둔다.
const MAX_OUTPUT_TOKENS = 1024;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type ChatLlmErrorKind =
  | "config" // API 키 미설정
  | "auth" // 키가 잘못됐거나 권한 없음 (401/403)
  | "quota" // 무료 티어 등 쿼터 초과 (429)
  | "blocked" // 안전 필터로 프롬프트나 응답이 차단됨
  | "truncated" // 출력 한도에 걸려 본문이 비어 있음
  | "unavailable"; // 타임아웃·네트워크·5xx 등 일시적 실패

export class ChatLlmError extends Error {
  readonly kind: ChatLlmErrorKind;

  constructor(
    kind: ChatLlmErrorKind,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ChatLlmError";
    this.kind = kind;
  }
}

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw new ChatLlmError("config", "GEMINI_API_KEY is not set");
  }
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

function toContents(history: ChatTurn[], message: string): Content[] {
  return [
    ...history.map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];
}

const BLOCKED_FINISH_REASONS = new Set<string>([
  FinishReason.SAFETY,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.BLOCKLIST,
  FinishReason.SPII,
  FinishReason.RECITATION,
]);

/** 본문이 비었을 때 차단인지, 출력 한도인지, 그 밖의 문제인지 구분한다. */
function classifyEmptyResponse(
  response: GenerateContentResponse,
): ChatLlmError {
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    return new ChatLlmError("blocked", `prompt blocked: ${blockReason}`);
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason === FinishReason.MAX_TOKENS) {
    return new ChatLlmError(
      "truncated",
      "response hit maxOutputTokens before any text",
    );
  }
  if (finishReason && BLOCKED_FINISH_REASONS.has(finishReason)) {
    return new ChatLlmError("blocked", `response blocked: ${finishReason}`);
  }
  return new ChatLlmError(
    "unavailable",
    `empty response (finishReason: ${finishReason ?? "none"})`,
  );
}

function classifyGeminiError(error: unknown): ChatLlmError {
  if (error instanceof ChatLlmError) return error;

  if (error instanceof ApiError) {
    if (error.status === 429)
      return new ChatLlmError("quota", error.message, { cause: error });
    if (error.status === 401 || error.status === 403) {
      return new ChatLlmError("auth", error.message, { cause: error });
    }
  }

  // 타임아웃(TimeoutError/AbortError), 네트워크 실패, 5xx 등은 잠시 뒤 다시 시도할 수 있는 실패로 본다.
  return new ChatLlmError(
    "unavailable",
    error instanceof Error ? error.message : String(error),
    {
      cause: error,
    },
  );
}

/**
 * Gemini에 한 번 질의하고 답변 텍스트를 돌려준다. 실패는 모두 `ChatLlmError`로 분류해 던진다.
 * 방문자 메시지 내용은 로그에 남기지 않는다.
 */
export async function generateReply({
  system,
  history,
  message,
}: {
  system: string;
  history: ChatTurn[];
  message: string;
}): Promise<string> {
  try {
    const response = await getClient().models.generateContent({
      model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      contents: toContents(history, message),
      config: {
        systemInstruction: system,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        abortSignal: AbortSignal.timeout(TIMEOUT_MS),
      },
    });

    const text = response.text?.trim();
    if (!text) throw classifyEmptyResponse(response);
    return text;
  } catch (error) {
    throw classifyGeminiError(error);
  }
}
