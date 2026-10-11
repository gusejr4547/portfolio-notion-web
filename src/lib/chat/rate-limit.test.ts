import { beforeEach, describe, expect, it } from "vitest";

import { checkRateLimit, resetRateLimit } from "./rate-limit";

const T0 = 1_000_000;

beforeEach(() => {
  resetRateLimit();
});

describe("checkRateLimit", () => {
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
