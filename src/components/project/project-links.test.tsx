import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/utils";

import { ProjectLinks } from "./project-links";

describe("ProjectLinks", () => {
  it("demoUrl이 있으면 GitHub/데모 링크가 각각 새 탭 속성과 함께 렌더된다", () => {
    render(
      <ProjectLinks
        githubUrl="https://github.com/example/repo"
        demoUrl="https://demo.example.com"
      />,
    );

    const githubLink = screen.getByRole("button", { name: "GitHub" });
    expect(githubLink).toHaveAttribute("href", "https://github.com/example/repo");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");

    const demoLink = screen.getByRole("button", { name: "데모 보기" });
    expect(demoLink).toHaveAttribute("href", "https://demo.example.com");
    expect(demoLink).toHaveAttribute("target", "_blank");
    expect(demoLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("demoUrl이 없으면 GitHub 링크만 렌더되고 데모 링크는 렌더되지 않는다", () => {
    render(
      <ProjectLinks githubUrl="https://github.com/example/repo" demoUrl={undefined} />,
    );

    expect(screen.getByRole("button", { name: "GitHub" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "데모 보기" }),
    ).not.toBeInTheDocument();
  });
});
