import type { Metadata, ResolvingMetadata } from "next";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: ProjectDetailPageProps,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;

  return {
    title: id,
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">프로젝트 상세</h1>
      <p className="mt-4 text-muted-foreground">준비 중입니다. (id: {id})</p>
    </div>
  );
}
