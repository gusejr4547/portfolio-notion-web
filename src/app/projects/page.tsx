import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProjectExplorer } from "@/components/project/project-explorer";
import { getProjects } from "@/lib/notion";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "프로젝트",
  description: "등록된 프로젝트를 한눈에 볼 수 있는 목록입니다.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="mx-auto max-w-5xl px-4 py-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">프로젝트</h1>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/export" />}
        >
          PDF로 내보내기
        </Button>
      </div>
      <section className="mt-8">
        <ProjectExplorer projects={projects} />
      </section>
    </div>
  );
}
