import type { ImageBlockObjectResponse } from "@notionhq/client";

function ImageBlock({ block }: { block: ImageBlockObjectResponse }) {
  const { image } = block;
  const url = image.type === "external" ? image.external.url : image.file.url;
  const caption = image.caption.map((item) => item.plain_text).join("");

  return (
    <figure className="flex flex-col gap-2">
      <img src={url} alt={caption || "프로젝트 이미지"} className="w-full rounded-lg object-cover" />
      {caption ? (
        <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

export { ImageBlock };
