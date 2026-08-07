import { ProjectGrid } from "@/components/project/project-grid";
import { mockProjects } from "@/lib/mock/projects";

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">프로젝트</h1>
      <div className="mt-8">
        <ProjectGrid projects={mockProjects} />
      </div>
    </div>
  );
}
