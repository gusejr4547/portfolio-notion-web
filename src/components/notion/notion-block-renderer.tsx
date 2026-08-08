import type { BlockObjectResponse } from "@notionhq/client";

import { Separator } from "@/components/ui/separator";

import { BookmarkBlock } from "./bookmark-block";
import { CalloutBlock } from "./callout-block";
import { CodeBlock } from "./code-block";
import { groupBlocksForRendering } from "./group-blocks";
import { ImageBlock } from "./image-block";
import { BulletedList, NumberedList } from "./list-blocks";
import { HeadingBlock, ParagraphBlock, QuoteBlock } from "./text-blocks";

function NotionBlock({ block }: { block: BlockObjectResponse }) {
  switch (block.type) {
    case "paragraph":
      return <ParagraphBlock block={block} />;
    case "heading_1":
    case "heading_2":
    case "heading_3":
      return <HeadingBlock block={block} />;
    case "quote":
      return <QuoteBlock block={block} />;
    case "code":
      return <CodeBlock block={block} />;
    case "image":
      return <ImageBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    case "bookmark":
      return <BookmarkBlock block={block} />;
    case "divider":
      return <Separator />;
    default:
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `NotionBlockRenderer: 지원하지 않는 블록 타입 "${block.type}"을 건너뜁니다.`,
        );
      }
      return null;
  }
}

/**
 * Notion 페이지 본문(flat 블록 배열)을 렌더링한다. `has_children`인 블록의 자식은
 * `getProjectBlocks`가 채워주지 않으므로 재귀 처리는 하지 않는다.
 */
function NotionBlockRenderer({ blocks }: { blocks: BlockObjectResponse[] }) {
  const items = groupBlocksForRendering(blocks);

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        switch (item.kind) {
          case "bulleted-list":
            return <BulletedList key={item.items[0]?.id} items={item.items} />;
          case "numbered-list":
            return <NumberedList key={item.items[0]?.id} items={item.items} />;
          case "block":
            return <NotionBlock key={item.block.id} block={item.block} />;
        }
      })}
    </div>
  );
}

export { NotionBlockRenderer };
