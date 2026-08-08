import {
  APIErrorCode,
  APIResponseError,
  Client,
  type BlockObjectResponse,
  type PageObjectResponse,
  type PartialBlockObjectResponse,
} from "@notionhq/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { mockNotionPages, pageMissingTitle } from "./__fixtures__/notion-pages.fixtures";
import { mapPageToProject } from "./mapper";

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
        pages: { retrieve: vi.fn() },
        blocks: { children: { list: vi.fn() } },
      };
    }),
  };
});

vi.mock("./data-source", () => ({
  getDataSourceId: vi.fn().mockResolvedValue("ds-123"),
}));

/**
 * `notion` 싱글턴(`./client`)은 모듈 최초 평가 시 단 한 번만 `new Client()`를 호출하므로,
 * 테스트 파일 전체에서 동일한 mock 인스턴스를 공유한다.
 */
function getClientMocks(): {
  dataSourcesQuery: Mock;
  pagesRetrieve: Mock;
  blocksChildrenList: Mock;
} {
  const mockedClient = vi.mocked(Client);
  const instance = mockedClient.mock.results[0]?.value as {
    dataSources: { query: Mock };
    pages: { retrieve: Mock };
    blocks: { children: { list: Mock } };
  };
  return {
    dataSourcesQuery: instance.dataSources.query,
    pagesRetrieve: instance.pages.retrieve,
    blocksChildrenList: instance.blocks.children.list,
  };
}

function createApiResponseError(code: APIErrorCode, message: string) {
  return new APIResponseError({
    code,
    status: 400,
    message,
    headers: new Headers(),
    rawBodyText: "",
    additional_data: undefined,
    request_id: "test-request-id",
  });
}

/** 페이지네이션 테스트용으로 mockNotionPages를 순환하며 고유 id를 가진 페이지를 생성한다. */
function buildPages(count: number, offset = 0): PageObjectResponse[] {
  return Array.from({ length: count }, (_, i) => ({
    ...mockNotionPages[(offset + i) % mockNotionPages.length],
    id: `paginated-page-${offset + i}`,
  }));
}

function createFullParagraphBlock(id: string): BlockObjectResponse {
  return {
    object: "block",
    id,
    type: "paragraph",
    paragraph: {
      rich_text: [],
      color: "default",
      icon: null,
    },
    parent: { type: "block_id", block_id: "parent-block-id" },
    created_time: "2026-01-01T00:00:00.000Z",
    created_by: { object: "user", id: "mock-user-id" },
    last_edited_time: "2026-01-01T00:00:00.000Z",
    last_edited_by: { object: "user", id: "mock-user-id" },
    has_children: false,
    in_trash: false,
    archived: false,
  } as BlockObjectResponse;
}

function createPartialBlock(id: string): PartialBlockObjectResponse {
  return { object: "block", id };
}

/**
 * `notion` 클라이언트 mock 인스턴스는 파일 전체에서 재사용되므로, 각 테스트가 끝날 때마다
 * 호출 기록(mock.calls)만 초기화한다. `Client` mock 자체는 clear하지 않는다 — clear하면
 * `mock.results[0]`(싱글턴 인스턴스 참조)이 사라져 이후 테스트에서 getClientMocks()가 깨진다.
 */
afterEach(() => {
  const { dataSourcesQuery, pagesRetrieve, blocksChildrenList } = getClientMocks();
  dataSourcesQuery.mockClear();
  pagesRetrieve.mockClear();
  blocksChildrenList.mockClear();
});

describe("getProjects", () => {
  it("100건 초과 시 커서 페이지네이션으로 전체 결과를 수집한다", async () => {
    const { getProjects } = await import("./projects");
    const { dataSourcesQuery } = getClientMocks();
    const firstPage = buildPages(50, 0);
    const secondPage = buildPages(60, 50);

    dataSourcesQuery
      .mockResolvedValueOnce({
        object: "list",
        results: firstPage,
        next_cursor: "cursor-1",
        has_more: true,
      })
      .mockResolvedValueOnce({
        object: "list",
        results: secondPage,
        next_cursor: null,
        has_more: false,
      });

    const result = await getProjects();

    expect(result).toHaveLength(110);
    expect(dataSourcesQuery).toHaveBeenCalledTimes(2);
    expect(dataSourcesQuery.mock.calls[1]?.[0]).toMatchObject({
      start_cursor: "cursor-1",
    });
  });

  it("일부 페이지의 매핑이 실패해도 나머지 유효한 프로젝트는 반환한다", async () => {
    const { getProjects } = await import("./projects");
    const { dataSourcesQuery } = getClientMocks();

    dataSourcesQuery.mockResolvedValueOnce({
      object: "list",
      results: [mockNotionPages[0], pageMissingTitle, mockNotionPages[1]],
      next_cursor: null,
      has_more: false,
    });

    const result = await getProjects();

    expect(result).toHaveLength(2);
    expect(result.map((project) => project.id)).toEqual([
      mockNotionPages[0]?.id,
      mockNotionPages[1]?.id,
    ]);
  });

  it("페이지가 아닌 결과(data_source 참조 등)는 조용히 제외한다", async () => {
    const { getProjects } = await import("./projects");
    const { dataSourcesQuery } = getClientMocks();

    dataSourcesQuery.mockResolvedValueOnce({
      object: "list",
      results: [
        mockNotionPages[0],
        { object: "data_source", id: "ds-reference-1" },
        mockNotionPages[1],
      ],
      next_cursor: null,
      has_more: false,
    });

    const result = await getProjects();

    expect(result).toHaveLength(2);
    expect(result.map((project) => project.id)).toEqual([
      mockNotionPages[0]?.id,
      mockNotionPages[1]?.id,
    ]);
  });
});

