import { describe, expect, it } from "vitest";

import {
  createHeadingBlock,
  createParagraphBlock,
  createQuoteBlock,
  richTextItem,
} from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import { render, screen } from "@/test/utils";

import { HeadingBlock, ParagraphBlock, QuoteBlock } from "./text-blocks";

describe("ParagraphBlock", () => {
  it("rich_text 내용을 <p> 태그로 렌더한다", () => {
    const block = createParagraphBlock("paragraph-1");
    if (block.type !== "paragraph") throw new Error("paragraph 픽스처가 필요합니다");

    render(<ParagraphBlock block={block} />);

    expect(screen.getByText("문단 paragraph-1")).toBeInTheDocument();
  });

  it("문단 안의 줄바꿈이 접히지 않도록 whitespace-pre-line을 적용한다", () => {
    const block = createParagraphBlock("paragraph-2", [richTextItem("첫 줄\n둘째 줄")]);
    if (block.type !== "paragraph") throw new Error("paragraph 픽스처가 필요합니다");

    render(<ParagraphBlock block={block} />);

    const paragraph = screen.getByText(/첫 줄/);
    expect(paragraph.closest("p")).toHaveClass("whitespace-pre-line");
    expect(paragraph.textContent).toBe("첫 줄\n둘째 줄");
  });
});

describe("HeadingBlock", () => {
  it("heading_1은 h3 태그로 렌더된다", () => {
    const block = createHeadingBlock("heading-1", 1);
    if (block.type !== "heading_1") throw new Error("heading_1 픽스처가 필요합니다");

    render(<HeadingBlock block={block} />);

    expect(screen.getByRole("heading", { level: 3, name: "제목 heading-1" })).toBeInTheDocument();
  });

  it("heading_2는 h4 태그로 렌더된다", () => {
    const block = createHeadingBlock("heading-2", 2);
    if (block.type !== "heading_2") throw new Error("heading_2 픽스처가 필요합니다");

    render(<HeadingBlock block={block} />);

    expect(screen.getByRole("heading", { level: 4, name: "제목 heading-2" })).toBeInTheDocument();
  });

  it("heading_3은 h5 태그로 렌더된다", () => {
    const block = createHeadingBlock("heading-3", 3);
    if (block.type !== "heading_3") throw new Error("heading_3 픽스처가 필요합니다");

    render(<HeadingBlock block={block} />);

    expect(screen.getByRole("heading", { level: 5, name: "제목 heading-3" })).toBeInTheDocument();
  });
});

describe("QuoteBlock", () => {
  it("rich_text 내용을 <blockquote> 태그로 렌더한다", () => {
    const block = createQuoteBlock("quote-1");
    if (block.type !== "quote") throw new Error("quote 픽스처가 필요합니다");

    render(<QuoteBlock block={block} />);

    const quote = screen.getByText("인용구 quote-1");
    expect(quote.closest("blockquote")).toBeInTheDocument();
  });
});
