import { ImageOff } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProjectPeriod, ProjectSummary } from "@/types/project";

import { TechStackBadges } from "./tech-stack-badges";

/** "YYYY-MM-DD" 문자열을 "YYYY.MM"으로 슬라이싱 변환한다. */
function formatYearMonth(date: string) {
  return date.slice(0, 7).replace("-", ".");
}

function formatPeriod(period: ProjectPeriod | undefined) {
  if (!period) {
    return "기간 미정";
  }

  const start = formatYearMonth(period.start);
  const end = period.end ? formatYearMonth(period.end) : "진행중";

  return `${start} ~ ${end}`;
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-muted">
            <ImageOff className="size-8 text-muted-foreground" />
          </div>
        )}
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
