import type { BookmarkBlockObjectResponse } from "@notionhq/client";
import Link from "next/link";

import { toSafeUrl } from "@/lib/safe-url";

function BookmarkBlock({ block }: { block: BookmarkBlockObjectResponse }) {
  const { url, caption } = block.bookmark;
  const captionText = caption.map((item) => item.plain_text).join("");
  const safeUrl = toSafeUrl(url);
  if (!safeUrl) return null;

  return (
    <Link
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1 rounded-xl p-4 ring-1 ring-foreground/10"
    >
      <span className="text-sm font-medium">{url}</span>
      {captionText ? (
        <span className="text-sm text-muted-foreground">{captionText}</span>
      ) : null}
    </Link>
  );
}

export { BookmarkBlock };
