import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function ProjectThumbnail({
  thumbnailUrl,
  title,
  className,
  priority = false,
}: {
  thumbnailUrl?: string;
  title: string;
  className?: string;
  priority?: boolean;
}) {
  if (!thumbnailUrl) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted", className)}
      >
        <ImageIcon className="size-10 text-muted-foreground/60" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      src={thumbnailUrl}
      alt={title}
      width={640}
      height={360}
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      loading={priority ? "eager" : "lazy"}
      className={cn("bg-muted object-contain", className)}
    />
  );
}

export { ProjectThumbnail };
