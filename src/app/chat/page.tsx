import type { Metadata } from "next";

import { ChatPanel } from "@/components/chat/chat-panel";
import { getOptionalProfile } from "@/lib/notion";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI 챗",
  description: "포트폴리오 내용을 바탕으로 질문에 답하는 AI 챗입니다.",
};

export default async function ChatPage() {
  // 프로필이 없어도 챗은 동작해야 하므로 이름만 빌려 쓰고, 없으면 일반 호칭을 쓴다.
  const profile = await getOptionalProfile();

  return (
    <div className="mx-auto max-w-5xl px-4 py-24">
      <ChatPanel ownerName={profile?.name ?? "포트폴리오 주인"} />
    </div>
  );
}
