import { describe, expect, it } from "vitest";

import {
  consecutiveBulletedListItems,
  consecutiveNumberedListItems,
  createParagraphBlock,
  interruptedListBlocks,
  mockNotionBlocks,
} from "@/lib/notion/__fixtures__/notion-blocks.fixtures";

import { groupBlocksForRendering } from "./group-blocks";

describe("groupBlocksForRendering", () => {
  it("연속된 bulleted_list_item을 하나의 bulleted-list 그룹으로 묶는다", () => {
    const result = groupBlocksForRendering(consecutiveBulletedListItems);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ kind: "bulleted-list" });
    if (result[0]?.kind === "bulleted-list") {
      expect(result[0].items).toHaveLength(3);
    }
  });

  it("연속된 numbered_list_item을 하나의 numbered-list 그룹으로 묶는다", () => {
    const result = groupBlocksForRendering(consecutiveNumberedListItems);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ kind: "numbered-list" });
    if (result[0]?.kind === "numbered-list") {
      expect(result[0].items).toHaveLength(3);
    }
  });

  it("리스트 중간에 다른 블록이 끼면 그룹이 둘로 나뉜다", () => {
    const result = groupBlocksForRendering(interruptedListBlocks);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.kind)).toEqual([
      "bulleted-list",
      "block",
      "bulleted-list",
    ]);
    if (result[0]?.kind === "bulleted-list") {
      expect(result[0].items).toHaveLength(2);
    }
    if (result[2]?.kind === "bulleted-list") {
      expect(result[2].items).toHaveLength(1);
    }
  });

  it("리스트가 아닌 블록은 각각 독립된 block 그룹으로 취급한다", () => {
    const blocks = [createParagraphBlock("p1"), createParagraphBlock("p2")];

    const result = groupBlocksForRendering(blocks);

    expect(result).toEqual([
      { kind: "block", block: blocks[0] },
      { kind: "block", block: blocks[1] },
    ]);
  });

  it("빈 배열이 주어지면 빈 배열을 반환한다", () => {
    expect(groupBlocksForRendering([])).toEqual([]);
  });

  it("전체 문서 시나리오에서 각 그룹의 kind 순서가 원본 블록 순서와 일치한다", () => {
    const result = groupBlocksForRendering(mockNotionBlocks);

    // mockNotionBlocks 순서: heading, paragraph, heading, bulleted*2, heading,
    // numbered*2, quote, code, table(unsupported), image, callout, bookmark, divider
    expect(result.map((item) => item.kind)).toEqual([
      "block", // heading_1
      "block", // paragraph
      "block", // heading_2
      "bulleted-list", // bulleted*2
      "block", // heading_3
      "numbered-list", // numbered*2
      "block", // quote
      "block", // code
      "block", // table (unsupported, group-blocks는 타입을 가리지 않고 통과시킨다)
      "block", // image
      "block", // callout
      "block", // bookmark
      "block", // divider
    ]);
  });
});
