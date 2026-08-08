import { describe, expect, it } from "vitest";

import { mockProjects } from "@/lib/mock/projects";

import {
  mockNotionPages,
  pageEmptyTitleArray,
  pageFileHostedThumbnail,
  pageMissingPeriod,
  pageMissingSummary,
  pageMissingTitle,
  pageNullUrls,
  pageWrongTypeFeatured,
  pageWrongTypeTechStack,
} from "./__fixtures__/notion-pages.fixtures";
import { mapPageToProject } from "./mapper";

describe("mapPageToProject", () => {
  it.each(mockNotionPages.map((page, index) => [page, mockProjects[index]] as const))(
    "mock-project-%# 픽스처를 mockProjects의 대응 항목과 동일한 Project로 매핑한다",
    (page, expected) => {
      expect(mapPageToProject(page)).toEqual(expected);
    },
  );

  it("제목 속성이 아예 없는 페이지는 매핑을 실패시킨다", () => {
    expect(() => mapPageToProject(pageMissingTitle)).toThrow();
  });

  it("제목 속성은 있지만 title 배열이 비어 있으면 매핑을 실패시킨다", () => {
    expect(() => mapPageToProject(pageEmptyTitleArray)).toThrow();
  });

  it("기술스택 속성이 multi_select가 아닌 타입으로 내려오면 빈 배열로 대체한다", () => {
    const result = mapPageToProject(pageWrongTypeTechStack);

    expect(result.techStack).toEqual([]);
  });

  it("요약 속성이 없으면 빈 문자열로 대체한다", () => {
    const result = mapPageToProject(pageMissingSummary);

    expect(result.summary).toBe("");
  });

  it("GitHub 링크가 null이면 빈 문자열로, 데모 링크가 null이면 undefined로 대체한다", () => {
    const result = mapPageToProject(pageNullUrls);

    expect(result.githubUrl).toBe("");
    expect(result.demoUrl).toBeUndefined();
  });

  it("Notion에 업로드된 file 타입 썸네일은 file.url을 그대로 읽는다", () => {
    const result = mapPageToProject(pageFileHostedThumbnail);

    expect(result.thumbnailUrl).toBe("https://notion-hosted.example.com/thumbnail.png");
  });

  it("기간 속성 키 자체가 없으면 undefined로 대체한다", () => {
    const result = mapPageToProject(pageMissingPeriod);

    expect(result.period).toBeUndefined();
  });

  it("대표 속성이 checkbox가 아닌 타입으로 내려오면 false로 대체한다", () => {
    const result = mapPageToProject(pageWrongTypeFeatured);

    expect(result.featured).toBe(false);
  });
});
