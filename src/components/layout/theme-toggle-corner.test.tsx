import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/utils";

import { ThemeToggleCorner } from "./theme-toggle-corner";

describe("ThemeToggleCorner", () => {
  it("테마 전환 버튼을 렌더한다", () => {
    render(<ThemeToggleCorner />);

    expect(screen.getByRole("button", { name: "테마 전환" })).toBeInTheDocument();
  });

  it("화면에 고정(fixed)하지 않고 페이지와 함께 스크롤되는 absolute 배치다", () => {
    render(<ThemeToggleCorner />);

    // render가 provider를 감싸므로 버튼에서 가장 가까운 absolute/fixed 조상을 찾는다.
    const button = screen.getByRole("button", { name: "테마 전환" });
    expect(button.closest(".absolute")).not.toBeNull();
    expect(button.closest(".fixed")).toBeNull();
  });
});
