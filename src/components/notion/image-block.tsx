import Image from "next/image";
import type { ImageBlockObjectResponse } from "@notionhq/client";

function ImageBlock({ block }: { block: ImageBlockObjectResponse }) {
  const { image } = block;
  const url = image.type === "external" ? image.external.url : image.file.url;
  const caption = image.caption.map((item) => item.plain_text).join("");
  const alt = caption || "프로젝트 이미지";

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
          unoptimized={image.type === "external"}
        />
      </div>
      {caption ? (
        <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

export { ImageBlock };
