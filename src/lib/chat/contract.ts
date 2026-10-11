/** `/api/chat` 요청·응답 계약. Route Handler와 클라이언트 챗 패널이 함께 쓴다. */

export const MESSAGE_MAX_LENGTH = 500;
export const HISTORY_MAX_ITEMS = 10;
export const HISTORY_CONTENT_MAX_LENGTH = 2000;

/**
 * 화면의 예시 질문 칩. 서버는 이 질문(대화 첫 턴)의 답변만 캐시해 Gemini 요청 횟수를 아낀다.
 * 자유 입력은 캐시하지 않으므로 방문자 입력이 서버에 남지 않는다.
 */
export const EXAMPLE_QUESTIONS = [
  "자기소개해주세요.",
  "가장 자신 있는 기술 스택은 뭔가요?",
  "대표 프로젝트를 소개해 주세요.",
] as const;

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
  | "daily_limit"
  | "quota_exceeded"
  | "blocked"
  | "truncated"
  | "config_error"
  | "server_error";

export interface ChatErrorBody {
  type: ChatErrorType;
  /** 방문자에게 그대로 보여줄 한국어 안내 문구. */
  message: string;
  /**
   * 다시 시도할 수 있을 때까지 남은 초 (rate_limit, quota_exceeded). 화면이 이 시간 동안 입력을 막는다.
   * 하루 단위인 daily_limit에는 넣지 않는다(헤더 Retry-After로만 알린다).
   */
  retryAfter?: number;
}
