/** Notion date range 매핑. 시작일은 필수, 종료일(진행 중)은 선택. */
export interface ProjectPeriod {
  start: string;
  end?: string;
}

/** docs/PRD.md 데이터 모델(Project) 전체 필드를 담는 기준 타입. */
export interface Project {
  id: string;
  title: string;
  summary: string;
  techStack: string[];
  githubUrl: string;
  demoUrl?: string;
  /** Notion "files & media"는 배열이지만 카드/상세에는 대표 이미지 1장만 필요하므로 첫 파일의 URL로 단순화한다. */
  thumbnailUrl?: string;
  period?: ProjectPeriod;
  featured: boolean;
}

/** 목록 카드용 축약 타입. featured는 F003 대표 프로젝트 선별에 필요해 포함하고, 카드에 노출되지 않는 링크류는 제외한다. */
export type ProjectSummary = Pick<
  Project,
  "id" | "title" | "summary" | "techStack" | "thumbnailUrl" | "period" | "featured"
>;

/** 상세 페이지용 전체 타입. 본문(설명)은 별도 getProjectBlocks()로 조회하므로 이 타입에는 포함하지 않는다. */
export type ProjectDetail = Project;

/** Notion DB 속성명 매핑. 매핑 함수(mapPageToProject)에서 이 상수만 참조해 원시 속성명 변경에 대응한다. */
export const NOTION_PROPERTY = {
  title: "제목",
  summary: "요약",
  techStack: "기술스택",
  github: "GitHub 링크",
  demo: "데모 링크",
  thumbnail: "썸네일",
  period: "기간",
  featured: "대표",
} as const;

/** 블록 렌더러(Task005)가 지원할 Notion 블록 타입. 목록에 없는 타입은 렌더러에서 안전하게 무시한다. */
export type NotionBlockType =
  | "paragraph"
  | "heading_1"
  | "heading_2"
  | "heading_3"
  | "bulleted_list_item"
  | "numbered_list_item"
  | "code"
  | "image"
  | "quote"
  | "divider"
  | "callout"
  | "bookmark";
