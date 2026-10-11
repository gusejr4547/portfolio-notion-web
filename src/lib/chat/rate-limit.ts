const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
// 공격적으로 IP를 바꿔도 메모리가 무한히 늘지 않게, 이 개수를 넘으면 만료된 항목을 정리한다.
const CLEANUP_THRESHOLD = 1_000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** 차단된 경우 다시 시도할 수 있을 때까지 남은 초(올림). 허용된 경우 0. */
  retryAfter: number;
}

/**
 * IP별 슬라이딩 윈도우 속도 제한(분당 5회).
 *
 * 한계: 서버리스 인스턴스 메모리에 저장하므로 Vercel에서는 인스턴스마다 따로 세고,
 * 콜드 스타트 때 초기화된다(best-effort). 입력 길이 제한·출력 토큰 한도·Origin 검사·
 * Gemini 쪽 쿼터와 함께 겹쳐 쓰는 방어선이며, 정확한 제한이 필요하면 외부 저장소가 필요하다.
 */
export function checkRateLimit(
  ip: string,
  now: number = Date.now(),
): RateLimitResult {
  const windowStart = now - WINDOW_MS;

  if (hits.size > CLEANUP_THRESHOLD) {
    for (const [key, timestamps] of hits) {
      if (timestamps.every((time) => time <= windowStart)) hits.delete(key);
    }
  }

  const recent = (hits.get(ip) ?? []).filter((time) => time > windowStart);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return {
      allowed: false,
      retryAfter: Math.ceil((recent[0] + WINDOW_MS - now) / 1000),
    };
  }

  recent.push(now);
  hits.set(ip, recent);
  return { allowed: true, retryAfter: 0 };
}

/** 테스트 전용: 저장된 기록을 비운다. */
export function resetRateLimit(): void {
  hits.clear();
}
