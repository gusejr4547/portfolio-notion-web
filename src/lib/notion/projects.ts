import {
  collectPaginatedAPI,
  isFullBlock,
  isFullPage,
  type BlockObjectResponse,
} from "@notionhq/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import type { Project } from "@/types/project";

import { notion } from "./client";
import { getDataSourceId } from "./data-source";
import { classifyNotionError } from "./errors";
import { mapPageToProject } from "./mapper";

async function fetchProjects(): Promise<Project[]> {
  try {
    const dataSourceId = await getDataSourceId();
    const rows = await collectPaginatedAPI(notion.dataSources.query, {
      data_source_id: dataSourceId,
      page_size: 100,
    });

    const projects: Project[] = [];
    for (const row of rows) {
      if (!isFullPage(row)) continue; // data source references 등 페이지가 아닌 결과는 조용히 건너뛴다
      try {
        projects.push(mapPageToProject(row));
      } catch (error) {
        console.warn(`[notion] skipping unmappable project page ${row.id}`, error);
      }
    }
    return projects;
  } catch (error) {
    throw classifyNotionError(error);
  }
}

// Notion 서명 URL(prod-files-secure.s3...)은 발급 후 약 1시간 뒤 만료된다.
// revalidate=600(10분)은 1/6 수준의 넉넉한 안전 마진이다. 단, 트래픽이 낮은 라우트는
// stale-while-revalidate로 재검증 창을 넘겨도 즉시 갱신되지 않을 수 있어,
// 저트래픽 구간에서는 만료된 썸네일 URL이 잠깐 노출될 잔여 위험이 있다.
// (재검증을 능동적으로 트리거하는 온디맨드 revalidate 핸들러는 Task012에서 다룬다.)
export const getProjects = cache(
  unstable_cache(fetchProjects, ["projects"], {
    tags: ["projects"],
    revalidate: 600,
  }),
);

async function fetchProjectById(id: string): Promise<Project> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    if (!isFullPage(page)) {
      throw new Error(`Notion returned a partial/archived page for id ${id}`);
    }
    return mapPageToProject(page);
  } catch (error) {
    throw classifyNotionError(error);
  }
}

export const getProjectById = cache(
  unstable_cache(fetchProjectById, ["project-by-id"], {
    tags: ["projects"],
    revalidate: 600,
  }),
);

async function fetchProjectBlocks(id: string): Promise<BlockObjectResponse[]> {
  try {
    const blocks = await collectPaginatedAPI(notion.blocks.children.list, {
      block_id: id,
      page_size: 100,
    });
    return blocks.filter(isFullBlock);
    // 참고: has_children === true인 블록의 자식 재귀 조회는 이 함수의 범위 밖이다 (추후 과제).
  } catch (error) {
    throw classifyNotionError(error);
  }
}

export const getProjectBlocks = cache(
  unstable_cache(fetchProjectBlocks, ["project-blocks"], {
    tags: ["project-blocks"],
    revalidate: 600,
  }),
);
