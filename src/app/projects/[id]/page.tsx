import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

import { NotionBlockRenderer } from "@/components/notion/notion-block-renderer";
import { ProjectLinks } from "@/components/project/project-links";
import { TechStackBadges } from "@/components/project/tech-stack-badges";
import { formatPeriod } from "@/lib/format-period";
import {
  getProjectById,
  getProjectBlocks,
  getProjects,
  NotionDataAccessError,
} from "@/lib/notion";

export const revalidate = 600;

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: ProjectDetailPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;

  try {
    const project = await getProjectById(id);
    const parentMeta = await parent;
    const canonicalPath = `/projects/${id}`;

    return {
      title: project.title,
      description: project.summary,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: project.title,
        description: project.summary,
        type: "website",
        url: canonicalPath,
        siteName: parentMeta.openGraph?.siteName,
        locale: parentMeta.openGraph?.locale,
        images: project.thumbnailUrl
          ? [project.thumbnailUrl]
          : (parentMeta.openGraph?.images ?? []),
      },
    };
  } catch (error) {
    if (error instanceof NotionDataAccessError && error.kind === "not_found") {
      return { title: "프로젝트를 찾을 수 없습니다" };
    }

    throw error;
  }
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;

  let project;
  try {
    project = await getProjectById(id);
  } catch (error) {
    if (error instanceof NotionDataAccessError && error.kind === "not_found") {
      notFound();
    }

    throw error;
  }

  const blocks = await getProjectBlocks(id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-24">
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
        <NotionBlockRenderer blocks={blocks} />
      </section>

      <ProjectLinks githubUrl={project.githubUrl} demoUrl={project.demoUrl} />
    </div>
  );
}

export async function generateStaticParams() {
  const projects = await getProjects();

  return projects.map((project) => ({ id: project.id }));
}
