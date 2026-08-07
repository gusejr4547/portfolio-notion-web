import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/utils";

import { TechStackBadges } from "./tech-stack-badges";

describe("TechStackBadges", () => {
  it("전달된 기술스택 항목을 모두 텍스트로 렌더한다", () => {
    render(<TechStackBadges techStack={["Next.js", "TypeScript", "TailwindCSS"]} />);

    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("TailwindCSS")).toBeInTheDocument();
  });
});
