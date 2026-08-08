import type { PageObjectResponse } from "@notionhq/client";

import { NOTION_PROPERTY } from "@/types/project";

/**
 * mapper.test.ts와 이후 서브태스크(client.ts, projects.ts)가 재사용할 Notion 원시 응답 픽스처.
 * `PageObjectResponse`/속성값 유니온의 정확한 형태는
 * node_modules/@notionhq/client/build/src/api-endpoints/common.d.ts 기준으로 구성했다.
 */

type PageProperties = PageObjectResponse["properties"];
type NotionProperty = PageProperties[string];

function richTextItem(text: string): {
  type: "text";
  text: { content: string; link: null };
  plain_text: string;
  href: null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: "default";
  };
} {
  return {
    type: "text",
    text: { content: text, link: null },
    plain_text: text,
    href: null,
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: "default",
    },
  };
}

function titleProperty(text: string[]): NotionProperty {
  return {
    id: "title",
    type: "title",
    title: text.map((t) => richTextItem(t)),
  } as NotionProperty;
}

function richTextProperty(text: string): NotionProperty {
  return {
    id: "rich-text-prop",
    type: "rich_text",
    rich_text: [richTextItem(text)],
  } as NotionProperty;
}

function multiSelectProperty(names: string[]): NotionProperty {
  return {
    id: "multi-select-prop",
    type: "multi_select",
    multi_select: names.map((name, index) => ({
      id: `option-${index}`,
      name,
      color: "default" as const,
    })),
  } as NotionProperty;
}

function urlProperty(url: string | null): NotionProperty {
  return {
    id: "url-prop",
    type: "url",
    url,
  } as NotionProperty;
}

function externalFilesProperty(url: string, name = "thumbnail"): NotionProperty {
  return {
    id: "files-prop",
    type: "files",
    files: [
      {
        type: "external",
        name,
        external: { url },
      },
    ],
  } as NotionProperty;
}

function fileHostedFilesProperty(url: string, name = "thumbnail"): NotionProperty {
  return {
    id: "files-prop",
    type: "files",
    files: [
      {
        type: "file",
        name,
        file: { url, expiry_time: "2026-12-31T00:00:00.000Z" },
      },
    ],
  } as NotionProperty;
}

function emptyFilesProperty(): NotionProperty {
  return {
    id: "files-prop",
    type: "files",
    files: [],
  } as NotionProperty;
}

function dateProperty(date: { start: string; end?: string } | null): NotionProperty {
  return {
    id: "date-prop",
    type: "date",
    date: date ? { start: date.start, end: date.end ?? null, time_zone: null } : null,
  } as NotionProperty;
}

function checkboxProperty(checked: boolean): NotionProperty {
  return {
    id: "checkbox-prop",
    type: "checkbox",
    checkbox: checked,
  } as NotionProperty;
}

function createPage(id: string, properties: PageProperties): PageObjectResponse {
  return {
    object: "page",
    id,
    created_time: "2026-01-01T00:00:00.000Z",
    last_edited_time: "2026-01-01T00:00:00.000Z",
    in_trash: false,
    archived: false,
    is_archived: false,
    is_locked: false,
    url: `https://www.notion.so/${id}`,
    public_url: null,
    parent: { type: "database_id", database_id: "mock-database-id" },
    properties,
    icon: null,
    cover: null,
    created_by: { object: "user", id: "mock-user-id" },
    last_edited_by: { object: "user", id: "mock-user-id" },
  } as PageObjectResponse;
}

