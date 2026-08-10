/**
 * 기술스택 다중 선택 시 OR(합집합) 매칭: 선택한 기술 중 하나라도 포함하면 노출한다.
 * 선택이 비어 있으면 전체를 그대로 반환한다.
 */
export function filterProjectsByTechStack<T extends { techStack: string[] }>(
  projects: T[],
  selectedTechStack: string[],
): T[] {
  if (selectedTechStack.length === 0) return projects;

  return projects.filter((project) =>
    selectedTechStack.some((tech) => project.techStack.includes(tech)),
  );
}

/** 전체 프로젝트의 기술스택을 중복 제거 후 사전순(localeCompare)으로 정렬해 필터 옵션 목록을 만든다. */
export function collectTechStackOptions<T extends { techStack: string[] }>(
  projects: T[],
): string[] {
  const unique = new Set<string>();

  for (const project of projects) {
    for (const tech of project.techStack) {
      unique.add(tech);
    }
  }

  return [...unique].sort((a, b) => a.localeCompare(b));
}
