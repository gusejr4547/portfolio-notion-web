import { describe, expect, it } from "vitest";

import {
  createDefaultState,
  isProjectSelected,
  isSectionVisible,
  moveItem,
  moveItemTo,
  normalize,
  parse,
  serialize,
  toggleProfile,
  toggleProject,
  toggleSection,
} from "./selection";

describe("createDefaultState", () => {
  it("전부 켜진 상태로 시작한다", () => {
    const state = createDefaultState(["a", "b"]);
    expect(state.order).toEqual(["a", "b"]);
    expect(state.hiddenProjects).toEqual([]);
    expect(state.hiddenSections).toEqual({});
    expect(state.includeProfile).toBe(true);
  });
});

describe("moveItem", () => {
  it("위/아래로 한 칸 이동한다", () => {
    expect(moveItem(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("경계와 없는 id에서는 순서가 바뀌지 않는다", () => {
    expect(moveItem(["a", "b"], "a", "up")).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], "b", "down")).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], "x", "up")).toEqual(["a", "b"]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const order = ["a", "b"];
    moveItem(order, "a", "down");
    expect(order).toEqual(["a", "b"]);
  });
});

describe("moveItemTo", () => {
  it("대상 자리로 옮기고 나머지는 밀린다", () => {
    expect(moveItemTo(["a", "b", "c", "d"], "a", "c")).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
    expect(moveItemTo(["a", "b", "c", "d"], "d", "b")).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("같은 자리이거나 없는 id면 순서가 바뀌지 않고 원본도 유지된다", () => {
    const order = ["a", "b"];
    expect(moveItemTo(order, "a", "a")).toEqual(["a", "b"]);
    expect(moveItemTo(order, "x", "a")).toEqual(["a", "b"]);
    expect(moveItemTo(order, "a", "x")).toEqual(["a", "b"]);
    expect(order).toEqual(["a", "b"]);
  });
});

describe("토글", () => {
  it("프로젝트를 끄고 다시 켠다", () => {
    const off = toggleProject(createDefaultState(["a"]), "a");
    expect(isProjectSelected(off, "a")).toBe(false);
    expect(isProjectSelected(toggleProject(off, "a"), "a")).toBe(true);
  });

  it("섹션을 끄고 다시 켜면 항목이 정리된다", () => {
    const off = toggleSection(createDefaultState(["a"]), "a", "body");
    expect(isSectionVisible(off, "a", "body")).toBe(false);
    expect(isSectionVisible(off, "a", "summary")).toBe(true);

    const on = toggleSection(off, "a", "body");
    expect(isSectionVisible(on, "a", "body")).toBe(true);
    expect(on.hiddenSections).toEqual({});
  });

  it("프로필 포함 여부를 뒤집는다", () => {
    expect(toggleProfile(createDefaultState([])).includeProfile).toBe(false);
  });
});

describe("normalize", () => {
  it("삭제된 id는 제거하고 새 id는 끝에 추가한다", () => {
    const saved = {
      ...createDefaultState(["a", "b", "gone"]),
      hiddenProjects: ["gone", "b"],
      hiddenSections: { gone: ["body" as const], a: ["links" as const] },
    };
    const result = normalize(saved, ["b", "a", "new"]);
    expect(result.order).toEqual(["a", "b", "new"]);
    expect(result.hiddenProjects).toEqual(["b"]);
    expect(result.hiddenSections).toEqual({ a: ["links"] });
  });

  it("저장값이 없거나 형태가 틀리면 기본값을 돌려준다", () => {
    expect(normalize(null, ["a"])).toEqual(createDefaultState(["a"]));
    expect(normalize({ order: 1 } as never, ["a"])).toEqual(
      createDefaultState(["a"]),
    );
  });
});

describe("serialize / parse", () => {
  it("왕복 변환이 가능하다", () => {
    const state = toggleSection(createDefaultState(["a"]), "a", "summary");
    expect(parse(serialize(state))).toEqual(state);
  });

  it("깨진 JSON, 형태 불일치, 빈 값은 null", () => {
    expect(parse("{not json")).toBeNull();
    expect(parse('{"order":"x"}')).toBeNull();
    expect(
      parse(
        JSON.stringify({
          ...createDefaultState([]),
          hiddenSections: { a: ["nope"] },
        }),
      ),
    ).toBeNull();
    expect(parse(null)).toBeNull();
    expect(parse("")).toBeNull();
  });
});
