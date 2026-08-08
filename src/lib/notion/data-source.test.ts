import { APIErrorCode, APIResponseError, Client } from "@notionhq/client";
import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { NotionDataAccessError } from "./errors";

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
      return { databases: { retrieve: vi.fn() } };
    }),
  };
});

/**
 * `notion` 싱글턴(`./client`)은 모듈 최초 평가 시 단 한 번만 `new Client()`를 호출하므로,
 * 테스트 파일 전체에서 동일한 `databases.retrieve` mock 인스턴스를 공유한다.
 */
function getRetrieveMock(): Mock {
  const mockedClient = vi.mocked(Client);
  const instance = mockedClient.mock.results[0]?.value as {
    databases: { retrieve: Mock };
  };
  return instance.databases.retrieve;
}

function createApiResponseError(code: APIErrorCode, message: string) {
  return new APIResponseError({
    code,
    status: 401,
    message,
    headers: new Headers(),
    rawBodyText: "",
    additional_data: undefined,
    request_id: "test-request-id",
  });
}

describe("getDataSourceId", () => {
  it("정상 케이스: data_sources[0].id를 반환한다", async () => {
    const { getDataSourceId } = await import("./data-source");
    const retrieve = getRetrieveMock();
    retrieve.mockResolvedValueOnce({
      object: "database",
      data_sources: [{ id: "ds-123", name: "Projects" }],
    });

    const result = await getDataSourceId();

    expect(result).toBe("ds-123");
  });

  it("data_sources 배열이 빈 경우 NotionDataAccessError로 거부한다", async () => {
    const { getDataSourceId } = await import("./data-source");
    const retrieve = getRetrieveMock();
    retrieve.mockResolvedValueOnce({
      object: "database",
      data_sources: [],
    });

    let error: unknown;
    try {
      await getDataSourceId();
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(NotionDataAccessError);
    expect((error as NotionDataAccessError).kind).toBe("unknown");
  });

  it("PartialDatabaseObjectResponse(data_sources 필드 없음)인 경우 NotionDataAccessError로 거부한다", async () => {
    const { getDataSourceId } = await import("./data-source");
    const retrieve = getRetrieveMock();
    retrieve.mockResolvedValueOnce({
      object: "database",
      id: "db-id",
    });

    let error: unknown;
    try {
      await getDataSourceId();
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(NotionDataAccessError);
    expect((error as NotionDataAccessError).kind).toBe("unknown");
  });

  it("SDK 호출이 실패하면 classifyNotionError로 분류된 NotionDataAccessError로 거부한다", async () => {
    const { getDataSourceId } = await import("./data-source");
    const retrieve = getRetrieveMock();
    retrieve.mockRejectedValueOnce(
      createApiResponseError(APIErrorCode.Unauthorized, "API token is invalid."),
    );

    let error: unknown;
    try {
      await getDataSourceId();
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(NotionDataAccessError);
    expect((error as NotionDataAccessError).kind).toBe("auth");
  });
});
