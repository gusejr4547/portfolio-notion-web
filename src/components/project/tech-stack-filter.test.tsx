import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test/utils";

import { TechStackFilter } from "./tech-stack-filter";

describe("TechStackFilter", () => {
  it("옵션별로 버튼을 렌더한다", () => {
    render(
      <TechStackFilter
        options={["Next.js", "TypeScript", "TailwindCSS"]}
        selected={[]}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Next.js" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "TypeScript" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "TailwindCSS" }),
    ).toBeInTheDocument();
  });

  it("옵션 버튼 클릭 시 onToggle을 해당 기술명으로 호출한다", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <TechStackFilter
        options={["Next.js", "TypeScript"]}
        selected={[]}
        onToggle={onToggle}
        onClear={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "TypeScript" }));

    expect(onToggle).toHaveBeenCalledWith("TypeScript");
  });

  it("선택된 옵션의 버튼에는 aria-pressed=true가 붙는다", () => {
    render(
      <TechStackFilter
        options={["Next.js", "TypeScript"]}
        selected={["TypeScript"]}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "TypeScript" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Next.js" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("selected가 비어있으면 필터 초기화 버튼을 렌더하지 않는다", () => {
    render(
      <TechStackFilter
        options={["Next.js"]}
        selected={[]}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "필터 초기화" }),
    ).not.toBeInTheDocument();
  });

  it("selected가 있으면 필터 초기화 버튼을 렌더하고 클릭 시 onClear를 호출한다", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <TechStackFilter
        options={["Next.js"]}
        selected={["Next.js"]}
        onToggle={vi.fn()}
        onClear={onClear}
      />,
    );

    const clearButton = screen.getByRole("button", { name: "필터 초기화" });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    expect(onClear).toHaveBeenCalledOnce();
  });
});
