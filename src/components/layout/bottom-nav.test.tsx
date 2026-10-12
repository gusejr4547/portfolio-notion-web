import { usePathname } from "next/navigation";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test/utils";

import { BottomNav } from "./bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

function renderAt(pathname: string) {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return render(<BottomNav />);
}

// BottomNav는 usePathname을 쓰는 client 컴포넌트라 유닛(jsdom)에서 경로를 mock해 검증한다.
describe("BottomNav", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReset();
  });

  it("주요 메뉴 nav 안에 홈/프로젝트 링크를 올바른 href로 렌더한다", () => {
    renderAt("/");

    const nav = screen.getByRole("navigation", { name: "주요 메뉴" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "프로젝트" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("홈(/)에서는 홈만 현재 페이지로 표시한다", () => {
    renderAt("/");

    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "프로젝트" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("프로젝트 목록(/projects)에서는 프로젝트만 현재 페이지로 표시한다", () => {
    renderAt("/projects");

    expect(screen.getByRole("link", { name: "프로젝트" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("프로젝트 상세(/projects/[id])에서도 프로젝트를 현재 페이지로 표시한다", () => {
    renderAt("/projects/abc-123");

    expect(screen.getByRole("link", { name: "프로젝트" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("챗 링크를 렌더하고 /chat에서는 챗만 현재 페이지로 표시한다", () => {
    renderAt("/chat");

    expect(screen.getByRole("link", { name: "챗" })).toHaveAttribute("href", "/chat");
    expect(screen.getByRole("link", { name: "챗" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "프로젝트" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("서버 렌더 결과에는 활성 표시가 없어 서버 pathname과 무관하게 하이드레이션이 일치한다", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    const html = renderToString(<BottomNav />);

    expect(html).not.toContain("aria-current");
  });

  it("독은 이동 전용이라 테마 전환 버튼을 포함하지 않는다", () => {
    renderAt("/");

    expect(
      screen.queryByRole("button", { name: "테마 전환" }),
    ).not.toBeInTheDocument();
  });
});
