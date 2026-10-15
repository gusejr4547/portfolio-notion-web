import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, within } from "@/test/utils";
import type { Project } from "@/types/project";

import { ExportBuilder } from "./export-builder";

const STORAGE_KEY = "portfolio-export-v1";

function makeProject(id: string, title: string): Project {
  return {
    id,
    title,
    summary: `${title} 요약`,
    techStack: ["React"],
    githubUrl: `https://github.com/example/${id}`,
    featured: false,
  };
}

const projects = [
  makeProject("a", "알파"),
  makeProject("b", "베타"),
  makeProject("c", "감마"),
];

const bodies = {
  a: <p>알파 본문</p>,
  b: <p>베타 본문</p>,
  c: <p>감마 본문</p>,
};

function renderBuilder(profile: React.ReactNode = <p>프로필 내용</p>) {
  return render(
    <ExportBuilder projects={projects} bodies={bodies} profile={profile} />,
  );
}

function previewTitles() {
  return within(screen.getByTestId("export-preview"))
    .queryAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent);
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExportBuilder", () => {
  it("모든 프로젝트를 기본 순서대로 미리보기에 보여준다", () => {
    renderBuilder();
    expect(previewTitles()).toEqual(["알파", "베타", "감마"]);
  });

  it("프로젝트마다 순서 변경 핸들이 있다", () => {
    renderBuilder();
    expect(
      screen.getAllByRole("button", { name: /순서 끌어서 변경$/ }),
    ).toHaveLength(projects.length);
  });

  it("체크를 해제하면 미리보기에서 제거된다", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const list = within(
      screen.getByRole("region", { name: "내보내기 설정" }),
    ).getByRole("list");
    await user.click(within(list).getAllByRole("checkbox")[0]);

    expect(previewTitles()).toEqual(["베타", "감마"]);
  });

  it("아래로 이동하면 미리보기 순서가 바뀌고 경계 버튼은 비활성화된다", async () => {
    const user = userEvent.setup();
    renderBuilder();

    expect(
      screen.getByRole("button", { name: "알파 위로 이동" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "감마 아래로 이동" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "알파 아래로 이동" }));

    expect(previewTitles()).toEqual(["베타", "알파", "감마"]);
  });

  it("섹션을 끄면 해당 영역이 미리보기에서 사라진다", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const preview = screen.getByTestId("export-preview");
    expect(within(preview).getByText("알파 본문")).toBeInTheDocument();

    const firstItem = within(
      within(screen.getByRole("region", { name: "내보내기 설정" })).getByRole(
        "list",
      ),
    ).getAllByRole("listitem")[0];
    await user.click(
      within(within(firstItem).getByText("본문").closest("label")!).getByRole(
        "checkbox",
      ),
    );

    expect(within(preview).queryByText("알파 본문")).not.toBeInTheDocument();
    expect(within(preview).getByText("베타 본문")).toBeInTheDocument();
  });

  it("프로필 포함을 끄면 프로필이 미리보기에서 사라진다", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const preview = screen.getByTestId("export-preview");
    expect(within(preview).getByText("프로필 내용")).toBeInTheDocument();

    await user.click(
      within(screen.getByText("프로필 포함").closest("label")!).getByRole(
        "checkbox",
      ),
    );

    expect(within(preview).queryByText("프로필 내용")).not.toBeInTheDocument();
  });

  it("프로필이 없으면 프로필 토글을 보여주지 않는다", () => {
    renderBuilder(null);
    expect(screen.queryByText("프로필 포함")).not.toBeInTheDocument();
  });

  it("'PDF 저장'을 누르면 window.print를 호출한다", async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    renderBuilder();

    await user.click(screen.getByRole("button", { name: "PDF 저장" }));

    expect(print).toHaveBeenCalledTimes(1);
  });

  it("선택 상태를 localStorage에 저장하고 다시 열면 복원한다", async () => {
    const user = userEvent.setup();
    const { unmount } = renderBuilder();

    await user.click(screen.getByRole("button", { name: "알파 아래로 이동" }));
    unmount();

    renderBuilder();
    expect(previewTitles()).toEqual(["베타", "알파", "감마"]);
  });

  it("저장된 값에 삭제된 프로젝트가 있어도 현재 목록 기준으로 복원한다", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        order: ["c", "gone", "a"],
        hiddenProjects: ["gone"],
        hiddenSections: {},
        includeProfile: true,
      }),
    );

    renderBuilder();

    expect(previewTitles()).toEqual(["감마", "알파", "베타"]);
  });

  it("localStorage 접근이 실패해도 렌더링과 조작이 동작한다", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    renderBuilder();
    expect(previewTitles()).toEqual(["알파", "베타", "감마"]);

    await user.click(screen.getByRole("button", { name: "알파 아래로 이동" }));
    expect(previewTitles()).toEqual(["베타", "알파", "감마"]);
  });
});
