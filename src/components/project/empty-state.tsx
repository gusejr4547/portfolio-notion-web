import { FolderOpen } from "lucide-react";

function EmptyState({
  title = "등록된 프로젝트가 없습니다",
  description = "새 프로젝트가 등록되면 이곳에 표시됩니다.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <FolderOpen className="size-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export { EmptyState };
