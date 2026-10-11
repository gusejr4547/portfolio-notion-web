import { unstable_cache } from "next/cache";

import { askPortfolio } from "./ask";
import { EXAMPLE_QUESTIONS } from "./contract";

/** 화면의 예시 질문 칩과 정확히 같은 질문인지(앞뒤 공백 무시). */
export function isExampleQuestion(message: string): boolean {
  return (EXAMPLE_QUESTIONS as readonly string[]).includes(message.trim());
}

/**
 * 예시 질문의 답변을 10분간 재사용해 Gemini 요청 횟수(무료 티어 RPM 15, RPD 500)를 아낀다.
 * 컨텍스트와 같은 주기·태그라 Notion 갱신 주기와 맞고, Next 데이터 캐시라 서버리스 인스턴스 간에도 공유된다.
 * 실패(throw)는 캐시되지 않는다. 미리 정한 질문만 캐시하므로 방문자 입력은 서버에 남지 않는다.
 */
export const getExampleAnswer = unstable_cache(
  (question: string) => askPortfolio({ message: question, history: [] }),
  ["chat-example-answer"],
  { revalidate: 600, tags: ["profile", "projects", "project-blocks"] },
);
