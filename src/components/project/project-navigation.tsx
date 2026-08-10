import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/types/project";

type ProjectNavigationProps = {
  previous: Pick<ProjectSummary, "id" | "title"> | null;
  next: Pick<ProjectSummary, "id" | "title"> | null;
};

function ProjectNavigation({ previous, next }: ProjectNavigationProps) {
  if (!previous && !next) {
    return null;
  }

  return (
    <nav
      aria-label="이전/다음 프로젝트"
      className="flex flex-wrap items-center justify-between gap-2"
    >
      {previous ? (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/projects/${previous.id}`} rel="prev" />}
        >
          이전 프로젝트: {previous.title}
        </Button>
      ) : null}
      {next ? (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/projects/${next.id}`} rel="next" />}
          className="ml-auto"
        >
          다음 프로젝트: {next.title}
        </Button>
      ) : null}
    </nav>
  );
}

export { ProjectNavigation };
