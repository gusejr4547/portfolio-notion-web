/** `/api/chat` 요청·응답 계약. Route Handler와 클라이언트 챗 패널이 함께 쓴다. */

export const MESSAGE_MAX_LENGTH = 500;
export const HISTORY_MAX_ITEMS = 10;
export const HISTORY_CONTENT_MAX_LENGTH = 2000;

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequestBody {
  message: string;
  history: ChatHistoryItem[];
}

export interface ChatSuccessBody {
  text: string;
}

export type ChatErrorType =
  | "bad_request"
  | "forbidden"
  | "rate_limit"
  | "quota_exceeded"
  | "blocked"
  | "truncated"
  | "config_error"
  | "server_error";

export interface ChatErrorBody {
  type: ChatErrorType;
  /** 방문자에게 그대로 보여줄 한국어 안내 문구. */
  message: string;
  /** 다시 시도할 수 있을 때까지 남은 초 (rate_limit, quota_exceeded). */
  retryAfter?: number;
}
