import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/utils";

import { Header } from "./header";

// Header는 async가 아닌 sync Server Component라 유닛 테스트가 가능하다
// (공식 문서: async Server Component는 Vitest 미지원, E2E 권장).
describe("Header", () => {
  it("nav 링크 3개를 올바른 href로 렌더한다", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "/docs",
    );
    expect(screen.getByRole("link", { name: "Components" })).toHaveAttribute(
      "href",
      "/components",
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("로고 링크는 홈(/)으로 이동한다", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Starter Kit" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
