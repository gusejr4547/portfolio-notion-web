import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/utils";

import { ProjectThumbnail } from "./project-thumbnail";

describe("ProjectThumbnail", () => {
  it("thumbnailUrl이 있으면 img를 렌더한다", () => {
    render(
      <ProjectThumbnail
        thumbnailUrl="https://example.com/thumb.png"
        title="프로젝트 1"
      />,
    );

    const img = screen.getByRole("img", { name: "프로젝트 1" });
    expect(img).toHaveAttribute("src", "https://example.com/thumb.png");
  });

  it("thumbnailUrl이 없으면 img 대신 플레이스홀더를 렌더한다", () => {
    render(<ProjectThumbnail title="프로젝트 2" />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
