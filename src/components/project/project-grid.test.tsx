import { describe, expect, it } from "vitest";

import { mockProjects } from "@/lib/mock/projects";
import { render, screen } from "@/test/utils";

import { ProjectGrid } from "./project-grid";

describe("ProjectGrid", () => {
  it("프로젝트 목록을 전달하면 프로젝트 개수만큼 링크를 렌더한다", () => {
    render(<ProjectGrid projects={mockProjects} />);

    expect(screen.getAllByRole("link")).toHaveLength(mockProjects.length);
  });

  it("빈 배열을 전달하면 EmptyState 기본 문구를 렌더한다", () => {
    render(<ProjectGrid projects={[]} />);

    expect(screen.getByText("등록된 프로젝트가 없습니다")).toBeInTheDocument();
  });
});
