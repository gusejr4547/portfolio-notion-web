import type { RichTextItemResponse } from "@notionhq/client";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Notion rich text 배열을 렌더링한다. annotations는 아이템당 flat boolean 세트이므로
 * 중첩 span 없이 클래스 조합만으로 처리한다. `color`/`underline`은 스코프 아웃.
 */
function RichText({ richText }: { richText: RichTextItemResponse[] }) {
  return (
    <>
      {richText.map((item, index) => {
        const className = cn(
          item.annotations.bold && "font-bold",
          item.annotations.italic && "italic",
          item.annotations.strikethrough && "line-through",
          item.annotations.code &&
            "rounded bg-muted px-1 py-0.5 font-mono text-sm text-foreground",
        );

        if (item.href) {
          return (
            <Link
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("underline underline-offset-2", className)}
            >
              {item.plain_text}
            </Link>
          );
        }

        return (
          <span key={index} className={className || undefined}>
            {item.plain_text}
          </span>
        );
      })}
    </>
  );
}

export { RichText };
