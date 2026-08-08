import { describe, expect, it } from "vitest";

import { formatPeriod } from "@/lib/format-period";

describe("formatPeriod", () => {
  it("시작일과 종료일이 모두 있으면 'YYYY.MM.DD ~ YYYY.MM.DD' 형태로 반환한다", () => {
    expect(
      formatPeriod({ start: "2026-08-15", end: "2026-08-20" }),
    ).toBe("2026.08.15 ~ 2026.08.20");
  });

  it("종료일이 없으면 '진행중'을 반환한다", () => {
    expect(formatPeriod({ start: "2026-08-15" })).toBe("2026.08.15 ~ 진행중");
  });

  it("period 자체가 없으면 '기간 미정'을 반환한다", () => {
    expect(formatPeriod(undefined)).toBe("기간 미정");
  });
});
