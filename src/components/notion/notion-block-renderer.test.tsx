import { describe, expect, it } from "vitest";

import {
  consecutiveBulletedListItems,
  interruptedListBlocks,
  mockNotionBlocks,
} from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import { render, screen } from "@/test/utils";

import { NotionBlockRenderer } from "./notion-block-renderer";

describe("NotionBlockRenderer", () => {
  it("전체 문서 시나리오에서 지원하는 12종 블록의 대표 텍스트/역할이 모두 렌더된다", () => {
    render(<NotionBlockRenderer blocks={mockNotionBlocks} />);

    expect(screen.getByRole("heading", { level: 3, name: "헤딩 1 제목" })).toBeInTheDocument();
    expect(screen.getByText("본문 문단입니다.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "헤딩 2 제목" })).toBeInTheDocument();
    expect(screen.getByText("불릿 항목 1")).toBeInTheDocument();
    expect(screen.getByText("불릿 항목 2")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 5, name: "헤딩 3 제목" })).toBeInTheDocument();
    expect(screen.getByText("번호 항목 1")).toBeInTheDocument();
    expect(screen.getByText("번호 항목 2")).toBeInTheDocument();
    expect(screen.getByText("인용된 문장입니다.")).toBeInTheDocument();
    expect(screen.getByText("console.log('hello');")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.getByText("참고하세요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /https:\/\/example\.com\/bookmark/ })).toBeInTheDocument();
    expect(screen.getByText("북마크 설명")).toBeInTheDocument();
    // divider(Separator)는 base-ui Separator를 그대로 사용한다.
    expect(document.querySelector('[data-slot="separator"]')).toBeInTheDocument();
  });

  it("미지원 블록(table)이 섞여도 앞뒤 블록이 정상적으로 렌더된다", () => {
    render(<NotionBlockRenderer blocks={mockNotionBlocks} />);

    // doc-code(table 앞) / doc-image(table 뒤)가 모두 렌더되어야 렌더링이 중단되지 않은 것이다.
    expect(screen.getByText("console.log('hello');")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("연속된 리스트 아이템은 DOM에서 하나의 <ul>로 묶인다", () => {
    render(<NotionBlockRenderer blocks={consecutiveBulletedListItems} />);

    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("리스트 중간에 다른 블록이 끼면 두 개의 <ul>로 나뉜다", () => {
    render(<NotionBlockRenderer blocks={interruptedListBlocks} />);

    const lists = screen.getAllByRole("list");
    expect(lists).toHaveLength(2);
    expect(screen.getByText("중간에 끼어드는 문단")).toBeInTheDocument();
  });
});
