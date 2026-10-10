import { describe, expect, it } from "vitest";

import { formatPeriod } from "@/lib/format-period";

describe("formatPeriod", () => {
  it("시작일과 종료일이 모두 있으면 'YYYY.MM ~ YYYY.MM' 월 단위로 반환한다", () => {
    expect(
      formatPeriod({ start: "2023-10-01", end: "2023-11-30" }),
    ).toBe("2023.10 ~ 2023.11");
  });

  it("같은 달이면 시작과 종료를 같은 월로 반환한다", () => {
    expect(
      formatPeriod({ start: "2026-08-01", end: "2026-08-31" }),
    ).toBe("2026.08 ~ 2026.08");
  });

  it("종료일이 없으면 '진행중'을 반환한다", () => {
    expect(formatPeriod({ start: "2026-01-01" })).toBe("2026.01 ~ 진행중");
  });

  it("period 자체가 없으면 '기간 미정'을 반환한다", () => {
    expect(formatPeriod(undefined)).toBe("기간 미정");
  });
});
