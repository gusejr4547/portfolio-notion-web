"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Printer } from "lucide-react";
import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ProjectThumbnail } from "@/components/project/project-thumbnail";
import { TechStackBadges } from "@/components/project/tech-stack-badges";
import { formatPeriod } from "@/lib/format-period";
import {
  EXPORT_SECTIONS,
  createDefaultState,
  isProjectSelected,
  isSectionVisible,
  moveItem,
  moveItemTo,
  normalize,
  parse,
  serialize,
  toggleProfile,
  toggleProject,
  toggleSection,
  type ExportSection,
  type ExportState,
} from "@/lib/export/selection";
import { toSafeUrl } from "@/lib/safe-url";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

const STORAGE_KEY = "portfolio-export-v1";

const SECTION_LABEL: Record<ExportSection, string> = {
  thumbnail: "썸네일",
  summary: "요약",
  techStack: "기술 스택",
  links: "링크",
  body: "본문",
};

function readSavedState(): ExportState | null {
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeSavedState(state: ExportState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(state));
  } catch {
    // 저장소를 쓸 수 없어도(비공개 창 등) 내보내기 자체는 동작해야 한다.
  }
}

interface ExportBuilderProps {
  projects: Project[];
  /** 서버에서 렌더링한 프로젝트 본문(Notion 블록). 키는 프로젝트 id. */
  bodies: Record<string, ReactNode>;
  /** 서버에서 렌더링한 프로필. 프로필이 없으면 null. */
  profile: ReactNode;
}

function ExportBuilder({ projects, bodies, profile }: ExportBuilderProps) {
  const projectIds = projects.map((project) => project.id);
  const [state, setState] = useState<ExportState>(() =>
    createDefaultState(projectIds),
  );
  // 저장된 값을 읽기 전에는 기본값을 저장소에 덮어쓰지 않는다.
  const [restored, setRestored] = useState(false);

  // 하이드레이션 이후에만 localStorage를 읽어 서버 렌더와의 불일치(#418)를 피한다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 저장소(localStorage) 복원
    setState(normalize(readSavedState(), projectIds));
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 한 번만 복원
  }, []);

  useEffect(() => {
    if (restored) writeSavedState(state);
  }, [state, restored]);

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const orderedProjects = state.order
    .map((id) => projectById.get(id))
    .filter((project): project is Project => project !== undefined);
  const selectedProjects = orderedProjects.filter((project) =>
    isProjectSelected(state, project.id),
  );

  // 클릭만으로는 드래그가 시작되지 않게 약간 움직여야 시작한다(체크박스·버튼 클릭 보호).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    setState((s) => ({
      ...s,
      order: moveItemTo(s.order, String(active.id), String(over.id)),
    }));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-24 print:max-w-none print:gap-0 print:p-0">
      <section
        aria-label="내보내기 설정"
        className="flex flex-col gap-6 print:hidden"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              PDF 내보내기
            </h1>
            <p className="text-sm text-muted-foreground">
              포함할 프로젝트와 영역, 순서를 고른 뒤 인쇄 창에서 &quot;PDF로
              저장&quot;을 선택하세요.
            </p>
          </div>
          <Button onClick={() => window.print()}>
            <Printer aria-hidden />
            PDF 저장
          </Button>
        </div>

        {profile ? (
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={state.includeProfile}
              onCheckedChange={() => setState((s) => toggleProfile(s))}
            />
            프로필 포함
          </label>
        ) : null}

        <DndContext
          // 고정 id: 기본 id는 증가 카운터라 서버/클라이언트 렌더에서 aria 속성이 어긋난다(하이드레이션 오류).
          id="export-project-order"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={state.order}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-3">
              {orderedProjects.map((project, index) => (
                <SortableProjectItem
                  key={project.id}
                  project={project}
                  state={state}
                  setState={setState}
                  isFirst={index === 0}
                  isLast={index === orderedProjects.length - 1}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </section>

      <div
        data-testid="export-preview"
        className="flex flex-col gap-10 print:gap-0"
      >
        {profile && state.includeProfile ? (
          <div className="export-profile">{profile}</div>
        ) : null}

        {selectedProjects.map((project) => (
          <ExportProject
            key={project.id}
            project={project}
            state={state}
            body={bodies[project.id]}
          />
        ))}
      </div>
    </div>
  );
}

function SortableProjectItem({
  project,
  state,
  setState,
  isFirst,
  isLast,
}: {
  project: Project;
  state: ExportState;
  setState: Dispatch<SetStateAction<ExportState>>;
  isFirst: boolean;
  isLast: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });
  const selected = isProjectSelected(state, project.id);

  return (
    <li
      ref={setNodeRef}
      // Translate만 쓴다: Transform은 scale도 포함하는데, 항목 높이가 달라(영역 토글 줄 유무) 드래그 중 크기가 변한다.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border bg-background p-3",
        isDragging && "z-10 shadow-lg ring-2 ring-ring/40",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          aria-label={`${project.title} 순서 끌어서 변경`}
          className="-ml-1 flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium">
          <Checkbox
            checked={selected}
            onCheckedChange={() =>
              setState((s) => toggleProject(s, project.id))
            }
          />
          <span className="truncate">{project.title}</span>
        </label>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`${project.title} 위로 이동`}
          disabled={isFirst}
          onClick={() =>
            setState((s) => ({
              ...s,
              order: moveItem(s.order, project.id, "up"),
            }))
          }
        >
          <ArrowUp />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`${project.title} 아래로 이동`}
          disabled={isLast}
          onClick={() =>
            setState((s) => ({
              ...s,
              order: moveItem(s.order, project.id, "down"),
            }))
          }
        >
          <ArrowDown />
        </Button>
      </div>
      {selected ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2 pl-9">
          {EXPORT_SECTIONS.map((section) => (
            <label
              key={section}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Checkbox
                checked={isSectionVisible(state, project.id, section)}
                onCheckedChange={() =>
                  setState((s) => toggleSection(s, project.id, section))
                }
              />
              {SECTION_LABEL[section]}
            </label>
          ))}
        </div>
      ) : null}
    </li>
  );
}

