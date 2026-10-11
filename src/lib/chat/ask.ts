import { buildChatContext } from "./build-context";
import { generateReply, type ChatTurn } from "./llm";
import { buildSystemPrompt } from "./system-prompt";

/** 서버가 만든 포트폴리오 컨텍스트로 시스템 프롬프트를 짜서 Gemini에 질문한다. */
export async function askPortfolio({
  message,
  history,
}: {
  message: string;
  history: ChatTurn[];
}): Promise<string> {
  const context = await buildChatContext();
  return generateReply({
    system: buildSystemPrompt(context),
    history,
    message,
  });
}
