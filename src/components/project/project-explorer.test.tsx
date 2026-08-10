import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockProjects } from "@/lib/mock/projects";
import { render, screen } from "@/test/utils";

import { ProjectExplorer } from "./project-explorer";

function linkHrefs() {
  return screen
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));
}

describe("ProjectExplorer", () => {
  it("기본 렌더 시 전체 프로젝트가 기간 기준 최신순(desc)으로 표시된다", () => {
    render(<ProjectExplorer projects={mockProjects} />);

    // period.start 기준 최신순: mock-project-2(2026-04-01) > mock-project-1(2026-01-05)
    // > mock-project-3(2025-09-10) > mock-project-4(2025-06-15) > mock-project-5(2025-03-01)
    // > mock-project-6(period 없음, 항상 마지막)
    expect(linkHrefs()).toEqual([
      "/projects/mock-project-2",
      "/projects/mock-project-1",
      "/projects/mock-project-3",
      "/projects/mock-project-4",
      "/projects/mock-project-5",
      "/projects/mock-project-6",
    ]);
  });

  it("기술스택 필터 버튼을 클릭하면 해당 기술을 가진 프로젝트만 표시된다", async () => {
    const user = userEvent.setup();
    render(<ProjectExplorer projects={mockProjects} />);

    // "Rust"는 mock-project-4(오픈소스 CLI 도구)만 보유한 기술스택이다.
    await user.click(screen.getByRole("button", { name: "Rust" }));

    expect(linkHrefs()).toEqual(["/projects/mock-project-4"]);
  });

  it("필터 결과가 0건이면 전용 안내 문구를 보여준다", async () => {
    // OR 매칭 특성상(filterProjectsByTechStack) TechStackFilter의 옵션은 항상
    // projects prop 자체에서 파생되므로, 실제로 존재하는 버튼을 클릭해 얻은
    // selectedTechStack은 반드시 최소 한 프로젝트와 매칭된다. 즉 "존재하는 옵션을
    // 클릭"하는 것만으로는 0건 상태를 구성할 수 없다. filterProjectsByTechStack의
    // 반환값만 빈 배열로 강제해 이 안내 문구 자체가 올바르게 뜨는지를 검증한다.
    vi.resetModules();
    vi.doMock("@/lib/filter-projects", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("@/lib/filter-projects")>();
      return {
        ...actual,
        filterProjectsByTechStack: () => [],
      };
    });

    const { ProjectExplorer: MockedProjectExplorer } = await import(
      "./project-explorer"
    );
    const user = userEvent.setup();
    render(<MockedProjectExplorer projects={mockProjects} />);

    await user.click(screen.getByRole("button", { name: "Rust" }));

    expect(
      screen.getByText("조건에 맞는 프로젝트가 없습니다"),
    ).toBeInTheDocument();
    expect(screen.getByText("다른 기술스택을 선택해보세요.")).toBeInTheDocument();

    vi.doUnmock("@/lib/filter-projects");
    vi.resetModules();
  });

  it("정렬 토글에서 '오래된순'을 클릭하면 첫 프로젝트가 바뀐다", async () => {
    const user = userEvent.setup();
    render(<ProjectExplorer projects={mockProjects} />);

    expect(linkHrefs()[0]).toBe("/projects/mock-project-2");

    await user.click(screen.getByRole("button", { name: "오래된순" }));

    // period.start 기준 오래된순: mock-project-5(2025-03-01)가 가장 먼저 온다.
    expect(linkHrefs()[0]).toBe("/projects/mock-project-5");
  });

  it("필터를 선택했다가 '필터 초기화'를 클릭하면 전체 목록이 복원된다", async () => {
    const user = userEvent.setup();
    render(<ProjectExplorer projects={mockProjects} />);

    await user.click(screen.getByRole("button", { name: "Rust" }));
    expect(linkHrefs()).toEqual(["/projects/mock-project-4"]);

    await user.click(screen.getByRole("button", { name: "필터 초기화" }));

    expect(linkHrefs()).toHaveLength(mockProjects.length);
  });
});
