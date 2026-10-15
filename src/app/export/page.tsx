import type { Metadata } from "next";

import { ExportBuilder } from "@/components/export/export-builder";
import { NotionBlockRenderer } from "@/components/notion/notion-block-renderer";
import { ProfileSection } from "@/components/profile/profile-section";
import { getOptionalProfile, getProjectBlocks, getProjects } from "@/lib/notion";
import { sortProjectsByPeriodDesc } from "@/lib/sort-projects";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "PDF 내보내기",
  description: "원하는 프로젝트와 영역을 골라 PDF로 저장합니다.",
};

export default async function ExportPage() {
  const [projects, profile] = await Promise.all([
    getProjects().then(sortProjectsByPeriodDesc),
    getOptionalProfile(),
  ]);

  // 본문은 서버에서 렌더링해 슬롯으로 넘긴다(블록 렌더러를 클라이언트 번들에 넣지 않는다).
  const bodyEntries = await Promise.all(
    projects.map(async (project) => {
      const blocks = await getProjectBlocks(project.id);
      return [project.id, <NotionBlockRenderer key={project.id} blocks={blocks} />] as const;
    }),
  );

  return (
    <ExportBuilder
      projects={projects}
      bodies={Object.fromEntries(bodyEntries)}
      profile={profile ? <ProfileSection profile={profile} /> : null}
    />
  );
}
