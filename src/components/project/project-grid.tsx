import type { ProjectSummary } from "@/types/project";

import { EmptyState } from "./empty-state";
import { ProjectCard } from "./project-card";

function ProjectGrid({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        // lg:grid-cols-3 기준 첫 행(최대 3장)은 뷰포트에 따라 동시에 폴드 안에 들어올 수
        // 있어 실제로 LCP 요소로 관측됨(Next 런타임 경고 기준) — eager 로딩으로 전환한다.
        <ProjectCard key={project.id} project={project} priority={index < 3} />
      ))}
    </div>
  );
}

export { ProjectGrid };
