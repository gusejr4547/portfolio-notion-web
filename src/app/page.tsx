import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ProfileSection } from "@/components/profile/profile-section";
import { ProjectGrid } from "@/components/project/project-grid";
import { getOptionalProfile, getProjects } from "@/lib/notion";
import { selectFeaturedProjects } from "@/lib/select-featured-projects";

export const revalidate = 600;

export const metadata: Metadata = {
  description: "Notion에 정리한 프로젝트를 웹에서 소개합니다.",
};

export default async function Home() {
  const [projects, profile] = await Promise.all([
    getProjects(),
    getOptionalProfile(),
  ]);
  const featuredProjects = selectFeaturedProjects(projects);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-24">
      {profile ? (
        <ProfileSection profile={profile} />
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            포트폴리오
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Notion에 정리한 프로젝트를 웹에서 소개합니다.
          </p>
        </div>
      )}

      <section className="flex flex-col gap-6">
        {/* 프로필 섹션 제목(소개·기술 스택 등)과 같은 구분선 스타일 */}
        <h2 className="border-b pb-2 text-2xl font-semibold tracking-tight">
          대표 프로젝트
        </h2>
        <ProjectGrid projects={featuredProjects} />
        <div className="flex justify-center">
          <Button nativeButton={false} render={<Link href="/projects" />}>
            전체 프로젝트 보기
          </Button>
        </div>
      </section>
    </div>
  );
}