function ExportProject({
  project,
  state,
  body,
}: {
  project: Project;
  state: ExportState;
  body: ReactNode;
}) {
  const visible = (section: ExportSection) =>
    isSectionVisible(state, project.id, section);
  const githubUrl = toSafeUrl(project.githubUrl);
  const demoUrl = toSafeUrl(project.demoUrl);

  return (
    <article
      data-testid="export-project"
      className="export-project flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {project.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {formatPeriod(project.period)}
        </p>
      </div>

      {visible("thumbnail") && project.thumbnailUrl ? (
        <ProjectThumbnail
          thumbnailUrl={project.thumbnailUrl}
          title={project.title}
          className="max-h-80 w-full rounded-lg"
        />
      ) : null}

      {visible("summary") && project.summary ? <p>{project.summary}</p> : null}

      {visible("techStack") && project.techStack.length > 0 ? (
        <TechStackBadges techStack={project.techStack} />
      ) : null}

      {visible("links") && (githubUrl || demoUrl) ? (
        <ul className="flex flex-col gap-1 text-sm">
          {githubUrl ? (
            <li>
              GitHub:{" "}
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="export-link underline underline-offset-4"
              >
                {githubUrl}
              </a>
            </li>
          ) : null}
          {demoUrl ? (
            <li>
              데모:{" "}
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="export-link underline underline-offset-4"
              >
                {demoUrl}
              </a>
            </li>
          ) : null}
        </ul>
      ) : null}

      {visible("body") && body ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold tracking-tight">소개</h3>
          {body}
        </section>
      ) : null}
    </article>
  );
}

export { ExportBuilder };
