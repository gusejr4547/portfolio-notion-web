import { APIErrorCode, APIResponseError } from "@notionhq/client";
import { describe, expect, it } from "vitest";

import { classifyNotionError, NotionDataAccessError } from "./errors";

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

describe("classifyNotionError", () => {
  it("Unauthorized 에러는 kind: 'auth'로 분류한다", () => {
    const error = createApiResponseError(
      APIErrorCode.Unauthorized,
      "API token is invalid.",
    );

    const result = classifyNotionError(error);

    expect(result).toBeInstanceOf(NotionDataAccessError);
    expect(result.kind).toBe("auth");
  });

  it("RestrictedResource 에러는 kind: 'auth'로 분류한다", () => {
    const error = createApiResponseError(
      APIErrorCode.RestrictedResource,
      "Integration이 이 리소스에 접근할 권한이 없습니다.",
    );

    const result = classifyNotionError(error);

    expect(result.kind).toBe("auth");
  });

  it("ObjectNotFound 에러는 kind: 'not_found'로 분류한다", () => {
    const error = createApiResponseError(
      APIErrorCode.ObjectNotFound,
      "존재하지 않는 페이지입니다.",
    );

    const result = classifyNotionError(error);

    expect(result.kind).toBe("not_found");
  });

  it("ValidationError 에러(예: id가 UUID 형식이 아님)는 kind: 'not_found'로 분류한다", () => {
    const error = createApiResponseError(
      APIErrorCode.ValidationError,
      "path failed validation: path.page_id should be a valid uuid",
    );

    const result = classifyNotionError(error);

    expect(result.kind).toBe("not_found");
  });

  it("RateLimited 에러는 kind: 'rate_limited'로 분류한다", () => {
    const error = createApiResponseError(
      APIErrorCode.RateLimited,
      "요청이 너무 많습니다.",
    );

    const result = classifyNotionError(error);

    expect(result.kind).toBe("rate_limited");
  });

  it("HTTP 응답이 없는 TypeError는 kind: 'network'로 분류한다", () => {
    const error = new TypeError("fetch failed");

    const result = classifyNotionError(error);

    expect(result.kind).toBe("network");
  });

  it("Notion SDK 에러가 아니고 네트워크 패턴에도 매칭되지 않는 일반 에러는 kind: 'unknown'으로 분류한다", () => {
    const error = new Error("something unexpected");

    const result = classifyNotionError(error);

    expect(result.kind).toBe("unknown");
  });

  it("이미 분류된 NotionDataAccessError를 다시 전달하면 그대로 반환한다 (idempotent)", () => {
    const original = new NotionDataAccessError("auth", "이미 분류된 에러");

    const result = classifyNotionError(original);

    expect(result).toBe(original);
    expect(result.kind).toBe("auth");
    expect(result.message).toBe("이미 분류된 에러");
  });
});
