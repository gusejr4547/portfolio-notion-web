import { describe, expect, it } from "vitest";

import { mockProjects } from "@/lib/mock/projects";
import { findAdjacentProjects } from "@/lib/project-navigation";

describe("findAdjacentProjects", () => {
  it("배열의 첫 번째 항목을 조회하면 previous는 null, next는 그 다음 항목이다", () => {
    const result = findAdjacentProjects(mockProjects, mockProjects[0].id);

    expect(result.previous).toBeNull();
    expect(result.next?.id).toBe(mockProjects[1].id);
  });

  it("배열의 마지막 항목을 조회하면 next는 null, previous는 그 이전 항목이다", () => {
    const lastIndex = mockProjects.length - 1;

    const result = findAdjacentProjects(mockProjects, mockProjects[lastIndex].id);

    expect(result.next).toBeNull();
    expect(result.previous?.id).toBe(mockProjects[lastIndex - 1].id);
  });

  it("배열 중간 항목을 조회하면 previous/next 둘 다 올바른 인접 항목을 반환한다", () => {
    const middleIndex = 2;

    const result = findAdjacentProjects(mockProjects, mockProjects[middleIndex].id);

    expect(result.previous?.id).toBe(mockProjects[middleIndex - 1].id);
    expect(result.next?.id).toBe(mockProjects[middleIndex + 1].id);
  });

  it("단일 요소 배열이면 previous/next 둘 다 null이다", () => {
    const single = [{ id: "only" }];

    const result = findAdjacentProjects(single, "only");

    expect(result).toEqual({ previous: null, next: null });
  });

  it("currentId가 배열에 존재하지 않으면 previous/next 둘 다 null이다", () => {
    const result = findAdjacentProjects(mockProjects, "not-exist");

    expect(result).toEqual({ previous: null, next: null });
  });

  it("빈 배열을 입력해도 에러 없이 {previous: null, next: null}을 반환한다", () => {
    const result = findAdjacentProjects([], "anything");

    expect(result).toEqual({ previous: null, next: null });
  });
});
