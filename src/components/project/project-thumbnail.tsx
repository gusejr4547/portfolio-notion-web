import { Image as ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function ProjectThumbnail({
  thumbnailUrl,
  title,
  className,
}: {
  thumbnailUrl?: string;
  title: string;
  className?: string;
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
    <img
      src={thumbnailUrl}
      alt={title}
      className={cn("object-cover", className)}
    />
  );
}

export { ProjectThumbnail };
