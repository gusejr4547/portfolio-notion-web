import type { BlockObjectResponse, RichTextItemResponse } from "@notionhq/client";

/**
 * notion-block-renderer 및 하위 블록 컴포넌트 테스트가 재사용할 원시 Notion 블록 픽스처.
 * `BlockObjectResponse`/각 블록 타입의 정확한 형태는
 * node_modules/@notionhq/client/build/src/api-endpoints/blocks.d.ts 기준으로 구성했다.
 */

function richTextItem(
  text: string,
  overrides: Partial<{
    href: string | null;
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
  }> = {},
): RichTextItemResponse {
  const {
    href = null,
    bold = false,
    italic = false,
    strikethrough = false,
    underline = false,
    code = false,
  } = overrides;

  return {
    type: "text",
    text: { content: text, link: href ? { url: href } : null },
    plain_text: text,
    href,
    annotations: { bold, italic, strikethrough, underline, code, color: "default" },
  } as RichTextItemResponse;
}

function blockBase(id: string, hasChildren = false) {
  return {
    object: "block" as const,
    id,
    parent: { type: "block_id" as const, block_id: "parent-block-id" },
    created_time: "2026-01-01T00:00:00.000Z",
    created_by: { object: "user" as const, id: "mock-user-id" },
    last_edited_time: "2026-01-01T00:00:00.000Z",
    last_edited_by: { object: "user" as const, id: "mock-user-id" },
    has_children: hasChildren,
    in_trash: false,
    archived: false,
  };
}

function createParagraphBlock(
  id: string,
  richText: RichTextItemResponse[] = [richTextItem(`문단 ${id}`)],
): BlockObjectResponse {
  return {
    ...blockBase(id),
    type: "paragraph",
    paragraph: { rich_text: richText, color: "default", icon: null },
  } as BlockObjectResponse;
}

function createHeadingBlock(
  id: string,
  level: 1 | 2 | 3,
  richText: RichTextItemResponse[] = [richTextItem(`제목 ${id}`)],
): BlockObjectResponse {
  const key = `heading_${level}` as const;

  return {
    ...blockBase(id),
    type: key,
    [key]: { rich_text: richText, color: "default", is_toggleable: false },
  } as BlockObjectResponse;
}

function createBulletedListItemBlock(
  id: string,
  richText: RichTextItemResponse[] = [richTextItem(`목록 항목 ${id}`)],
): BlockObjectResponse {
  return {
    ...blockBase(id),
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: richText, color: "default" },
  } as BlockObjectResponse;
}

function createNumberedListItemBlock(
  id: string,
  richText: RichTextItemResponse[] = [richTextItem(`번호 항목 ${id}`)],
): BlockObjectResponse {
  return {
    ...blockBase(id),
    type: "numbered_list_item",
    numbered_list_item: { rich_text: richText, color: "default" },
  } as BlockObjectResponse;
}

function createCodeBlock(
  id: string,
  code = "const value = 1;",
  language = "typescript",
): BlockObjectResponse {
  return {
    ...blockBase(id),
    type: "code",
    code: {
      rich_text: [richTextItem(code)],
      caption: [],
      language,
    },
  } as BlockObjectResponse;
}

function createImageBlock(
  id: string,
  variant: "external" | "file" = "external",
  url = `https://picsum.photos/seed/${id}/640/360`,
  caption: RichTextItemResponse[] = [],
): BlockObjectResponse {
  const image =
    variant === "external"
      ? { type: "external" as const, external: { url }, caption }
      : {
          type: "file" as const,
          file: { url, expiry_time: "2026-12-31T00:00:00.000Z" },
          caption,
        };

  return {
    ...blockBase(id),
    type: "image",
    image,
  } as BlockObjectResponse;
}

function createQuoteBlock(
  id: string,
  richText: RichTextItemResponse[] = [richTextItem(`인용구 ${id}`)],
): BlockObjectResponse {
  return {
    ...blockBase(id),
    type: "quote",
    quote: { rich_text: richText, color: "default" },
  } as BlockObjectResponse;
}

function createDividerBlock(id: string): BlockObjectResponse {
  return {
    ...blockBase(id),
    type: "divider",
    divider: {},
  } as BlockObjectResponse;
}

function createCalloutBlock(
  id: string,
  icon: "emoji" | "external" | null = "emoji",
  richText: RichTextItemResponse[] = [richTextItem(`콜아웃 ${id}`)],
): BlockObjectResponse {
  const iconValue =
    icon === "emoji"
      ? { type: "emoji" as const, emoji: "💡" }
      : icon === "external"
        ? { type: "external" as const, external: { url: "https://example.com/icon.png" } }
        : null;

  return {
    ...blockBase(id),
    type: "callout",
    callout: { rich_text: richText, color: "default", icon: iconValue },
  } as BlockObjectResponse;
}

function createBookmarkBlock(
  id: string,
  url = "https://example.com",
  caption: RichTextItemResponse[] = [],
): BlockObjectResponse {
  return {
    ...blockBase(id),
    type: "bookmark",
    bookmark: { url, caption },
  } as BlockObjectResponse;
}

/** 렌더러가 지원하지 않는 블록 타입(table)이 섞여도 렌더링이 중단되지 않는지 검증하는 픽스처. */
function createUnsupportedBlock(id: string): BlockObjectResponse {
  return {
    ...blockBase(id),
    type: "table",
    table: { has_column_header: false, has_row_header: false, table_width: 2 },
  } as BlockObjectResponse;
}

