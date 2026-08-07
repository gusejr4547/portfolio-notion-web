import type { ProjectSummary } from "@/types/project";

import { EmptyState } from "./empty-state";
import { ProjectCard } from "./project-card";

function ProjectGrid({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

export { ProjectGrid };
