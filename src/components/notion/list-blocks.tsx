import type {
  BlockObjectResponse,
  BulletedListItemBlockObjectResponse,
  NumberedListItemBlockObjectResponse,
} from "@notionhq/client";

import { RichText } from "./rich-text";

function isBulletedListItem(
  block: BlockObjectResponse,
): block is BulletedListItemBlockObjectResponse {
  return block.type === "bulleted_list_item";
}

function isNumberedListItem(
  block: BlockObjectResponse,
): block is NumberedListItemBlockObjectResponse {
  return block.type === "numbered_list_item";
}

function BulletedList({ items }: { items: BlockObjectResponse[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5">
      {items.filter(isBulletedListItem).map((item) => (
        <li key={item.id}>
          <RichText richText={item.bulleted_list_item.rich_text} />
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: BlockObjectResponse[] }) {
  return (
    <ol className="flex list-decimal flex-col gap-1 pl-5">
      {items.filter(isNumberedListItem).map((item) => (
        <li key={item.id}>
          <RichText richText={item.numbered_list_item.rich_text} />
        </li>
      ))}
    </ol>
  );
}

export { BulletedList, NumberedList };
