import { describe, expect, it } from "vitest";

import {
  createBookmarkBlock,
  createBulletedListItemBlock,
  createCalloutBlock,
  createCodeBlock,
  createDividerBlock,
  createHeadingBlock,
  createImageBlock,
  createNumberedListItemBlock,
  createParagraphBlock,
  createQuoteBlock,
  createUnsupportedBlock,
  richTextItem,
} from "@/lib/notion/__fixtures__/notion-blocks.fixtures";

import { blocksToText } from "./blocks-to-text";

describe("blocksToText", () => {
  it("텍스트 블록을 마크다운 비슷한 줄로 바꾼다", () => {
    const text = blocksToText([
      createHeadingBlock("h", 2, [richTextItem("소개")]),
      createParagraphBlock("p", [richTextItem("안녕하세요.")]),
      createBulletedListItemBlock("b", [richTextItem("항목")]),
      createNumberedListItemBlock("n", [richTextItem("순서")]),
      createQuoteBlock("q", [richTextItem("인용")]),
      createCalloutBlock("c", "emoji", [richTextItem("참고")]),
      createCodeBlock("code", "const a = 1;", "typescript"),
      createBookmarkBlock("bm", "https://example.com", [richTextItem("예시")]),
    ]);

    expect(text).toBe(
      [
        "## 소개",
        "안녕하세요.",
        "- 항목",
        "1. 순서",
        "> 인용",
        "> 참고",
        "```typescript\nconst a = 1;\n```",
        "예시 (https://example.com)",
      ].join("\n"),
    );
  });

  it("링크가 걸린 텍스트는 주소를 함께 남기고 mailto 접두사는 뗀다", () => {
    const text = blocksToText([
      createParagraphBlock("p", [
        richTextItem("GitHub", { href: "https://github.com/me" }),
        richTextItem(" · "),
        richTextItem("메일", { href: "mailto:me@example.com" }),
      ]),
    ]);

    expect(text).toBe("GitHub (https://github.com/me) · 메일 (me@example.com)");
  });

  it("이미지·구분선·지원하지 않는 블록과 빈 문단은 제외한다", () => {
    const text = blocksToText([
      createImageBlock("img"),
      createDividerBlock("d"),
      createUnsupportedBlock("t"),
      createParagraphBlock("empty", []),
      createParagraphBlock("p", [richTextItem("남는 문단")]),
    ]);

    expect(text).toBe("남는 문단");
  });
});
