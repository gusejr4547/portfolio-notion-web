import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client";

/** 링크가 걸린 텍스트는 모델이 주소를 안내할 수 있도록 "텍스트 (URL)" 형태로 남긴다. */
function richTextToString(richText: RichTextItemResponse[]): string {
  return richText
    .map((item) => {
      const text = item.plain_text;
      if (!item.href || item.href === text) return text;
      return `${text} (${item.href.replace(/^mailto:/, "")})`;
    })
    .join("");
}

function blockToLine(block: BlockObjectResponse): string | null {
  switch (block.type) {
    case "paragraph":
      return richTextToString(block.paragraph.rich_text);
    case "heading_1":
      return `# ${richTextToString(block.heading_1.rich_text)}`;
    case "heading_2":
      return `## ${richTextToString(block.heading_2.rich_text)}`;
    case "heading_3":
      return `### ${richTextToString(block.heading_3.rich_text)}`;
    case "bulleted_list_item":
      return `- ${richTextToString(block.bulleted_list_item.rich_text)}`;
    case "numbered_list_item":
      return `1. ${richTextToString(block.numbered_list_item.rich_text)}`;
    case "to_do":
      return `- [${block.to_do.checked ? "x" : " "}] ${richTextToString(block.to_do.rich_text)}`;
    case "toggle":
      return `- ${richTextToString(block.toggle.rich_text)}`;
    case "quote":
      return `> ${richTextToString(block.quote.rich_text)}`;
    case "callout":
      return `> ${richTextToString(block.callout.rich_text)}`;
    case "code":
      return `\`\`\`${block.code.language}\n${richTextToString(block.code.rich_text)}\n\`\`\``;
    case "bookmark": {
      const caption = richTextToString(block.bookmark.caption);
      return caption
        ? `${caption} (${block.bookmark.url})`
        : block.bookmark.url;
    }
    default:
      // 이미지·구분선·하위 DB 등은 대화 근거로 쓸 텍스트가 없어 제외한다.
      return null;
  }
}

/**
 * Notion 블록 목록을 모델 컨텍스트용 마크다운 비슷한 평문으로 바꾼다.
 * `pages.retrieveMarkdown`을 쓸 수 없을 때의 대체 경로이며, 하위 블록 재귀는 하지 않는다.
 */
export function blocksToText(blocks: BlockObjectResponse[]): string {
  return blocks
    .map(blockToLine)
    .filter((line): line is string => line !== null && line.trim() !== "")
    .join("\n");
}
