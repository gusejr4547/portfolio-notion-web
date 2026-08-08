import type { ProjectPeriod } from "@/types/project";

/**
 * 기간(period.start) 기준 최신순(내림차순) 정렬. period.start는 "YYYY-MM-DD" 형식의 ISO 문자열이므로
 * 사전식(lexicographic) 비교가 곧 시간순 비교와 동일하다. period 또는 period.start가 없는 항목은
 * 항상 배열 끝으로 보내고, 그런 항목끼리는 원래 순서를 유지한다(안정 정렬).
 */
export function sortProjectsByPeriodDesc<T extends { period?: ProjectPeriod }>(
  projects: T[],
): T[] {
  return [...projects].sort((a, b) => {
    const aStart = a.period?.start;
    const bStart = b.period?.start;

    if (!aStart && !bStart) return 0;
    if (!aStart) return 1;
    if (!bStart) return -1;

    return bStart.localeCompare(aStart);
  });
}
