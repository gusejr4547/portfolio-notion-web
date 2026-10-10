import { describe, expect, it } from "vitest";

import {
  createBulletedListItemBlock,
  createParagraphBlock,
  richTextItem,
} from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import { render, screen } from "@/test/utils";
import type { Profile } from "@/types/profile";

import { ProfileSection } from "./profile-section";

const profile: Profile = {
  name: "조현덕 CHO HYUN DEOK",
  leadingBlocks: [createParagraphBlock("intro", [richTextItem("소개 문단입니다.")])],
  skills: [{ category: "Backend", proficient: ["Spring Boot"], familiar: [] }],
  trailingBlocks: [
    createBulletedListItemBlock("education", [richTextItem("삼성 청년 SW 아카데미 9기")]),
  ],
};

describe("ProfileSection", () => {
  it("이름을 h1로 렌더한다", () => {
    render(<ProfileSection profile={profile} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "조현덕 CHO HYUN DEOK" }),
    ).toBeInTheDocument();
  });

  it("소개 → 기술 스택 → 학력 순서(Notion 본문 순서)로 렌더한다", () => {
    render(<ProfileSection profile={profile} />);

    const intro = screen.getByText("소개 문단입니다.");
    const skill = screen.getByText("Spring Boot");
    const education = screen.getByText("삼성 청년 SW 아카데미 9기");

    expect(intro.compareDocumentPosition(skill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(skill.compareDocumentPosition(education) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("기술 스택이 없어도 앞뒤 본문은 그대로 렌더한다", () => {
    render(<ProfileSection profile={{ ...profile, skills: [] }} />);

    expect(screen.getByText("소개 문단입니다.")).toBeInTheDocument();
    expect(screen.getByText("삼성 청년 SW 아카데미 9기")).toBeInTheDocument();
    expect(screen.queryByText("Spring Boot")).not.toBeInTheDocument();
  });
});
