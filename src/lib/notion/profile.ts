import { collectPaginatedAPI, isFullPage } from "@notionhq/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { env } from "@/env";
import type { Profile, SkillGroup } from "@/types/profile";

import { notion } from "./client";
import { classifyNotionError } from "./errors";
import { mapPageToName, mapPageToSkillGroup } from "./mapper";
import { getProjectBlocks } from "./projects";

async function fetchSkillGroups(databaseId: string): Promise<SkillGroup[]> {
  const database = await notion.databases.retrieve({ database_id: databaseId });
  const dataSource =
    "data_sources" in database ? database.data_sources[0] : undefined;
  if (!dataSource) return [];

  const rows = await collectPaginatedAPI(notion.dataSources.query, {
    data_source_id: dataSource.id,
    page_size: 100,
  });

  const groups: SkillGroup[] = [];
  for (const row of rows) {
    if (!isFullPage(row)) continue;
    const group = mapPageToSkillGroup(row);
    if (group) groups.push(group);
  }
  return sortSkillGroups(groups);
}

/** `순서`가 있는 행을 오름차순으로, 없는 행은 뒤로 보낸다. Array#sort는 안정 정렬이라 동순위는 Notion 순서를 유지한다. */
function sortSkillGroups(groups: SkillGroup[]): SkillGroup[] {
  return [...groups].sort(
    (a, b) => (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY),
  );
}

async function fetchProfile(pageId: string): Promise<Profile> {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    if (!isFullPage(page)) {
      throw new Error(`Notion returned a partial/archived page for id ${pageId}`);
    }
    const name = mapPageToName(page);
    const blocks = await getProjectBlocks(pageId);

    // 기술 스택 DB(child_database) 위치를 기준으로 본문을 앞/뒤로 나눠, Notion에서 보이는 순서를 그대로 유지한다.
    const skillsIndex = blocks.findIndex((block) => block.type === "child_database");
    if (skillsIndex === -1) {
      return { name, leadingBlocks: blocks, skills: [], trailingBlocks: [] };
    }

    return {
      name,
      leadingBlocks: blocks.slice(0, skillsIndex),
      skills: await fetchSkillGroups(blocks[skillsIndex].id),
      trailingBlocks: blocks.slice(skillsIndex + 1),
    };
  } catch (error) {
    throw classifyNotionError(error);
  }
}

export const getProfile = cache(
  unstable_cache(fetchProfile, ["profile"], {
    tags: ["profile"],
    revalidate: 600,
  }),
);

/**
 * 프로필 페이지 ID가 설정되지 않았거나 조회에 실패하면 null을 반환한다.
 * 프로필은 홈의 부가 정보이므로, 실패해도 홈 전체가 에러 화면이 되지 않게 한다.
 */
export async function getOptionalProfile(
  pageId: string | undefined = env.NOTION_PROFILE_PAGE_ID,
): Promise<Profile | null> {
  if (!pageId) return null;

  try {
    return await getProfile(pageId);
  } catch (error) {
    console.warn("[notion] profile unavailable, falling back to the default hero", error);
    return null;
  }
}
