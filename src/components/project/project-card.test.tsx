import { describe, expect, it } from "vitest";

import { mockProjects } from "@/lib/mock/projects";
import { render, screen } from "@/test/utils";

import { ProjectCard } from "./project-card";

describe("ProjectCard", () => {
  it("썸네일이 있는 프로젝트는 제목/요약과 상세 페이지 링크, 썸네일 이미지를 렌더한다", () => {
    const project = mockProjects[0];
    render(<ProjectCard project={project} />);

    expect(screen.getByText(project.title)).toBeInTheDocument();
    expect(screen.getByText(project.summary)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      `/projects/${project.id}`,
    );
    expect(screen.getByRole("img", { name: project.title })).toBeInTheDocument();
  });

  it("썸네일이 없는 프로젝트는 이미지 대신 플레이스홀더를 렌더한다", () => {
    const project = mockProjects.find((p) => !p.thumbnailUrl);
    if (!project) throw new Error("썸네일 없는 픽스처가 필요합니다");

    render(<ProjectCard project={project} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("기간이 없는 프로젝트는 '기간 미정'을 렌더한다", () => {
    const project = mockProjects.find((p) => !p.period);
    if (!project) throw new Error("기간 없는 픽스처가 필요합니다");

    render(<ProjectCard project={project} />);

    expect(screen.getByText("기간 미정")).toBeInTheDocument();
  });
});
