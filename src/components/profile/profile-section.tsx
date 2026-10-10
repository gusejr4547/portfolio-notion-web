import { NotionBlockRenderer } from "@/components/notion/notion-block-renderer";
import type { Profile } from "@/types/profile";

import { SkillsSection } from "./skills-section";

/** 이름(h1)과 프로필 페이지 본문을 Notion에서 보이는 순서(소개 → 기술 스택 → 학력/수상 등)대로 보여준다. */
function ProfileSection({ profile }: { profile: Profile }) {
  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {profile.name}
      </h1>
      <div className="flex flex-col gap-4">
        <NotionBlockRenderer blocks={profile.leadingBlocks} />
        <SkillsSection groups={profile.skills} />
        <NotionBlockRenderer blocks={profile.trailingBlocks} />
      </div>
    </section>
  );
}

export { ProfileSection };
