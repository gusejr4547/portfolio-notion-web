import { describe, expect, it } from "vitest";

import { toSafeUrl } from "./safe-url";

describe("toSafeUrl", () => {
  it.each([
    "https://github.com/user/repo",
    "http://example.com",
    "mailto:me@example.com",
  ])("%s 은(는) 그대로 허용한다", (url) => {
    expect(toSafeUrl(url)).toBe(url);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "not a url",
    "/relative/path",
    "",
    null,
    undefined,
  ])("%s 은(는) 거부한다", (url) => {
    expect(toSafeUrl(url)).toBeUndefined();
  });
});
