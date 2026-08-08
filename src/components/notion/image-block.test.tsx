import { describe, expect, it } from "vitest";

import {
  imageExternalBlock,
  imageFileBlock,
} from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import { render, screen } from "@/test/utils";

import { ImageBlock } from "./image-block";

describe("ImageBlock", () => {
  it("external 타입 이미지는 external.url을 src로 렌더한다", () => {
    if (imageExternalBlock.type !== "image") throw new Error("image 픽스처가 필요합니다");

    render(<ImageBlock block={imageExternalBlock} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://picsum.photos/seed/image-external/640/360",
    );
  });

  it("file 타입 이미지는 file.url을 src로 렌더한다", () => {
    if (imageFileBlock.type !== "image") throw new Error("image 픽스처가 필요합니다");

    render(<ImageBlock block={imageFileBlock} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://notion-hosted.example.com/image.png",
    );
  });

  it("caption이 있으면 figcaption으로 렌더하고 alt에도 반영한다", () => {
    if (imageExternalBlock.type !== "image") throw new Error("image 픽스처가 필요합니다");
    const blockWithCaption: typeof imageExternalBlock = {
      ...imageExternalBlock,
      image: {
        ...imageExternalBlock.image,
        caption: [
          {
            type: "text",
            text: { content: "이미지 설명", link: null },
            plain_text: "이미지 설명",
            href: null,
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: "default",
            },
          },
        ],
      },
    };

    render(<ImageBlock block={blockWithCaption} />);

    expect(screen.getByText("이미지 설명")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("alt", "이미지 설명");
  });
});
