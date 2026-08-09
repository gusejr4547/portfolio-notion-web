import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPeriod } from "@/lib/format-period";
import type { ProjectSummary } from "@/types/project";

import { ProjectThumbnail } from "./project-thumbnail";
import { TechStackBadges } from "./tech-stack-badges";

function ProjectCard({
  project,
  priority = false,
}: {
  project: ProjectSummary;
  priority?: boolean;
}) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="h-full pt-0 transition-shadow hover:shadow-md">
        <ProjectThumbnail
          thumbnailUrl={project.thumbnailUrl}
          title={project.title}
          className="aspect-video w-full"
          priority={priority}
        />
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <CardDescription>{project.summary}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {formatPeriod(project.period)}
          </p>
          <TechStackBadges techStack={project.techStack} />
        </CardContent>
      </Card>
    </Link>
  );
}

export { ProjectCard };
