import { beforeEach, describe, expect, it } from "vitest";

import {
  DAILY_MAX_REQUESTS,
  checkRateLimit,
  resetRateLimit,
} from "./rate-limit";

const T0 = 1_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;
// 13초 간격이면 어느 1분 창에도 이전 요청이 4개뿐이라 분당 한도(5회)에 걸리지 않는다.
const SPACING_MS = 13_000;

/** 분당 한도에 걸리지 않게 간격을 두고 `count`번 요청한다. 마지막 요청 시각을 돌려준다. */
function spread(ip: string, count: number, start = T0): number {
  let last = start;
  for (let n = 0; n < count; n++) {
    last = start + n * SPACING_MS;
    expect(checkRateLimit(ip, last).allowed).toBe(true);
  }
  return last;
}

beforeEach(() => {
  resetRateLimit();
});

describe("checkRateLimit: 분당 한도", () => {
  it("1분 안에 5회까지 허용하고 6회째는 차단한다", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("1.1.1.1", T0 + i * 1000)).toEqual({
        allowed: true,
        retryAfter: 0,
      });
    }

    // 첫 요청(T0)이 윈도우를 벗어나는 T0+60s까지 남은 시간
    expect(checkRateLimit("1.1.1.1", T0 + 10_000)).toEqual({
      allowed: false,
      retryAfter: 50,
      reason: "minute",
    });
  });

  it("가장 오래된 요청이 윈도우를 벗어나면 다시 허용한다", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("1.1.1.1", T0 + i * 1000);

    expect(checkRateLimit("1.1.1.1", T0 + 59_999).allowed).toBe(false);
    expect(checkRateLimit("1.1.1.1", T0 + 60_000).allowed).toBe(true);
  });

  it("차단된 요청은 횟수에 더하지 않는다", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("1.1.1.1", T0);
    for (let i = 0; i < 3; i++) checkRateLimit("1.1.1.1", T0 + 30_000);

    expect(checkRateLimit("1.1.1.1", T0 + 60_000).allowed).toBe(true);
  });

  it("IP마다 따로 센다", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("1.1.1.1", T0);

    expect(checkRateLimit("1.1.1.1", T0).allowed).toBe(false);
    expect(checkRateLimit("2.2.2.2", T0).allowed).toBe(true);
  });
});

describe("checkRateLimit: 하루 한도", () => {
  it(`하루 ${DAILY_MAX_REQUESTS}회까지 허용하고 다음 요청은 reason "day"로 차단한다`, () => {
    const last = spread("1.1.1.1", DAILY_MAX_REQUESTS);

    const next = last + SPACING_MS;
    const result = checkRateLimit("1.1.1.1", next);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("day");
    // 가장 오래된 요청(T0)이 24시간 창을 벗어날 때까지 남은 초
    expect(result.retryAfter).toBe(Math.ceil((T0 + DAY_MS - next) / 1000));
  });

  it("분당 한도에 걸린 요청은 하루 횟수에 더하지 않는다", () => {
    const afterSpread = spread("1.1.1.1", DAILY_MAX_REQUESTS - 6);
    // 1분 창이 비도록 충분히 지난 뒤 한꺼번에 5회 → 하루 횟수는 29회
    const burstAt = afterSpread + 120_000;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("1.1.1.1", burstAt).allowed).toBe(true);
    }
    // 분당 한도에 걸린 3회는 하루 횟수에 들어가면 안 된다
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("1.1.1.1", burstAt)).toMatchObject({
        allowed: false,
        reason: "minute",
      });
    }

    // 분당 창이 비면 30번째 요청까지는 허용되고, 31번째부터 하루 한도다
    const later = burstAt + 61_000;
    expect(checkRateLimit("1.1.1.1", later).allowed).toBe(true);
    expect(checkRateLimit("1.1.1.1", later + 1000)).toMatchObject({
      allowed: false,
      reason: "day",
    });
  });

  it("가장 오래된 요청이 24시간 창을 벗어나면 다시 허용한다", () => {
    spread("1.1.1.1", DAILY_MAX_REQUESTS);

    expect(checkRateLimit("1.1.1.1", T0 + DAY_MS - 1).reason).toBe("day");
    expect(checkRateLimit("1.1.1.1", T0 + DAY_MS).allowed).toBe(true);
  });

  it("IP마다 따로 센다", () => {
    const last = spread("1.1.1.1", DAILY_MAX_REQUESTS);

    expect(checkRateLimit("1.1.1.1", last + SPACING_MS).allowed).toBe(false);
    expect(checkRateLimit("2.2.2.2", last + SPACING_MS).allowed).toBe(true);
  });
});
