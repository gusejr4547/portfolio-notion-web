import type { ProjectPeriod } from "@/types/project";

/** "YYYY-MM-DD" (또는 시간 포함 ISO) 문자열의 앞 7자를 "YYYY.MM"로 변환한다. */
function formatMonth(date: string) {
  return date.slice(0, 7).replace(/-/g, ".");
}

/** 프로젝트 기간을 "YYYY.MM ~ YYYY.MM" 형태(월 단위)로 변환한다. 종료일이 없으면 "진행중", 기간 자체가 없으면 "기간 미정"을 반환한다. */
function formatPeriod(period: ProjectPeriod | undefined): string {
  if (!period) {
    return "기간 미정";
  }

  const start = formatMonth(period.start);
  const end = period.end ? formatMonth(period.end) : "진행중";

  return `${start} ~ ${end}`;
}

export { formatPeriod };
