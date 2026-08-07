import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

function ProjectLinks({
  githubUrl,
  demoUrl,
}: Pick<Project, "githubUrl" | "demoUrl">) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        nativeButton={false}
        render={
          <Link href={githubUrl} target="_blank" rel="noopener noreferrer" />
        }
      >
        GitHub
      </Button>
      {demoUrl ? (
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href={demoUrl} target="_blank" rel="noopener noreferrer" />
          }
        >
          데모 보기
          <span data-icon="inline-end">
            <ExternalLink />
          </span>
        </Button>
      ) : null}
    </div>
  );
}

export { ProjectLinks };
