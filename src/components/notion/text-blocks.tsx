import type {
  Heading1BlockObjectResponse,
  Heading2BlockObjectResponse,
  Heading3BlockObjectResponse,
  ParagraphBlockObjectResponse,
  QuoteBlockObjectResponse,
} from "@notionhq/client";

import { RichText } from "./rich-text";

function ParagraphBlock({ block }: { block: ParagraphBlockObjectResponse }) {
  return (
    <p className="leading-7">
      <RichText richText={block.paragraph.rich_text} />
    </p>
  );
}

/**
 * 상세 페이지가 이미 h1(제목)/h2(소개)를 사용하므로, Notion heading_1/2/3을
 * 한 단계 낮춰 h3/h4/h5로 매핑한다.
 */
function HeadingBlock({
  block,
}: {
  block: Heading1BlockObjectResponse | Heading2BlockObjectResponse | Heading3BlockObjectResponse;
}) {
  switch (block.type) {
    case "heading_1":
      return (
        <h3 className="text-xl font-semibold tracking-tight">
          <RichText richText={block.heading_1.rich_text} />
        </h3>
      );
    case "heading_2":
      return (
        <h4 className="text-lg font-semibold tracking-tight">
          <RichText richText={block.heading_2.rich_text} />
        </h4>
      );
    case "heading_3":
      return (
        <h5 className="text-base font-semibold tracking-tight">
          <RichText richText={block.heading_3.rich_text} />
        </h5>
      );
  }
}

function QuoteBlock({ block }: { block: QuoteBlockObjectResponse }) {
  return (
    <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
      <RichText richText={block.quote.rich_text} />
    </blockquote>
  );
}

export { ParagraphBlock, HeadingBlock, QuoteBlock };
