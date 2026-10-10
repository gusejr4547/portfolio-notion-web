import { NotionBlockRenderer } from "@/components/notion/notion-block-renderer";
import type { Profile } from "@/types/profile";

import { SkillsSection } from "./skills-section";

// 프로필 본문의 제목 위계: Notion 제목1(h3)은 구분선이 있는 큰 섹션 제목, 제목2(h4)는 본문 크기에
// 왼쪽 강조 막대를 단 소제목으로 보여 한눈에 구분되게 한다. 프로젝트 상세의 제목 스타일은 바꾸지 않도록
// 이 컨테이너 안에서만 적용한다.
const HEADING_HIERARCHY_CLASSES = [
  "[&_h3]:mt-6 [&_h3]:border-b [&_h3]:pb-2 [&_h3]:text-2xl",
  "[&_h4]:mt-2 [&_h4]:border-l-4 [&_h4]:border-primary [&_h4]:pl-3 [&_h4]:text-base",
].join(" ");

/** 이름(h1)과 프로필 페이지 본문을 Notion에서 보이는 순서(연락처 → 소개 → 기술 스택 → 학력/교육 → 수상/자격증)대로 보여준다. */
function ProfileSection({ profile }: { profile: Profile }) {
  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {profile.name}
      </h1>
      <div className={`flex flex-col gap-4 ${HEADING_HIERARCHY_CLASSES}`}>
        <NotionBlockRenderer blocks={profile.leadingBlocks} />
        <SkillsSection groups={profile.skills} />
        <NotionBlockRenderer blocks={profile.trailingBlocks} />
      </div>
    </section>
  );
}

export { ProfileSection };
