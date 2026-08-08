import { sortProjectsByPeriodDesc } from "@/lib/sort-projects";
import type { ProjectPeriod } from "@/types/project";

/**
 * F003 대표 프로젝트 선별. featured가 true인 항목이 하나라도 있으면 그 항목들만(개수 제한 없이)
 * 원래 순서대로 반환하고, 하나도 없으면 sortProjectsByPeriodDesc로 정렬한 뒤 상위 fallbackLimit개를 반환한다.
 */
export function selectFeaturedProjects<T extends { featured: boolean; period?: ProjectPeriod }>(
  projects: T[],
  fallbackLimit = 3,
): T[] {
  const featured = projects.filter((project) => project.featured);

  if (featured.length > 0) {
    return featured;
  }

  return sortProjectsByPeriodDesc(projects).slice(0, fallbackLimit);
}
