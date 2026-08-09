import Image from "next/image";
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
    case "file":
      return (
        <Image
          src={icon.type === "external" ? icon.external.url : icon.file.url}
          alt=""
          width={20}
          height={20}
          className="size-5"
          unoptimized={icon.type === "external"}
        />
      );
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
