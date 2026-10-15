import { z } from "zod";

/** PDF에 넣을 수 있는 프로젝트별 영역. */
export const EXPORT_SECTIONS = [
  "thumbnail",
  "summary",
  "techStack",
  "links",
  "body",
] as const;

export type ExportSection = (typeof EXPORT_SECTIONS)[number];

/**
 * 내보내기 선택 상태. "꺼진 것만" 저장하므로 기본값은 전부 켜짐이고,
 * 새 프로젝트가 생겨도 별도 마이그레이션 없이 켜진 상태로 시작한다.
 */
export interface ExportState {
  order: string[];
  hiddenProjects: string[];
  hiddenSections: Record<string, ExportSection[]>;
  includeProfile: boolean;
}

const exportStateSchema = z.object({
  order: z.array(z.string()),
  hiddenProjects: z.array(z.string()),
  hiddenSections: z.record(z.string(), z.array(z.enum(EXPORT_SECTIONS))),
  includeProfile: z.boolean(),
});

export function createDefaultState(projectIds: string[]): ExportState {
  return {
    order: [...projectIds],
    hiddenProjects: [],
    hiddenSections: {},
    includeProfile: true,
  };
}

/** 경계(첫/마지막)에서는 같은 배열 내용을 돌려준다. */
export function moveItem(
  order: string[],
  id: string,
  direction: "up" | "down",
): string[] {
  const index = order.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= order.length) return [...order];

  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** 드래그 앤 드롭용: `id`를 `overId`가 있던 자리로 옮긴다. 둘 중 하나라도 없거나 같으면 변화 없음. */
export function moveItemTo(
  order: string[],
  id: string,
  overId: string,
): string[] {
  const from = order.indexOf(id);
  const to = order.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return [...order];

  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function toggleProject(state: ExportState, id: string): ExportState {
  return { ...state, hiddenProjects: toggleInList(state.hiddenProjects, id) };
}

export function toggleSection(
  state: ExportState,
  id: string,
  section: ExportSection,
): ExportState {
  const hidden = toggleInList(state.hiddenSections[id] ?? [], section);
  const hiddenSections = { ...state.hiddenSections };
  if (hidden.length === 0) {
    delete hiddenSections[id];
  } else {
    hiddenSections[id] = hidden;
  }
  return { ...state, hiddenSections };
}

export function toggleProfile(state: ExportState): ExportState {
  return { ...state, includeProfile: !state.includeProfile };
}

export function isProjectSelected(state: ExportState, id: string): boolean {
  return !state.hiddenProjects.includes(id);
}

export function isSectionVisible(
  state: ExportState,
  id: string,
  section: ExportSection,
): boolean {
  return !(state.hiddenSections[id] ?? []).includes(section);
}

/**
 * 저장된 상태를 현재 프로젝트 목록에 맞춘다. 삭제된 id는 제거하고,
 * 새 id는 순서 끝에 추가한다. 저장값이 없거나 형태가 틀리면 기본값을 돌려준다.
 */
export function normalize(
  saved: ExportState | null | undefined,
  projectIds: string[],
): ExportState {
  const parsed = exportStateSchema.safeParse(saved);
  if (!parsed.success) return createDefaultState(projectIds);

  const known = new Set(projectIds);
  const order = [...new Set(parsed.data.order)].filter((id) => known.has(id));
  for (const id of projectIds) {
    if (!order.includes(id)) order.push(id);
  }

  const hiddenSections: Record<string, ExportSection[]> = {};
  for (const [id, sections] of Object.entries(parsed.data.hiddenSections)) {
    if (known.has(id) && sections.length > 0) {
      hiddenSections[id] = [...new Set(sections)];
    }
  }

  return {
    order,
    hiddenProjects: parsed.data.hiddenProjects.filter((id) => known.has(id)),
    hiddenSections,
    includeProfile: parsed.data.includeProfile,
  };
}

export function serialize(state: ExportState): string {
  return JSON.stringify(state);
}

/** 손상됐거나 형태가 맞지 않는 JSON은 null. */
export function parse(raw: string | null | undefined): ExportState | null {
  if (!raw) return null;
  try {
    const result = exportStateSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
