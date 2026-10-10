import type { BlockObjectResponse } from "@notionhq/client";

/** 홈 프로필의 기술 스택 DB(`Skills & Tools`)에서 사용하는 Notion 속성명. */
export const SKILLS_PROPERTY = {
  category: "구분",
  proficient: "많이 해봤어요",
  familiar: "해본 적 있어요",
  /** 표시 순서(number). 비어 있는 행은 맨 뒤로 가고, 같은 값은 Notion이 돌려준 순서를 유지한다. */
  order: "순서",
} as const;

/** 기술 스택 DB의 한 행: 분야(Language, Backend 등)와 숙련도별 기술 목록. */
export interface SkillGroup {
  category: string;
  /** "많이 해봤어요" */
  proficient: string[];
  /** "해본 적 있어요" */
  familiar: string[];
  /** 표시 순서. Notion `순서` 속성이 비어 있으면 undefined. */
  order?: number;
}

/**
 * 홈에 노출하는 프로필. 프로필 페이지 본문 블록은 기술 스택 DB(`child_database`) 위치를
 * 기준으로 앞/뒤로 나뉜다. DB가 없으면 모든 블록이 `leadingBlocks`에 담긴다.
 */
export interface Profile {
  name: string;
  leadingBlocks: BlockObjectResponse[];
  skills: SkillGroup[];
  trailingBlocks: BlockObjectResponse[];
}
