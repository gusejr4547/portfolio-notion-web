import { describe, expect, it } from "vitest";

import { createBookmarkBlock, richTextItem } from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import { render, screen } from "@/test/utils";

import { BookmarkBlock } from "./bookmark-block";

describe("BookmarkBlock", () => {
  it("url을 새 탭 링크로 렌더한다", () => {
    const block = createBookmarkBlock("bookmark-1", "https://example.com/post");
    if (block.type !== "bookmark") throw new Error("bookmark 픽스처가 필요합니다");

    render(<BookmarkBlock block={block} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/post");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("caption이 있으면 함께 렌더하고, 없으면 렌더하지 않는다", () => {
    const withCaption = createBookmarkBlock("bookmark-2", "https://example.com/a", [
      richTextItem("북마크 설명"),
    ]);
    if (withCaption.type !== "bookmark") throw new Error("bookmark 픽스처가 필요합니다");
    render(<BookmarkBlock block={withCaption} />);
    expect(screen.getByText("북마크 설명")).toBeInTheDocument();

    const withoutCaption = createBookmarkBlock("bookmark-3", "https://example.com/b");
    if (withoutCaption.type !== "bookmark") throw new Error("bookmark 픽스처가 필요합니다");
    render(<BookmarkBlock block={withoutCaption} />);
    expect(screen.getByText("https://example.com/b")).toBeInTheDocument();
  });
});
