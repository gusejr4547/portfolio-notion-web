import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

import { ProjectLinks } from "@/components/project/project-links";
import { TechStackBadges } from "@/components/project/tech-stack-badges";
import { mockProjects } from "@/lib/mock/projects";
import type { ProjectPeriod } from "@/types/project";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

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

export async function generateMetadata(
  { params }: ProjectDetailPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  const project = mockProjects.find((item) => item.id === id);

  return {
    title: project ? project.title : "프로젝트를 찾을 수 없습니다",
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const project = mockProjects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-24">
      {project.thumbnailUrl ? (
        <img
          src={project.thumbnailUrl}
          alt={project.title}
          className="aspect-video w-full rounded-lg object-cover"
        />
      ) : null}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {project.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatPeriod(project.period)}
        </p>
      </div>

      <TechStackBadges techStack={project.techStack} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">소개</h2>
        {/* TODO(Task005/009): Notion 블록 렌더러 도입 전까지 요약(summary)으로 본문을 임시 대체 */}
        <p className="text-muted-foreground">{project.summary}</p>
      </section>

      <ProjectLinks githubUrl={project.githubUrl} demoUrl={project.demoUrl} />
    </div>
  );
}
