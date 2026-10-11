import { unstable_cache } from "next/cache";
import { cache } from "react";

import { formatPeriod } from "@/lib/format-period";
import { notion } from "@/lib/notion/client";
import { getOptionalProfile } from "@/lib/notion/profile";
import { getProjectBlocks, getProjects } from "@/lib/notion/projects";
import { sortProjectsByPeriodDesc } from "@/lib/sort-projects";
import type { SkillGroup } from "@/types/profile";
import type { Project } from "@/types/project";

import { blocksToText } from "./blocks-to-text";

const IMAGE_MARKDOWN = /!\[[^\]]*\]\([^)]*\)/g;
// Notion 확장 마크다운의 미디어 태그(<image ...>, <video ...> 등). 서명 URL이 길어 토큰만 차지한다.
const MEDIA_TAG = /<(image|video|audio|file|pdf)\b[^>]*>(?:[\s\S]*?<\/\1>)?/g;
// 국내 휴대폰·유선 번호(+82 포함). 전화번호는 공개 사이트에 노출하지 않는다(PRD F006).
// 앞뒤 경계를 둬 URL·Notion ID 속 숫자열은 건드리지 않는다.
const PHONE_NUMBER =
  /(?<![\w./-])(?:\+82[-.\s]?|0)\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}(?![\w/])/g;

/** 모델에 넘기기 전 본문에서 이미지·미디어와 전화번호를 걷어내고 빈 줄을 정리한다. */
export function sanitizeContextText(text: string): string {
  return (
    text
      .replace(IMAGE_MARKDOWN, "")
      .replace(MEDIA_TAG, "")
      // retrieveMarkdown은 문단 안 줄바꿈을 <br>로 돌려준다.
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(PHONE_NUMBER, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * 페이지 본문을 텍스트로 가져온다. `pages.retrieveMarkdown`(하위 블록까지 포함)을 우선 쓰고,
 * 호출이 실패하거나 잘린(truncated) 결과면 최상위 블록 기반 변환으로 대체한다.
 */
async function fetchPageBody(pageId: string): Promise<string> {
  try {
    const { markdown, truncated } = await notion.pages.retrieveMarkdown({
      page_id: pageId,
    });
    if (!truncated) return markdown;
  } catch (error) {
    console.warn(
      `[chat] markdown unavailable for ${pageId}, falling back to blocks`,
      error,
    );
  }

  try {
    return blocksToText(await getProjectBlocks(pageId));
  } catch (error) {
    console.warn(`[chat] project body unavailable for ${pageId}`, error);
    return "";
  }
}

function formatSkills(skills: SkillGroup[]): string {
  return skills
    .map((group) => {
      const lines = [`- ${group.category}`];
      if (group.proficient.length)
        lines.push(`  - 많이 해봤어요: ${group.proficient.join(", ")}`);
      if (group.familiar.length)
        lines.push(`  - 해본 적 있어요: ${group.familiar.join(", ")}`);
      return lines.join("\n");
    })
    .join("\n");
}

function formatProject(project: Project, body: string): string {
  const lines = [
    `### ${project.title}${project.featured ? " (대표 프로젝트)" : ""}`,
    `- 요약: ${project.summary || "없음"}`,
    `- 기간: ${formatPeriod(project.period)}`,
    `- 기술스택: ${project.techStack.join(", ") || "없음"}`,
  ];
  if (project.githubUrl) lines.push(`- GitHub: ${project.githubUrl}`);
  if (project.demoUrl) lines.push(`- 데모: ${project.demoUrl}`);
  if (body) lines.push("", body);
  return lines.join("\n");
}

async function fetchChatContext(): Promise<string> {
  const [profile, projects] = await Promise.all([
    getOptionalProfile(),
    getProjects(),
  ]);
  const ordered = sortProjectsByPeriodDesc(projects);
  const bodies = await Promise.all(
    ordered.map((project) => fetchPageBody(project.id)),
  );

  const sections: string[] = [];

  if (profile) {
    const profileLines = [`## 프로필`, `이름: ${profile.name}`];
    const leading = blocksToText(profile.leadingBlocks);
    if (leading) profileLines.push("", leading);
    if (profile.skills.length) {
      profileLines.push("", "### 기술 스택", formatSkills(profile.skills));
    }
    const trailing = blocksToText(profile.trailingBlocks);
    if (trailing) profileLines.push("", trailing);
    sections.push(profileLines.join("\n"));
  }

  sections.push(
    [
      `## 프로젝트 (${ordered.length}개, 최신순)`,
      ...ordered.map((project, index) => formatProject(project, bodies[index])),
    ].join("\n\n"),
  );

  return sanitizeContextText(sections.join("\n\n"));
}

/** 챗 시스템 프롬프트에 넣을 포트폴리오 컨텍스트. Notion 조회 비용을 줄이려고 프로젝트 데이터와 같은 10분 주기로 캐시한다. */
export const buildChatContext = cache(
  unstable_cache(fetchChatContext, ["chat-context"], {
    tags: ["profile", "projects", "project-blocks"],
    revalidate: 600,
  }),
);
