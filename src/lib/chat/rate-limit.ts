const MINUTE_WINDOW_MS = 60_000;
const MINUTE_MAX_REQUESTS = 5;
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;
// Gemini 무료 티어가 하루 500회라, 한 사람이 다 쓰지 못하게 IP당 하루 한도를 둔다.
export const DAILY_MAX_REQUESTS = 30;
// 공격적으로 IP를 바꿔도 메모리가 무한히 늘지 않게, 이 개수를 넘으면 만료된 항목을 정리한다.
const CLEANUP_THRESHOLD = 1_000;

const minuteHits = new Map<string, number[]>();
const dayHits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** 차단된 경우 다시 시도할 수 있을 때까지 남은 초(올림). 허용된 경우 0. */
  retryAfter: number;
  /** 차단된 경우 어느 한도에 걸렸는지. 허용된 경우 없음. */
  reason?: "minute" | "day";
}

function pruneExpired(map: Map<string, number[]>, windowStart: number) {
  if (map.size <= CLEANUP_THRESHOLD) return;
  for (const [key, timestamps] of map) {
    if (timestamps.every((time) => time <= windowStart)) map.delete(key);
  }
}

function recentHits(
  map: Map<string, number[]>,
  ip: string,
  windowStart: number,
): number[] {
  return (map.get(ip) ?? []).filter((time) => time > windowStart);
}

function retryAfterSeconds(oldest: number, windowMs: number, now: number) {
  return Math.ceil((oldest + windowMs - now) / 1000);
}

/**
 * IP별 슬라이딩 윈도우 속도 제한(분당 5회 + 하루 30회).
 * 분당 한도에 걸린 요청은 하루 횟수에 더하지 않고, 두 한도를 모두 통과한 요청만 기록한다.
 *
 * 한계: 서버리스 인스턴스 메모리에 저장하므로 Vercel에서는 인스턴스마다 따로 세고,
 * 콜드 스타트 때 초기화된다(best-effort). 입력 길이 제한·출력 토큰 한도·Origin 검사·
 * Gemini 쪽 쿼터와 함께 겹쳐 쓰는 방어선이며, 정확한 제한이 필요하면 외부 저장소가 필요하다.
 */
export function checkRateLimit(
  ip: string,
  now: number = Date.now(),
): RateLimitResult {
  const minuteStart = now - MINUTE_WINDOW_MS;
  const dayStart = now - DAY_WINDOW_MS;

  pruneExpired(minuteHits, minuteStart);
  pruneExpired(dayHits, dayStart);

  const recentMinute = recentHits(minuteHits, ip, minuteStart);
  if (recentMinute.length >= MINUTE_MAX_REQUESTS) {
    minuteHits.set(ip, recentMinute);
    return {
      allowed: false,
      retryAfter: retryAfterSeconds(recentMinute[0], MINUTE_WINDOW_MS, now),
      reason: "minute",
    };
  }

  const recentDay = recentHits(dayHits, ip, dayStart);
  if (recentDay.length >= DAILY_MAX_REQUESTS) {
    dayHits.set(ip, recentDay);
    return {
      allowed: false,
      retryAfter: retryAfterSeconds(recentDay[0], DAY_WINDOW_MS, now),
      reason: "day",
    };
  }

  recentMinute.push(now);
  minuteHits.set(ip, recentMinute);
  recentDay.push(now);
  dayHits.set(ip, recentDay);
  return { allowed: true, retryAfter: 0 };
}

/** 테스트 전용: 저장된 기록을 비운다. */
export function resetRateLimit(): void {
  minuteHits.clear();
  dayHits.clear();
}
