import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/utils";

import { ProjectNavigation } from "./project-navigation";

describe("ProjectNavigation", () => {
  it("previous/next가 모두 있으면 두 링크 모두 렌더되고 각각 올바른 href를 가진다", () => {
    render(
      <ProjectNavigation
        previous={{ id: "prev-id", title: "이전 프로젝트 제목" }}
        next={{ id: "next-id", title: "다음 프로젝트 제목" }}
      />,
    );

    const previousLink = screen.getByRole("button", {
      name: "이전 프로젝트: 이전 프로젝트 제목",
    });
    expect(previousLink).toHaveAttribute("href", "/projects/prev-id");
    expect(previousLink).toHaveAttribute("rel", "prev");

    const nextLink = screen.getByRole("button", {
      name: "다음 프로젝트: 다음 프로젝트 제목",
    });
    expect(nextLink).toHaveAttribute("href", "/projects/next-id");
    expect(nextLink).toHaveAttribute("rel", "next");
  });

  it("previous만 있으면 이전 링크만 렌더된다", () => {
    render(
      <ProjectNavigation
        previous={{ id: "prev-id", title: "이전 프로젝트 제목" }}
        next={null}
      />,
    );

    expect(
      screen.getByRole("button", { name: "이전 프로젝트: 이전 프로젝트 제목" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^다음 프로젝트/ }),
    ).not.toBeInTheDocument();
  });

  it("next만 있으면 다음 링크만 렌더된다", () => {
    render(
      <ProjectNavigation
        previous={null}
        next={{ id: "next-id", title: "다음 프로젝트 제목" }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "다음 프로젝트: 다음 프로젝트 제목" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^이전 프로젝트/ }),
    ).not.toBeInTheDocument();
  });

  it("previous/next가 모두 null이면 nav가 렌더되지 않는다", () => {
    render(<ProjectNavigation previous={null} next={null} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
