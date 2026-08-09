import type { Metadata } from "next";

import { ProjectGrid } from "@/components/project/project-grid";
import { getProjects } from "@/lib/notion";
import { sortProjectsByPeriodDesc } from "@/lib/sort-projects";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "프로젝트",
  description: "등록된 프로젝트를 한눈에 볼 수 있는 목록입니다.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  const sortedProjects = sortProjectsByPeriodDesc(projects);

  return (
    <div className="mx-auto max-w-5xl px-4 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">프로젝트</h1>
      <section className="mt-8">
        <ProjectGrid projects={sortedProjects} />
      </section>
    </div>
  );
}
