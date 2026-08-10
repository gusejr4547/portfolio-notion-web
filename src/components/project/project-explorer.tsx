"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/project/empty-state";
import { ProjectGrid } from "@/components/project/project-grid";
import { SortDirectionToggle } from "@/components/project/sort-direction-toggle";
import { TechStackFilter } from "@/components/project/tech-stack-filter";
import {
  collectTechStackOptions,
  filterProjectsByTechStack,
} from "@/lib/filter-projects";
import {
  sortProjectsByPeriodAsc,
  sortProjectsByPeriodDesc,
  type SortDirection,
} from "@/lib/sort-projects";
import type { ProjectSummary } from "@/types/project";

type ProjectExplorerProps = {
  projects: ProjectSummary[];
};

/**
 * F004: 프로젝트 목록의 기술스택 필터(OR 매칭)와 정렬 방향 토글을 하나로 묶는 컨테이너.
 * 상태는 이 컴포넌트 내부 useState로만 유지하며(URL 쿼리 동기화는 범위 밖), 필터/정렬은
 * 항상 filter-projects/sort-projects의 순수 함수를 통해 파생값(useMemo)으로 계산한다.
 */
function ProjectExplorer({ projects }: ProjectExplorerProps) {
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const techStackOptions = useMemo(
    () => collectTechStackOptions(projects),
    [projects],
  );

  const visibleProjects = useMemo(() => {
    const filtered = filterProjectsByTechStack(projects, selectedTechStack);

    return sortDirection === "desc"
      ? sortProjectsByPeriodDesc(filtered)
      : sortProjectsByPeriodAsc(filtered);
  }, [projects, selectedTechStack, sortDirection]);

  function handleToggle(tech: string) {
    setSelectedTechStack((prev) =>
      prev.includes(tech) ? prev.filter((selected) => selected !== tech) : [...prev, tech],
    );
  }

  function handleClear() {
    setSelectedTechStack([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {techStackOptions.length > 0 ? (
          <TechStackFilter
            options={techStackOptions}
            selected={selectedTechStack}
            onToggle={handleToggle}
            onClear={handleClear}
          />
        ) : null}
        <SortDirectionToggle value={sortDirection} onChange={setSortDirection} />
      </div>
      {visibleProjects.length === 0 && selectedTechStack.length > 0 ? (
        <EmptyState
          title="조건에 맞는 프로젝트가 없습니다"
          description="다른 기술스택을 선택해보세요."
        />
      ) : (
        <ProjectGrid projects={visibleProjects} />
      )}
    </div>
  );
}

export { ProjectExplorer };
