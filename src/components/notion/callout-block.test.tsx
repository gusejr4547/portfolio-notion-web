import { describe, expect, it } from "vitest";

import {
  calloutIconEmojiBlock,
  calloutIconExternalBlock,
  calloutIconNullBlock,
} from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import { render, screen } from "@/test/utils";

import { CalloutBlock } from "./callout-block";

describe("CalloutBlock", () => {
  it("icon이 없으면 텍스트만 렌더하고 아이콘 이미지는 렌더하지 않는다", () => {
    if (calloutIconNullBlock.type !== "callout") throw new Error("callout 픽스처가 필요합니다");

    render(<CalloutBlock block={calloutIconNullBlock} />);

    expect(screen.getByText("아이콘 없는 콜아웃")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("icon이 emoji이면 이모지 문자를 렌더한다", () => {
    if (calloutIconEmojiBlock.type !== "callout") throw new Error("callout 픽스처가 필요합니다");

    render(<CalloutBlock block={calloutIconEmojiBlock} />);

    expect(screen.getByText("💡")).toBeInTheDocument();
    expect(screen.getByText("이모지 콜아웃")).toBeInTheDocument();
  });

  it("icon이 external이면 이미지를 렌더한다", () => {
    if (calloutIconExternalBlock.type !== "callout")
      throw new Error("callout 픽스처가 필요합니다");

    render(<CalloutBlock block={calloutIconExternalBlock} />);

    // 아이콘 이미지는 장식용(alt="")이라 접근성 역할이 "img"가 아닌 "presentation"이 된다.
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://example.com/icon.png",
    );
  });
});
