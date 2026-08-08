import { describe, expect, it } from "vitest";

import { createCodeBlock } from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import { render, screen } from "@/test/utils";

import { CodeBlock } from "./code-block";

describe("CodeBlock", () => {
  it("rich_text 내용을 <pre><code>로 렌더한다", () => {
    const block = createCodeBlock("code-1", "console.log('hi');", "javascript");
    if (block.type !== "code") throw new Error("code 픽스처가 필요합니다");

    render(<CodeBlock block={block} />);

    expect(screen.getByText("console.log('hi');")).toBeInTheDocument();
    expect(screen.getByText("console.log('hi');").tagName).toBe("CODE");
    expect(screen.getByText("console.log('hi');").closest("pre")).toBeInTheDocument();
  });
});
