import type { BlockObjectResponse } from "@notionhq/client";

/**
 * Notion API는 bulleted_list_item/numbered_list_item을 개별 형제 블록으로 반환하고
 * <ul>/<ol>로 감싸주지 않으므로, 연속된 동일 타입 리스트 아이템을 하나의 렌더 단위로 묶는다.
 * 다른 블록이 중간에 끼면 그룹은 끊긴다.
 */
export type RenderItem =
  | { kind: "block"; block: BlockObjectResponse }
  | { kind: "bulleted-list"; items: BlockObjectResponse[] }
  | { kind: "numbered-list"; items: BlockObjectResponse[] };

function groupBlocksForRendering(blocks: BlockObjectResponse[]): RenderItem[] {
  const items: RenderItem[] = [];

  for (const block of blocks) {
    if (block.type === "bulleted_list_item") {
      const last = items[items.length - 1];
      if (last?.kind === "bulleted-list") {
        last.items.push(block);
        continue;
      }
      items.push({ kind: "bulleted-list", items: [block] });
      continue;
    }

    if (block.type === "numbered_list_item") {
      const last = items[items.length - 1];
      if (last?.kind === "numbered-list") {
        last.items.push(block);
        continue;
      }
      items.push({ kind: "numbered-list", items: [block] });
      continue;
    }

    items.push({ kind: "block", block });
  }

  return items;
}

export { groupBlocksForRendering };
