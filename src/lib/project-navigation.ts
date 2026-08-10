interface AdjacentProjects<T> {
  previous: T | null;
  next: T | null;
}

/**
 * F005 이전/다음 프로젝트 네비게이션. orderedProjects는 이미 정렬되어 있다고 가정하며(이 함수 자체는
 * 정렬하지 않는다), 그 배열 안에서 currentId 바로 앞/뒤 항목을 찾아 반환한다. currentId가 배열에 없거나
 * 첫/마지막 항목이면 해당 방향은 null이 된다.
 */
function findAdjacentProjects<T extends { id: string }>(
  orderedProjects: T[],
  currentId: string,
): AdjacentProjects<T> {
  const index = orderedProjects.findIndex((project) => project.id === currentId);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? orderedProjects[index - 1] : null,
    next: index < orderedProjects.length - 1 ? orderedProjects[index + 1] : null,
  };
}

export type { AdjacentProjects };
export { findAdjacentProjects };