describe("getProjectById", () => {
  it("정상 케이스: 조회한 페이지를 Project로 매핑해 반환한다", async () => {
    const { getProjectById } = await import("./projects");
    const { pagesRetrieve } = getClientMocks();
    const fixturePage = mockNotionPages[0];
    if (!fixturePage) throw new Error("fixture missing");
    pagesRetrieve.mockResolvedValueOnce(fixturePage);

    const result = await getProjectById(fixturePage.id);

    expect(result).toEqual(mapPageToProject(fixturePage));
    expect(pagesRetrieve).toHaveBeenCalledWith({ page_id: fixturePage.id });
  });

  it("ObjectNotFound 에러는 kind: 'not_found'로 전파된다", async () => {
    const { getProjectById } = await import("./projects");
    const { pagesRetrieve } = getClientMocks();
    pagesRetrieve.mockRejectedValueOnce(
      createApiResponseError(APIErrorCode.ObjectNotFound, "존재하지 않는 페이지입니다."),
    );

    let error: unknown;
    try {
      await getProjectById("missing-id");
    } catch (caught) {
      error = caught;
    }

    expect((error as { kind?: string } | undefined)?.kind).toBe("not_found");
  });

  it("Unauthorized 에러는 kind: 'auth'로 전파된다", async () => {
    const { getProjectById } = await import("./projects");
    const { pagesRetrieve } = getClientMocks();
    pagesRetrieve.mockRejectedValueOnce(
      createApiResponseError(APIErrorCode.Unauthorized, "API token is invalid."),
    );

    let error: unknown;
    try {
      await getProjectById("some-id");
    } catch (caught) {
      error = caught;
    }

    expect((error as { kind?: string } | undefined)?.kind).toBe("auth");
  });

  it("RateLimited 에러는 kind: 'rate_limited'로 전파된다", async () => {
    const { getProjectById } = await import("./projects");
    const { pagesRetrieve } = getClientMocks();
    pagesRetrieve.mockRejectedValueOnce(
      createApiResponseError(APIErrorCode.RateLimited, "요청이 너무 많습니다."),
    );

    let error: unknown;
    try {
      await getProjectById("some-id");
    } catch (caught) {
      error = caught;
    }

    expect((error as { kind?: string } | undefined)?.kind).toBe("rate_limited");
  });

  it("HTTP 응답이 없는 네트워크 실패는 kind: 'network'로 전파된다", async () => {
    const { getProjectById } = await import("./projects");
    const { pagesRetrieve } = getClientMocks();
    pagesRetrieve.mockRejectedValueOnce(new TypeError("fetch failed"));

    let error: unknown;
    try {
      await getProjectById("some-id");
    } catch (caught) {
      error = caught;
    }

    expect((error as { kind?: string } | undefined)?.kind).toBe("network");
  });
});

describe("getProjectBlocks", () => {
  it("전체 블록(BlockObjectResponse)만 필터링해 반환하고, partial 블록은 제외한다", async () => {
    const { getProjectBlocks } = await import("./projects");
    const { blocksChildrenList } = getClientMocks();
    const fullBlockA = createFullParagraphBlock("block-a");
    const fullBlockB = createFullParagraphBlock("block-b");
    const partialBlock = createPartialBlock("block-partial");

    blocksChildrenList.mockResolvedValueOnce({
      object: "list",
      results: [fullBlockA, partialBlock, fullBlockB],
      next_cursor: null,
      has_more: false,
    });

    const result = await getProjectBlocks("some-page-id");

    expect(result).toHaveLength(2);
    expect(result.map((block) => block.id)).toEqual(["block-a", "block-b"]);
  });

  it("커서 페이지네이션으로 여러 페이지에 걸친 블록을 모두 수집한다", async () => {
    const { getProjectBlocks } = await import("./projects");
    const { blocksChildrenList } = getClientMocks();
    const firstBlock = createFullParagraphBlock("block-page1");
    const secondBlock = createFullParagraphBlock("block-page2");

    blocksChildrenList
      .mockResolvedValueOnce({
        object: "list",
        results: [firstBlock],
        next_cursor: "blocks-cursor-1",
        has_more: true,
      })
      .mockResolvedValueOnce({
        object: "list",
        results: [secondBlock],
        next_cursor: null,
        has_more: false,
      });

    const result = await getProjectBlocks("some-page-id");

    expect(result).toHaveLength(2);
    expect(blocksChildrenList).toHaveBeenCalledTimes(2);
    expect(blocksChildrenList.mock.calls[1]?.[0]).toMatchObject({
      start_cursor: "blocks-cursor-1",
    });
  });
});
