import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        프로젝트를 찾을 수 없습니다
      </h1>
      <p className="text-muted-foreground">
        요청하신 프로젝트가 존재하지 않거나 삭제되었습니다.
      </p>
      <Button nativeButton={false} render={<Link href="/projects" />}>
        프로젝트 목록으로 돌아가기
      </Button>
    </div>
  );
}
