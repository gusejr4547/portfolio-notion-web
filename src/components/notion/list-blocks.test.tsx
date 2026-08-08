import { describe, expect, it } from "vitest";

import {
  consecutiveBulletedListItems,
  consecutiveNumberedListItems,
} from "@/lib/notion/__fixtures__/notion-blocks.fixtures";
import { render, screen } from "@/test/utils";

import { BulletedList, NumberedList } from "./list-blocks";

describe("BulletedList", () => {
  it("전달받은 항목들을 하나의 <ul>과 각 <li>로 렌더한다", () => {
    render(<BulletedList items={consecutiveBulletedListItems} />);

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("첫 번째 항목")).toBeInTheDocument();
    expect(screen.getByText("세 번째 항목")).toBeInTheDocument();
  });
});

describe("NumberedList", () => {
  it("전달받은 항목들을 하나의 <ol>과 각 <li>로 렌더한다", () => {
    render(<NumberedList items={consecutiveNumberedListItems} />);

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("첫 번째 단계")).toBeInTheDocument();
    expect(screen.getByText("세 번째 단계")).toBeInTheDocument();
  });
});
