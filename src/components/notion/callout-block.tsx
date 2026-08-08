import type { CalloutBlockObjectResponse } from "@notionhq/client";

import { RichText } from "./rich-text";

function CalloutIcon({ icon }: { icon: CalloutBlockObjectResponse["callout"]["icon"] }) {
  if (!icon) return null;

  switch (icon.type) {
    case "emoji":
      return (
        <span aria-hidden="true" className="text-lg leading-none">
          {icon.emoji}
        </span>
      );
    case "external":
      return <img src={icon.external.url} alt="" className="size-5" />;
    case "file":
      return <img src={icon.file.url} alt="" className="size-5" />;
    default:
      return null;
  }
}

function CalloutBlock({ block }: { block: CalloutBlockObjectResponse }) {
  return (
    <div className="flex gap-3 rounded-lg bg-muted p-4">
      <CalloutIcon icon={block.callout.icon} />
      <div className="leading-7">
        <RichText richText={block.callout.rich_text} />
      </div>
    </div>
  );
}

export { CalloutBlock };
