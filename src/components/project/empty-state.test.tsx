import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/utils";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("기본 제목/설명 문구를 렌더한다", () => {
    render(<EmptyState />);

    expect(
      screen.getByText("등록된 프로젝트가 없습니다"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("새 프로젝트가 등록되면 이곳에 표시됩니다."),
    ).toBeInTheDocument();
  });

  it("커스텀 title/description을 전달하면 반영한다", () => {
    render(
      <EmptyState title="검색 결과가 없습니다" description="다른 조건으로 다시 시도해주세요." />,
    );

    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
    expect(
      screen.getByText("다른 조건으로 다시 시도해주세요."),
    ).toBeInTheDocument();
  });
});
