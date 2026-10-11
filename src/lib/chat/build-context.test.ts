import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createImageBlock,
  createParagraphBlock,
  richTextItem,
} from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import type { Profile } from "@/types/profile";
import type { Project } from "@/types/project";

import { buildChatContext, sanitizeContextText } from "./build-context";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

const mocks = vi.hoisted(() => ({
  retrieveMarkdown: vi.fn(),
  getProjects: vi.fn(),
  getProjectBlocks: vi.fn(),
  getOptionalProfile: vi.fn(),
}));

vi.mock("@/lib/notion/client", () => ({
  notion: { pages: { retrieveMarkdown: mocks.retrieveMarkdown } },
}));
vi.mock("@/lib/notion/projects", () => ({
  getProjects: mocks.getProjects,
  getProjectBlocks: mocks.getProjectBlocks,
}));
vi.mock("@/lib/notion/profile", () => ({
  getOptionalProfile: mocks.getOptionalProfile,
}));

function project(overrides: Partial<Project>): Project {
  return {
    id: "p",
    title: "프로젝트",
    summary: "요약",
    techStack: ["TypeScript"],
    githubUrl: "https://github.com/me/p",
    featured: false,
    ...overrides,
  };
}

const profile: Profile = {
  name: "홍길동",
  leadingBlocks: [
    createParagraphBlock("intro", [richTextItem("백엔드에 관심이 많아요.")]),
  ],
  skills: [{ category: "Backend", proficient: ["Spring"], familiar: ["Go"] }],
  trailingBlocks: [
    createParagraphBlock("award", [richTextItem("교내 해커톤 대상")]),
  ],
};

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.getOptionalProfile.mockResolvedValue(profile);
  mocks.getProjects.mockResolvedValue([
    project({
      id: "old",
      title: "옛 프로젝트",
      period: { start: "2023-01-01", end: "2023-06-01" },
    }),
    project({
      id: "new",
      title: "새 프로젝트",
      featured: true,
      demoUrl: "https://demo.example.com",
      period: { start: "2025-03-01" },
    }),
  ]);
  mocks.retrieveMarkdown.mockImplementation(
    async ({ page_id }: { page_id: string }) => ({
      markdown: `${page_id} 본문입니다.`,
      truncated: false,
    }),
  );
  mocks.getProjectBlocks.mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("buildChatContext", () => {
  it("프로필(소개·기술 스택·뒷부분)과 프로젝트 메타데이터·본문을 최신순으로 담는다", async () => {
    const context = await buildChatContext();

    expect(context).toContain("이름: 홍길동");
    expect(context).toContain("백엔드에 관심이 많아요.");
    expect(context).toContain(
      "- Backend\n  - 많이 해봤어요: Spring\n  - 해본 적 있어요: Go",
    );
    expect(context).toContain("교내 해커톤 대상");
    expect(context).toContain("## 프로젝트 (2개, 최신순)");
    expect(context).toContain("### 새 프로젝트 (대표 프로젝트)");
    expect(context).toContain("- 기간: 2025.03 ~ 진행중");
    expect(context).toContain("- 데모: https://demo.example.com");
    expect(context).toContain("new 본문입니다.");
    expect(context.indexOf("새 프로젝트")).toBeLessThan(
      context.indexOf("옛 프로젝트"),
    );
    expect(mocks.getProjectBlocks).not.toHaveBeenCalled();
  });

  it("마크다운 조회가 실패하면 블록 변환으로 대체한다", async () => {
    mocks.retrieveMarkdown.mockRejectedValue(new Error("unsupported"));
    mocks.getProjectBlocks.mockResolvedValue([
      createParagraphBlock("b", [richTextItem("블록에서 온 본문")]),
    ]);

    const context = await buildChatContext();

    expect(context).toContain("블록에서 온 본문");
    expect(mocks.getProjectBlocks).toHaveBeenCalledWith("new");
  });

  it("마크다운이 잘렸으면(truncated) 블록 변환으로 대체한다", async () => {
    mocks.retrieveMarkdown.mockResolvedValue({
      markdown: "잘린 본문",
      truncated: true,
    });
    mocks.getProjectBlocks.mockResolvedValue([
      createParagraphBlock("b", [richTextItem("전체 본문")]),
      createImageBlock("img"),
    ]);

    const context = await buildChatContext();

    expect(context).not.toContain("잘린 본문");
    expect(context).toContain("전체 본문");
  });

  it("본문 조회가 모두 실패해도 메타데이터는 남긴다", async () => {
    mocks.retrieveMarkdown.mockRejectedValue(new Error("down"));
    mocks.getProjectBlocks.mockRejectedValue(new Error("down"));

    const context = await buildChatContext();

    expect(context).toContain("### 새 프로젝트");
    expect(context).toContain("- 기술스택: TypeScript");
  });

  it("프로필이 없으면 프로젝트 섹션만 만든다", async () => {
    mocks.getOptionalProfile.mockResolvedValue(null);

    const context = await buildChatContext();

    expect(context).not.toContain("## 프로필");
    expect(context.startsWith("## 프로젝트")).toBe(true);
  });

  it("프로젝트 목록 조회 실패는 호출자에게 전달한다", async () => {
    mocks.getProjects.mockRejectedValue(new Error("notion down"));

    await expect(buildChatContext()).rejects.toThrow("notion down");
  });
});

describe("sanitizeContextText", () => {
  it("이미지 마크다운과 Notion 미디어 태그를 제거한다", () => {
    const text = sanitizeContextText(
      '앞 ![스크린샷](https://s3.example.com/a.png?sig=1) 뒤\n<image source="https://s3.example.com/b.png">캡션</image>\n끝',
    );

    expect(text).toBe("앞  뒤\n\n끝");
  });

  it("전화번호를 제거하되 URL·ID·기간 속 숫자는 남긴다", () => {
    const text = sanitizeContextText(
      [
        "전화: 010-1234-5678 / 01012345678 / +82 10-1234-5678",
        "페이지: https://www.notion.so/0101234567890abcdef",
        "기간: 2023.01 ~ 2024.06",
      ].join("\n"),
    );

    expect(text.split("\n")[0].trimEnd()).toBe("전화:  /  /");
    expect(text).toContain("https://www.notion.so/0101234567890abcdef");
    expect(text).toContain("기간: 2023.01 ~ 2024.06");
  });

  it("<br> 태그를 줄바꿈으로 바꾼다", () => {
    expect(sanitizeContextText("첫 줄<br>둘째 줄<br/>셋째 줄")).toBe(
      "첫 줄\n둘째 줄\n셋째 줄",
    );
  });

  it("세 줄 이상 연속된 빈 줄을 하나로 줄인다", () => {
    expect(sanitizeContextText("a\n\n\n\nb")).toBe("a\n\nb");
  });
});
