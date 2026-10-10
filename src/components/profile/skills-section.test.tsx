import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/utils";
import type { SkillGroup } from "@/types/profile";

import { SkillsSection } from "./skills-section";

const groups: SkillGroup[] = [
  { category: "Language", proficient: ["Java"], familiar: ["Python", "JavaScript"] },
  { category: "Frontend", proficient: [], familiar: ["React"] },
];

describe("SkillsSection", () => {
  it("분야명과 각 분야의 기술을 모두 렌더한다", () => {
    render(<SkillsSection groups={groups} />);

    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("Frontend")).toBeInTheDocument();
    for (const skill of ["Java", "Python", "JavaScript", "React"]) {
      expect(screen.getByText(skill)).toBeInTheDocument();
    }
  });

  it("'많이 해봤어요'는 채운 배지, '해본 적 있어요'는 윤곽선 배지로 구분한다", () => {
    render(<SkillsSection groups={groups} />);

    expect(screen.getByText("Java")).toHaveClass("bg-primary");
    expect(screen.getByText("Python")).toHaveClass("border-border");
    expect(screen.getByText("Python")).not.toHaveClass("bg-primary");
  });

  it("두 숙련도의 의미를 알려주는 범례를 보여준다", () => {
    render(<SkillsSection groups={groups} />);

    expect(screen.getByText("많이 해봤어요")).toBeInTheDocument();
    expect(screen.getByText("해본 적 있어요")).toBeInTheDocument();
  });

  it("그룹이 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<SkillsSection groups={[]} />);

    expect(container.querySelector("dl")).toBeNull();
    expect(screen.queryByText("많이 해봤어요")).not.toBeInTheDocument();
  });
});
