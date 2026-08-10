import { describe, expect, it } from "vitest";

import { collectTechStackOptions, filterProjectsByTechStack } from "@/lib/filter-projects";
import { mockProjects } from "@/lib/mock/projects";

describe("filterProjectsByTechStack", () => {
  it("선택이 비어 있으면 원본을 그대로 반환한다", () => {
    const result = filterProjectsByTechStack(mockProjects, []);

    expect(result).toEqual(mockProjects);
  });

  it("선택한 기술 중 하나라도 포함하면 노출한다(OR 매칭)", () => {
    const result = filterProjectsByTechStack(mockProjects, ["React"]);

    expect(result.map((project) => project.id)).toEqual(["mock-project-2", "mock-project-3"]);
  });

  it("여러 기술을 선택하면 합집합으로 매칭한다", () => {
    const result = filterProjectsByTechStack(mockProjects, ["Rust", "Vue"]);

    expect(result.map((project) => project.id)).toEqual(["mock-project-4", "mock-project-5"]);
  });

  it("일치하는 프로젝트가 없으면 빈 배열을 반환한다", () => {
    const result = filterProjectsByTechStack(mockProjects, ["Svelte"]);

    expect(result).toEqual([]);
  });

  it("빈 프로젝트 목록을 입력하면 빈 배열을 반환한다", () => {
    expect(filterProjectsByTechStack([], ["React"])).toEqual([]);
  });
});

describe("collectTechStackOptions", () => {
  it("모든 프로젝트의 기술스택을 중복 없이 사전순으로 정렬해 반환한다", () => {
    const result = collectTechStackOptions([
      { techStack: ["React", "Node.js"] },
      { techStack: ["React", "Chart.js"] },
    ]);

    expect(result).toEqual(["Chart.js", "Node.js", "React"]);
  });

  it("빈 프로젝트 목록을 입력하면 빈 배열을 반환한다", () => {
    expect(collectTechStackOptions([])).toEqual([]);
  });

  it("기술스택이 빈 배열인 프로젝트가 섞여 있어도 정상 동작한다", () => {
    const result = collectTechStackOptions([{ techStack: [] }, { techStack: ["Go"] }]);

    expect(result).toEqual(["Go"]);
  });
});