/** src/lib/mock/projects.ts의 mockProjects와 1:1로 대응하는 원시 Notion 페이지 픽스처. */
const mockNotionPages: PageObjectResponse[] = [
  createPage("mock-project-1", {
    [NOTION_PROPERTY.title]: titleProperty(["Notion 포트폴리오 사이트"]),
    [NOTION_PROPERTY.summary]: richTextProperty(
      "Notion 데이터베이스를 웹 포트폴리오로 보여주는 Next.js 프로젝트",
    ),
    [NOTION_PROPERTY.techStack]: multiSelectProperty(["Next.js", "TypeScript", "TailwindCSS"]),
    [NOTION_PROPERTY.github]: urlProperty("https://github.com/example/notion-portfolio"),
    [NOTION_PROPERTY.demo]: urlProperty("https://notion-portfolio.example.com"),
    [NOTION_PROPERTY.thumbnail]: externalFilesProperty(
      "https://picsum.photos/seed/mock-project-1/640/360",
    ),
    [NOTION_PROPERTY.period]: dateProperty({ start: "2026-01-05", end: "2026-03-20" }),
    [NOTION_PROPERTY.featured]: checkboxProperty(true),
  }),
  createPage("mock-project-2", {
    [NOTION_PROPERTY.title]: titleProperty(["실시간 채팅 애플리케이션"]),
    [NOTION_PROPERTY.summary]: richTextProperty("WebSocket 기반 실시간 메시징 서비스"),
    [NOTION_PROPERTY.techStack]: multiSelectProperty(["React", "Node.js", "Socket.IO"]),
    [NOTION_PROPERTY.github]: urlProperty("https://github.com/example/realtime-chat"),
    [NOTION_PROPERTY.demo]: urlProperty("https://chat.example.com"),
    [NOTION_PROPERTY.thumbnail]: externalFilesProperty(
      "https://picsum.photos/seed/mock-project-2/640/360",
    ),
    [NOTION_PROPERTY.period]: dateProperty({ start: "2026-04-01" }),
    [NOTION_PROPERTY.featured]: checkboxProperty(true),
  }),
  createPage("mock-project-3", {
    [NOTION_PROPERTY.title]: titleProperty(["개인 가계부 관리 앱"]),
    [NOTION_PROPERTY.summary]: richTextProperty("수입/지출 내역을 시각화해 보여주는 가계부 서비스"),
    [NOTION_PROPERTY.techStack]: multiSelectProperty(["React", "Chart.js", "Firebase"]),
    [NOTION_PROPERTY.github]: urlProperty("https://github.com/example/budget-manager"),
    [NOTION_PROPERTY.demo]: urlProperty("https://budget.example.com"),
    [NOTION_PROPERTY.thumbnail]: externalFilesProperty(
      "https://picsum.photos/seed/mock-project-3/640/360",
    ),
    [NOTION_PROPERTY.period]: dateProperty({ start: "2025-09-10", end: "2025-12-01" }),
    [NOTION_PROPERTY.featured]: checkboxProperty(false),
  }),
  createPage("mock-project-4", {
    [NOTION_PROPERTY.title]: titleProperty(["오픈소스 CLI 도구"]),
    [NOTION_PROPERTY.summary]: richTextProperty("터미널에서 반복 작업을 자동화하는 CLI 유틸리티"),
    [NOTION_PROPERTY.techStack]: multiSelectProperty(["Rust", "Clap"]),
    [NOTION_PROPERTY.github]: urlProperty("https://github.com/example/cli-tool"),
    [NOTION_PROPERTY.demo]: urlProperty(null),
    [NOTION_PROPERTY.thumbnail]: externalFilesProperty(
      "https://picsum.photos/seed/mock-project-4/640/360",
    ),
    [NOTION_PROPERTY.period]: dateProperty({ start: "2025-06-15", end: "2025-07-30" }),
    [NOTION_PROPERTY.featured]: checkboxProperty(false),
  }),
  createPage("mock-project-5", {
    [NOTION_PROPERTY.title]: titleProperty(["레시피 공유 커뮤니티"]),
    [NOTION_PROPERTY.summary]: richTextProperty(
      "사용자가 직접 레시피를 등록하고 공유하는 커뮤니티 플랫폼",
    ),
    [NOTION_PROPERTY.techStack]: multiSelectProperty(["Vue", "Express", "MongoDB"]),
    [NOTION_PROPERTY.github]: urlProperty("https://github.com/example/recipe-share"),
    [NOTION_PROPERTY.demo]: urlProperty("https://recipe.example.com"),
    [NOTION_PROPERTY.thumbnail]: emptyFilesProperty(),
    [NOTION_PROPERTY.period]: dateProperty({ start: "2025-03-01", end: "2025-05-20" }),
    [NOTION_PROPERTY.featured]: checkboxProperty(false),
  }),
  createPage("mock-project-6", {
    [NOTION_PROPERTY.title]: titleProperty(["습관 트래커"]),
    [NOTION_PROPERTY.summary]: richTextProperty("매일의 습관 형성을 돕는 트래킹 애플리케이션"),
    [NOTION_PROPERTY.techStack]: multiSelectProperty(["React Native", "TypeScript"]),
    [NOTION_PROPERTY.github]: urlProperty("https://github.com/example/habit-tracker"),
    [NOTION_PROPERTY.demo]: urlProperty("https://habit.example.com"),
    [NOTION_PROPERTY.thumbnail]: externalFilesProperty(
      "https://picsum.photos/seed/mock-project-6/640/360",
    ),
    [NOTION_PROPERTY.period]: dateProperty(null),
    [NOTION_PROPERTY.featured]: checkboxProperty(false),
  }),
];

