import { APIErrorCode, isNotionClientError } from "@notionhq/client";

export type NotionErrorKind =
  | "auth" // Unauthorized / RestrictedResource — bad token or integration not connected to the DB
  | "not_found" // ObjectNotFound (404)
  | "rate_limited" // RateLimited (429)
  | "network" // no HTTP response at all (fetch/DNS/timeout failure)
  | "invalid_data" // reserved for the defensive mapping layer (not used by this file, but part of the union)
  | "unknown";

export class NotionDataAccessError extends Error {
  readonly kind: NotionErrorKind;

  constructor(
    kind: NotionErrorKind,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "NotionDataAccessError";
    this.kind = kind;
  }
}

export function classifyNotionError(error: unknown): NotionDataAccessError {
  if (error instanceof NotionDataAccessError) return error; // idempotent

  if (isNotionClientError(error)) {
    switch (error.code) {
      case APIErrorCode.Unauthorized:
      case APIErrorCode.RestrictedResource:
        return new NotionDataAccessError("auth", error.message, {
          cause: error,
        });
      case APIErrorCode.ObjectNotFound:
        return new NotionDataAccessError("not_found", error.message, {
          cause: error,
        });
      case APIErrorCode.RateLimited:
        return new NotionDataAccessError("rate_limited", error.message, {
          cause: error,
        });
      default:
        return new NotionDataAccessError("unknown", error.message, {
          cause: error,
        });
    }
  }

  if (
    error instanceof TypeError ||
    (error instanceof Error &&
      /fetch|network|ECONNRESET|ECONNREFUSED/i.test(error.message))
  ) {
    return new NotionDataAccessError("network", error.message, {
      cause: error,
    });
  }

  return new NotionDataAccessError(
    "unknown",
    error instanceof Error ? error.message : String(error),
    { cause: error },
  );
}
