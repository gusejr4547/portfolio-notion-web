import {
  APIErrorCode,
  APIResponseError,
  Client,
  type BlockObjectResponse,
} from "@notionhq/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { SKILLS_PROPERTY } from "@/types/profile";

import {
  createBulletedListItemBlock,
  createHeadingBlock,
  createParagraphBlock,
} from "./__fixtures__/notion-blocks.fixtures";
import {
  createPage,
  multiSelectProperty,
  numberProperty,
  titleProperty,
} from "./__fixtures__/notion-pages.fixtures";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@/env", () => ({
  env: {
    NOTION_API_KEY: "test-key",
    NOTION_DATABASE_ID: "test-db-id",
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

vi.mock("@notionhq/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@notionhq/client")>();
  return {
    ...actual,
    Client: vi.fn(function MockClient() {
      return {
        dataSources: { query: vi.fn() },
        databases: { retrieve: vi.fn() },
        pages: { retrieve: vi.fn() },
        blocks: { children: { list: vi.fn() } },
      };
    }),
  };
});

const getProjectBlocksMock = vi.hoisted(() => vi.fn());
vi.mock("./projects", () => ({
  getProjectBlocks: getProjectBlocksMock,
}));

/** `notion` 싱글턴(`./client`)은 모듈 최초 평가 시 한 번만 `new Client()`를 호출하므로 mock 인스턴스를 공유한다. */
function getClientMocks(): {
  dataSourcesQuery: Mock;
  databasesRetrieve: Mock;
  pagesRetrieve: Mock;
} {
  const instance = vi.mocked(Client).mock.results[0]?.value as {
    dataSources: { query: Mock };
    databases: { retrieve: Mock };
    pages: { retrieve: Mock };
  };
  return {
    dataSourcesQuery: instance.dataSources.query,
    databasesRetrieve: instance.databases.retrieve,
    pagesRetrieve: instance.pages.retrieve,
  };
}

function createChildDatabaseBlock(id: string): BlockObjectResponse {
  return {
    ...createParagraphBlock(id),
    type: "child_database",
    child_database: { title: "Skills & Tools" },
  } as unknown as BlockObjectResponse;
}

function createSkillRow(
  category: string,
  proficient: string[],
  familiar: string[],
  order: number | null = null,
) {
  return createPage(`skill-${category}`, {
    [SKILLS_PROPERTY.category]: titleProperty([category]),
    [SKILLS_PROPERTY.proficient]: multiSelectProperty(proficient),
    [SKILLS_PROPERTY.familiar]: multiSelectProperty(familiar),
    [SKILLS_PROPERTY.order]: numberProperty(order),
  });
}

const profilePage = createPage("profile-page", {
  title: titleProperty(["조현덕 CHO HYUN DEOK"]),
});

afterEach(() => {
  const { dataSourcesQuery, databasesRetrieve, pagesRetrieve } = getClientMocks();
  dataSourcesQuery.mockReset();
  databasesRetrieve.mockReset();
  pagesRetrieve.mockReset();
  getProjectBlocksMock.mockReset();
  vi.restoreAllMocks();
});

