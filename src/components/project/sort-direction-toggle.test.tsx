import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test/utils";

import { SortDirectionToggle } from "./sort-direction-toggle";

describe("SortDirectionToggle", () => {
  it("최신순/오래된순 버튼을 모두 렌더한다", () => {
    render(<SortDirectionToggle value="desc" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "최신순" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "오래된순" }),
    ).toBeInTheDocument();
  });

  it("현재 value와 일치하는 버튼만 aria-pressed=true이다", () => {
    render(<SortDirectionToggle value="desc" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "최신순" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "오래된순" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("다른 옵션 클릭 시 onChange가 해당 값으로 호출된다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortDirectionToggle value="desc" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "오래된순" }));

    expect(onChange).toHaveBeenCalledWith("asc");
  });
});
