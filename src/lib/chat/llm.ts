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
// maxOutputTokens에는 사고(thinking) 토큰도 포함된다. 보통 답변은 사고+본문 합쳐 300토큰 안팎이지만
// 사고가 간헐적으로 1,000토큰 가까이 늘어 1,024로는 답이 중간에 끊기는 일이 있었다. 이 값은 상한일 뿐이라
// 평소 요금·쿼터에는 영향이 없다.
const MAX_OUTPUT_TOKENS = 2048;
// Gemini가 429(분당/일일 쿼터)를 돌려주면 이 시간 동안은 호출하지 않는다(무료 티어 RPM 15의 한 구간).
const QUOTA_BLOCK_MS = 60_000;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type ChatLlmErrorKind =
  | "config" // API 키 미설정
  | "auth" // 키가 잘못됐거나 권한 없음 (401/403)
  | "quota" // 무료 티어 등 쿼터 초과 (429)
  | "blocked" // 안전 필터로 프롬프트나 응답이 차단됨
  | "truncated" // 출력 한도에 걸려 답변이 끝나지 못함
  | "unavailable"; // 타임아웃·네트워크·5xx 등 일시적 실패

export class ChatLlmError extends Error {
  readonly kind: ChatLlmErrorKind;
  /** 다시 시도할 수 있을 때까지 남은 초. quota 오류에서만 채운다. */
  readonly retryAfter?: number;

  constructor(
    kind: ChatLlmErrorKind,
    message: string,
    options?: { cause?: unknown; retryAfter?: number },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ChatLlmError";
    this.kind = kind;
    this.retryAfter = options?.retryAfter;
  }
}

/**
 * 최근 Gemini 429 이후 호출을 막는 시각(ms). 쿼터가 찬 구간에 요청을 더 보내 낭비하지 않기 위한 것이다.
 * 서버리스 인스턴스별 메모리라 best-effort다.
 */
let quotaBlockedUntil = 0;

/** 테스트 전용: 쿼터 차단 상태를 푼다. */
export function resetQuotaGuard(): void {
  quotaBlockedUntil = 0;
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

/** 본문이 비었을 때 차단인지 그 밖의 문제인지 구분한다. (출력 한도 초과는 호출부에서 먼저 처리한다.) */
function classifyEmptyResponse(
  response: GenerateContentResponse,
): ChatLlmError {
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    return new ChatLlmError("blocked", `prompt blocked: ${blockReason}`);
  }

  const finishReason = response.candidates?.[0]?.finishReason;
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
      return new ChatLlmError("quota", error.message, {
        cause: error,
        retryAfter: QUOTA_BLOCK_MS / 1000,
      });
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
    const blockedForMs = quotaBlockedUntil - Date.now();
    if (blockedForMs > 0) {
      // 방금 쿼터가 찼으므로 Gemini를 부르지 않고 바로 안내한다.
      throw new ChatLlmError(
        "quota",
        "gemini quota recently exceeded; request skipped",
        { retryAfter: Math.ceil(blockedForMs / 1000) },
      );
    }

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

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== FinishReason.STOP) {
      // 정상 종료가 아닐 때만 종료 사유와 토큰 수(숫자)를 남긴다. 질문·답변 내용은 기록하지 않는다.
      const usage = response.usageMetadata;
      console.warn(
        `[chat] finish=${finishReason} thoughts=${usage?.thoughtsTokenCount ?? 0} out=${usage?.candidatesTokenCount ?? 0}`,
      );
    }

    // 본문이 있어도 출력 한도에 걸려 끝났다면 문장 중간에서 끊긴 답이므로 정상 응답으로 보내지 않는다.
    if (finishReason === FinishReason.MAX_TOKENS) {
      throw new ChatLlmError(
        "truncated",
        "response hit maxOutputTokens before finishing",
      );
    }

    const text = response.text?.trim();
    if (!text) throw classifyEmptyResponse(response);
    return text;
  } catch (error) {
    const classified = classifyGeminiError(error);
    if (classified.kind === "quota" && error instanceof ApiError) {
      quotaBlockedUntil = Date.now() + QUOTA_BLOCK_MS;
    }
    throw classified;
  }
}