describe("getOptionalProfile", () => {
  it("프로필 페이지 ID가 없으면 Notion을 호출하지 않고 null을 반환한다", async () => {
    const { getOptionalProfile } = await import("./profile");
    const { pagesRetrieve } = getClientMocks();

    await expect(getOptionalProfile(undefined)).resolves.toBeNull();
    expect(pagesRetrieve).not.toHaveBeenCalled();
  });

  it("기술 스택 DB(child_database)를 기준으로 본문을 앞/뒤로 나누고 스킬 그룹을 채운다", async () => {
    const { getOptionalProfile } = await import("./profile");
    const { dataSourcesQuery, databasesRetrieve, pagesRetrieve } = getClientMocks();
    const leading = [
      createHeadingBlock("about-heading", 1),
      createParagraphBlock("about-body"),
    ];
    const trailing = [createBulletedListItemBlock("education-1")];

    pagesRetrieve.mockResolvedValue(profilePage);
    getProjectBlocksMock.mockResolvedValue([
      ...leading,
      createChildDatabaseBlock("skills-db"),
      ...trailing,
    ]);
    databasesRetrieve.mockResolvedValue({ data_sources: [{ id: "skills-ds" }] });
    dataSourcesQuery.mockResolvedValue({
      object: "list",
      results: [
        createSkillRow("Language", ["Java"], ["Python"]),
        createSkillRow("DB", ["MySQL"], []),
      ],
      next_cursor: null,
      has_more: false,
    });

    const profile = await getOptionalProfile("profile-page");

    expect(profile).toEqual({
      name: "조현덕 CHO HYUN DEOK",
      leadingBlocks: leading,
      skills: [
        { category: "Language", proficient: ["Java"], familiar: ["Python"], order: undefined },
        { category: "DB", proficient: ["MySQL"], familiar: [], order: undefined },
      ],
      trailingBlocks: trailing,
    });
    expect(databasesRetrieve).toHaveBeenCalledWith({ database_id: "skills-db" });
    expect(dataSourcesQuery).toHaveBeenCalledWith(
      expect.objectContaining({ data_source_id: "skills-ds" }),
    );
  });

  it("`순서` 값 오름차순으로 정렬하고, 값이 없는 행은 뒤에 Notion 순서대로 둔다", async () => {
    const { getOptionalProfile } = await import("./profile");
    const { dataSourcesQuery, databasesRetrieve, pagesRetrieve } = getClientMocks();

    pagesRetrieve.mockResolvedValue(profilePage);
    getProjectBlocksMock.mockResolvedValue([createChildDatabaseBlock("skills-db")]);
    databasesRetrieve.mockResolvedValue({ data_sources: [{ id: "skills-ds" }] });
    dataSourcesQuery.mockResolvedValue({
      object: "list",
      results: [
        createSkillRow("DB", ["MySQL"], [], 4),
        createSkillRow("Unordered-A", [], ["X"]),
        createSkillRow("Language", ["Java"], [], 1),
        createSkillRow("Unordered-B", [], ["Y"]),
        createSkillRow("Backend", ["Spring Boot"], [], 2),
      ],
      next_cursor: null,
      has_more: false,
    });

    const profile = await getOptionalProfile("profile-page");

    expect(profile?.skills.map((group) => group.category)).toEqual([
      "Language",
      "Backend",
      "DB",
      "Unordered-A",
      "Unordered-B",
    ]);
  });

  it("child_database가 없으면 모든 블록을 leadingBlocks에 담고 DB는 조회하지 않는다", async () => {
    const { getOptionalProfile } = await import("./profile");
    const { databasesRetrieve, pagesRetrieve } = getClientMocks();
    const blocks = [createParagraphBlock("only-1"), createParagraphBlock("only-2")];

    pagesRetrieve.mockResolvedValue(profilePage);
    getProjectBlocksMock.mockResolvedValue(blocks);

    const profile = await getOptionalProfile("profile-page");

    expect(profile).toEqual({
      name: "조현덕 CHO HYUN DEOK",
      leadingBlocks: blocks,
      skills: [],
      trailingBlocks: [],
    });
    expect(databasesRetrieve).not.toHaveBeenCalled();
  });

  it("기술 스택 DB에 데이터 소스가 없으면 skills를 빈 배열로 둔다", async () => {
    const { getOptionalProfile } = await import("./profile");
    const { databasesRetrieve, pagesRetrieve } = getClientMocks();

    pagesRetrieve.mockResolvedValue(profilePage);
    getProjectBlocksMock.mockResolvedValue([createChildDatabaseBlock("skills-db")]);
    databasesRetrieve.mockResolvedValue({ data_sources: [] });

    const profile = await getOptionalProfile("profile-page");

    expect(profile?.skills).toEqual([]);
  });

  it("Notion 조회가 실패하면 경고만 남기고 null을 반환해 홈이 깨지지 않게 한다", async () => {
    const { getOptionalProfile } = await import("./profile");
    const { pagesRetrieve } = getClientMocks();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    pagesRetrieve.mockRejectedValue(
      new APIResponseError({
        code: APIErrorCode.ObjectNotFound,
        status: 404,
        message: "Could not find page",
        headers: new Headers(),
        rawBodyText: "",
        additional_data: undefined,
        request_id: "test-request-id",
      }),
    );

    await expect(getOptionalProfile("profile-page")).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});
