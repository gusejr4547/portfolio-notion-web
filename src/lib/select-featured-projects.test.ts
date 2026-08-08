import { describe, expect, it } from "vitest";

import { mockProjects } from "@/lib/mock/projects";
import { selectFeaturedProjects } from "@/lib/select-featured-projects";
import type { ProjectPeriod } from "@/types/project";

describe("selectFeaturedProjects", () => {
  it("대표(featured)로 체크된 항목이 일부 있으면 해당 항목만 원래 순서대로 반환한다", () => {
    const result = selectFeaturedProjects(mockProjects);

    expect(result.map((project) => project.id)).toEqual(["mock-project-1", "mock-project-2"]);
  });

  it("모든 항목이 대표(featured)이면 개수 제한 없이 전부 반환한다", () => {
    const items: { id: string; featured: boolean; period?: ProjectPeriod }[] = [
      { id: "a", featured: true, period: { start: "2025-01-01" } },
      { id: "b", featured: true, period: { start: "2025-02-01" } },
      { id: "c", featured: true, period: { start: "2025-03-01" } },
      { id: "d", featured: true, period: { start: "2025-04-01" } },
    ];

    const result = selectFeaturedProjects(items);

    expect(result.map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("대표(featured)로 체크된 항목이 없으면 기간 최신순 상위 3개를 반환한다", () => {
    const items: { id: string; featured: boolean; period?: ProjectPeriod }[] = [
      { id: "a", featured: false, period: { start: "2025-01-01" } },
      { id: "b", featured: false, period: { start: "2025-04-01" } },
      { id: "c", featured: false, period: { start: "2025-03-01" } },
      { id: "d", featured: false, period: { start: "2025-02-01" } },
    ];

    const result = selectFeaturedProjects(items);

    expect(result.map((item) => item.id)).toEqual(["b", "c", "d"]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const original = [...mockProjects];
    const originalIds = original.map((project) => project.id);

    selectFeaturedProjects(original);

    expect(original.map((project) => project.id)).toEqual(originalIds);
  });

  it("빈 배열을 입력하면 빈 배열을 반환한다", () => {
    expect(selectFeaturedProjects([])).toEqual([]);
  });

  it("fallbackLimit을 지정하면 대표가 없을 때 해당 개수만큼만 반환한다", () => {
    const items: { id: string; featured: boolean; period?: ProjectPeriod }[] = [
      { id: "a", featured: false, period: { start: "2025-01-01" } },
      { id: "b", featured: false, period: { start: "2025-04-01" } },
      { id: "c", featured: false, period: { start: "2025-03-01" } },
      { id: "d", featured: false, period: { start: "2025-02-01" } },
    ];

    const result = selectFeaturedProjects(items, 2);

    expect(result.map((item) => item.id)).toEqual(["b", "c"]);
  });
});