/** 제목 속성이 properties에 아예 없는 경우 → mapPageToProject가 throw해야 한다. */
const pageMissingTitle = createPage("malformed-missing-title", {
  [NOTION_PROPERTY.summary]: richTextProperty("제목 없는 페이지"),
});

/** 제목 속성은 있지만 title 배열이 비어 있는 경우 → mapPageToProject가 throw해야 한다. */
const pageEmptyTitleArray = createPage("malformed-empty-title", {
  [NOTION_PROPERTY.title]: titleProperty([]),
});

/** 기술스택 속성이 스키마 드리프트로 multi_select가 아닌 rich_text로 내려온 경우 → techStack: []. */
const pageWrongTypeTechStack = createPage("malformed-wrong-type-tech-stack", {
  [NOTION_PROPERTY.title]: titleProperty(["기술스택 타입 오류 페이지"]),
  [NOTION_PROPERTY.techStack]: richTextProperty("Next.js, TypeScript"),
});

/** 요약 속성이 아예 없는 경우 → summary: "". */
const pageMissingSummary = createPage("malformed-missing-summary", {
  [NOTION_PROPERTY.title]: titleProperty(["요약 없는 페이지"]),
});

/** GitHub 링크/데모 링크 속성은 존재하지만 url이 null인 경우 → githubUrl: "", demoUrl: undefined. */
const pageNullUrls = createPage("malformed-null-urls", {
  [NOTION_PROPERTY.title]: titleProperty(["링크가 비어있는 페이지"]),
  [NOTION_PROPERTY.github]: urlProperty(null),
  [NOTION_PROPERTY.demo]: urlProperty(null),
});

/** 썸네일이 Notion에 업로드된 "file" 타입 파일인 경우 → file.url이 thumbnailUrl로 매핑되어야 한다. */
const pageFileHostedThumbnail = createPage("malformed-file-hosted-thumbnail", {
  [NOTION_PROPERTY.title]: titleProperty(["Notion 업로드 썸네일 페이지"]),
  [NOTION_PROPERTY.thumbnail]: fileHostedFilesProperty(
    "https://notion-hosted.example.com/thumbnail.png",
  ),
});

/** 기간 속성 키 자체가 properties에 없는 경우 → period: undefined. */
const pageMissingPeriod = createPage("malformed-missing-period", {
  [NOTION_PROPERTY.title]: titleProperty(["기간 없는 페이지"]),
});

/** 대표 속성이 스키마 드리프트로 checkbox가 아닌 rich_text로 내려온 경우 → featured: false. */
const pageWrongTypeFeatured = createPage("malformed-wrong-type-featured", {
  [NOTION_PROPERTY.title]: titleProperty(["대표 속성 타입 오류 페이지"]),
  [NOTION_PROPERTY.featured]: richTextProperty("true"),
});

export {
  mockNotionPages,
  pageMissingTitle,
  pageEmptyTitleArray,
  pageWrongTypeTechStack,
  pageMissingSummary,
  pageNullUrls,
  pageFileHostedThumbnail,
  pageMissingPeriod,
  pageWrongTypeFeatured,
};
