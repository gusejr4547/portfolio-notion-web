import { Client } from "@notionhq/client";
import { describe, expect, it, vi } from "vitest";

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
  return { ...actual, Client: vi.fn(actual.Client) };
});

describe("notion 싱글턴 클라이언트", () => {
  it("Client의 인스턴스이다", async () => {
    const { notion } = await import("./client");

    expect(notion).toBeInstanceOf(Client);
  });

  it("모듈을 여러 곳에서 import해도 동일한 인스턴스를 반환한다 (싱글턴)", async () => {
    const { notion: notionA } = await import("./client");
    const { notion: notionB } = await import("./client");

    expect(notionA).toBe(notionB);
  });

  it("auth와 notionVersion을 지정해 Client 생성자를 호출한다", async () => {
    await import("./client");

    expect(Client).toHaveBeenCalledWith({
      auth: "test-key",
      notionVersion: "2025-09-03",
    });
  });
});
