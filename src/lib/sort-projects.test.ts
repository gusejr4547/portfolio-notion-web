import { describe, expect, it } from "vitest";

import { mockProjects } from "@/lib/mock/projects";
import { sortProjectsByPeriodDesc } from "@/lib/sort-projects";
import type { ProjectPeriod, ProjectSummary } from "@/types/project";

describe("sortProjectsByPeriodDesc", () => {
  it("셔플된 mockProjects 사본을 기간(period.start) 기준 최신순으로 정렬하고, 기간이 없는 항목은 맨 뒤로 보낸다", () => {
    const shuffled = [
      mockProjects[3],
      mockProjects[5],
      mockProjects[1],
      mockProjects[0],
      mockProjects[4],
      mockProjects[2],
    ];

    const result = sortProjectsByPeriodDesc(shuffled);

    expect(result.map((project) => project.id)).toEqual([
      "mock-project-2",
      "mock-project-1",
      "mock-project-3",
      "mock-project-4",
      "mock-project-5",
      "mock-project-6",
    ]);
  });

  it("기간이 없는 항목끼리는 원래 순서를 그대로 유지한다(안정 정렬)", () => {
    const items: { id: string; period?: ProjectPeriod }[] = [
      { id: "no-period-a", period: undefined },
      { id: "no-start-b", period: { start: "" } as unknown as ProjectPeriod },
      { id: "no-period-c", period: undefined },
    ];

    const result = sortProjectsByPeriodDesc(items);

    expect(result.map((item) => item.id)).toEqual(["no-period-a", "no-start-b", "no-period-c"]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const original = [...mockProjects];
    const originalIds = original.map((project) => project.id);

    sortProjectsByPeriodDesc(original);

    expect(original.map((project) => project.id)).toEqual(originalIds);
  });

  it("빈 배열을 입력하면 빈 배열을 반환한다", () => {
    expect(sortProjectsByPeriodDesc([])).toEqual([]);
  });

  it("모든 항목에 기간이 없으면 원래 순서를 그대로 유지한다", () => {
    const items: { id: string; period?: ProjectPeriod }[] = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ];

    const result = sortProjectsByPeriodDesc(items);

    expect(result.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("period.start가 동일한 두 항목은 원래 순서를 유지한다", () => {
    const items: { id: string; period?: ProjectPeriod }[] = [
      { id: "first", period: { start: "2025-01-01" } },
      { id: "second", period: { start: "2025-01-01" } },
    ];

    const result = sortProjectsByPeriodDesc(items);

    expect(result.map((item) => item.id)).toEqual(["first", "second"]);
  });

  it("ProjectSummary 형태의 최소 객체에도 제네릭이 정상 동작한다", () => {
    const summaries: Pick<ProjectSummary, "id" | "period">[] = [
      { id: "summary-old", period: { start: "2024-01-01" } },
      { id: "summary-new", period: { start: "2025-01-01" } },
    ];

    const result = sortProjectsByPeriodDesc(summaries);

    expect(result.map((item) => item.id)).toEqual(["summary-new", "summary-old"]);
  });
});
