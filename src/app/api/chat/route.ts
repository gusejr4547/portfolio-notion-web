import { z } from "zod";

import { env } from "@/env";
import { buildChatContext } from "@/lib/chat/build-context";
import {
  HISTORY_CONTENT_MAX_LENGTH,
  HISTORY_MAX_ITEMS,
  MESSAGE_MAX_LENGTH,
  type ChatErrorBody,
} from "@/lib/chat/contract";
import {
  ChatLlmError,
  generateReply,
  type ChatLlmErrorKind,
} from "@/lib/chat/llm";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";

// 모델 응답(최대 15초)과 콜드 스타트 시 Notion 컨텍스트 조회를 감안한 상한.
export const maxDuration = 30;

// 클라이언트가 보낸 다른 키(portfolioContext 등)는 z.object의 기본 동작으로 버려진다.
const requestSchema = z.object({
  message: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(HISTORY_CONTENT_MAX_LENGTH),
      }),
    )
    .max(HISTORY_MAX_ITEMS)
    .default([]),
});

const NO_STORE = { "Cache-Control": "no-store" };

function errorResponse(
  status: number,
  body: ChatErrorBody,
  headers: Record<string, string> = {},
): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

const LLM_ERRORS: Record<
  ChatLlmErrorKind,
  { status: number; body: ChatErrorBody }
> = {
  quota: {
    status: 429,
    body: {
      type: "quota_exceeded",
      message:
        "오늘 준비된 답변 한도를 다 썼어요. 잠시 뒤에 다시 물어봐 주세요.",
      retryAfter: 60,
    },
  },
  blocked: {
    status: 422,
    body: {
      type: "blocked",
      message: "그 질문에는 답하기 어려워요. 포트폴리오에 관해 물어봐 주세요.",
    },
  },
  truncated: {
    status: 502,
    body: {
      type: "truncated",
      message:
        "답변이 너무 길어 끊겼어요. 질문을 조금 좁혀서 다시 물어봐 주세요.",
    },
  },
  auth: {
    status: 503,
    body: { type: "config_error", message: "채팅이 아직 준비되지 않았어요." },
  },
  config: {
    status: 503,
    body: { type: "config_error", message: "채팅이 아직 준비되지 않았어요." },
  },
  unavailable: {
    status: 500,
    body: {
      type: "server_error",
      message: "일시적인 문제로 답하지 못했어요. 잠시 뒤에 다시 시도해 주세요.",
    },
  },
};

/**
 * 브라우저가 Origin을 보낸 경우, 그 호스트가 요청을 받은 호스트와 같을 때만 허용한다.
 * 호스트끼리 비교하므로 localhost 개발 서버와 Vercel 프리뷰 도메인에서도 과차단되지 않는다.
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return errorResponse(403, {
      type: "forbidden",
      message: "허용되지 않은 요청이에요.",
    });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = undefined;
  }
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(400, {
      type: "bad_request",
      message: `질문은 1~${MESSAGE_MAX_LENGTH}자로 입력해 주세요.`,
    });
  }

  const rateLimit = checkRateLimit(getClientIp(request));
  if (!rateLimit.allowed) {
    return errorResponse(
      429,
      {
        type: "rate_limit",
        message: "질문이 너무 빨라요. 잠시 뒤에 다시 물어봐 주세요.",
        retryAfter: rateLimit.retryAfter,
      },
      { "Retry-After": String(rateLimit.retryAfter) },
    );
  }

  if (!env.GEMINI_API_KEY) {
    return errorResponse(503, LLM_ERRORS.config.body);
  }

  try {
    const context = await buildChatContext();
    const text = await generateReply({
      system: buildSystemPrompt(context),
      history: parsed.data.history,
      message: parsed.data.message,
    });
    return Response.json({ text }, { headers: NO_STORE });
  } catch (error) {
    // 방문자 메시지가 로그에 남지 않도록 오류 종류만 기록한다.
    if (error instanceof ChatLlmError) {
      console.error(`[chat] llm error: ${error.kind}`);
      const { status, body } = LLM_ERRORS[error.kind];
      const headers: Record<string, string> = body.retryAfter
        ? { "Retry-After": String(body.retryAfter) }
        : {};
      return errorResponse(status, body, headers);
    }
    console.error(
      "[chat] context error",
      error instanceof Error ? error.name : "unknown",
    );
    return errorResponse(500, LLM_ERRORS.unavailable.body);
  }
}
