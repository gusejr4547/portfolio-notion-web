import type { ProjectPeriod } from "@/types/project";

/** "YYYY-MM-DD" (또는 시간 포함 ISO) 문자열의 앞 10자를 "YYYY.MM.DD"로 변환한다. */
function formatDate(date: string) {
  return date.slice(0, 10).replace(/-/g, ".");
}

/** 프로젝트 기간을 "YYYY.MM.DD ~ YYYY.MM.DD" 형태로 변환한다. 종료일이 없으면 "진행중", 기간 자체가 없으면 "기간 미정"을 반환한다. */
function formatPeriod(period: ProjectPeriod | undefined): string {
  if (!period) {
    return "기간 미정";
  }

  const start = formatDate(period.start);
  const end = period.end ? formatDate(period.end) : "진행중";

  return `${start} ~ ${end}`;
}

export { formatPeriod };