/** 어노테이션 조합(bold/italic/strikethrough/code/link 각각 + 조합) rich text 샘플. */
const richTextAnnotationSamples: RichTextItemResponse[] = [
  richTextItem("굵게", { bold: true }),
  richTextItem("기울임", { italic: true }),
  richTextItem("취소선", { strikethrough: true }),
  richTextItem("코드", { code: true }),
  richTextItem("링크", { href: "https://example.com" }),
  richTextItem("굵고 기울어진 링크", {
    bold: true,
    italic: true,
    href: "https://example.com/combo",
  }),
];

/** rich_text 배열이 비어 있는 paragraph 블록. */
const emptyParagraphBlock = createParagraphBlock("empty-paragraph", []);

/** 연속된 bulleted_list_item 3개 — 하나의 <ul>로 그룹핑되어야 한다. */
const consecutiveBulletedListItems: BlockObjectResponse[] = [
  createBulletedListItemBlock("bulleted-1", [richTextItem("첫 번째 항목")]),
  createBulletedListItemBlock("bulleted-2", [richTextItem("두 번째 항목")]),
  createBulletedListItemBlock("bulleted-3", [richTextItem("세 번째 항목")]),
];

/** 연속된 numbered_list_item 3개 — 하나의 <ol>로 그룹핑되어야 한다. */
const consecutiveNumberedListItems: BlockObjectResponse[] = [
  createNumberedListItemBlock("numbered-1", [richTextItem("첫 번째 단계")]),
  createNumberedListItemBlock("numbered-2", [richTextItem("두 번째 단계")]),
  createNumberedListItemBlock("numbered-3", [richTextItem("세 번째 단계")]),
];

/** 리스트 중간에 다른 블록이 끼어 그룹이 끊기는 케이스. */
const interruptedListBlocks: BlockObjectResponse[] = [
  createBulletedListItemBlock("interrupted-bulleted-1", [richTextItem("끊기기 전 항목 1")]),
  createBulletedListItemBlock("interrupted-bulleted-2", [richTextItem("끊기기 전 항목 2")]),
  createParagraphBlock("interrupting-paragraph", [richTextItem("중간에 끼어드는 문단")]),
  createBulletedListItemBlock("interrupted-bulleted-3", [richTextItem("끊긴 후 항목")]),
];

/** image 블록의 external/file 분기. */
const imageExternalBlock = createImageBlock(
  "image-external",
  "external",
  "https://picsum.photos/seed/image-external/640/360",
);
const imageFileBlock = createImageBlock(
  "image-file",
  "file",
  "https://notion-hosted.example.com/image.png",
);

/** callout 블록의 icon: null/emoji/external 분기. */
const calloutIconNullBlock = createCalloutBlock("callout-icon-null", null, [
  richTextItem("아이콘 없는 콜아웃"),
]);
const calloutIconEmojiBlock = createCalloutBlock("callout-icon-emoji", "emoji", [
  richTextItem("이모지 콜아웃"),
]);
const calloutIconExternalBlock = createCalloutBlock("callout-icon-external", "external", [
  richTextItem("외부 이미지 콜아웃"),
]);

/** 지원하는 12종 블록 전체 + 미지원 블록(table)을 섞은 전체 문서 시나리오. */
const mockNotionBlocks: BlockObjectResponse[] = [
  createHeadingBlock("doc-heading-1", 1, [richTextItem("헤딩 1 제목")]),
  createParagraphBlock("doc-paragraph-1", [richTextItem("본문 문단입니다.")]),
  createHeadingBlock("doc-heading-2", 2, [richTextItem("헤딩 2 제목")]),
  createBulletedListItemBlock("doc-bulleted-1", [richTextItem("불릿 항목 1")]),
  createBulletedListItemBlock("doc-bulleted-2", [richTextItem("불릿 항목 2")]),
  createHeadingBlock("doc-heading-3", 3, [richTextItem("헤딩 3 제목")]),
  createNumberedListItemBlock("doc-numbered-1", [richTextItem("번호 항목 1")]),
  createNumberedListItemBlock("doc-numbered-2", [richTextItem("번호 항목 2")]),
  createQuoteBlock("doc-quote", [richTextItem("인용된 문장입니다.")]),
  createCodeBlock("doc-code", "console.log('hello');", "javascript"),
  createUnsupportedBlock("doc-unsupported-table"),
  createImageBlock("doc-image", "external", "https://picsum.photos/seed/doc-image/640/360"),
  createCalloutBlock("doc-callout", "emoji", [richTextItem("참고하세요.")]),
  createBookmarkBlock("doc-bookmark", "https://example.com/bookmark", [
    richTextItem("북마크 설명"),
  ]),
  createDividerBlock("doc-divider"),
];

export {
  richTextItem,
  createParagraphBlock,
  createHeadingBlock,
  createBulletedListItemBlock,
  createNumberedListItemBlock,
  createCodeBlock,
  createImageBlock,
  createQuoteBlock,
  createDividerBlock,
  createCalloutBlock,
  createBookmarkBlock,
  createUnsupportedBlock,
  richTextAnnotationSamples,
  emptyParagraphBlock,
  consecutiveBulletedListItems,
  consecutiveNumberedListItems,
  interruptedListBlocks,
  imageExternalBlock,
  imageFileBlock,
  calloutIconNullBlock,
  calloutIconEmojiBlock,
  calloutIconExternalBlock,
  mockNotionBlocks,
};
