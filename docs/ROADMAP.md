# Notion 포트폴리오 사이트 개발 로드맵

Notion에 정리해 둔 프로젝트 정보를 별도 관리 화면 없이 웹 포트폴리오로 노출한다.

## 개요

MVP(F001~F003: 프로젝트 목록 조회, 프로젝트 상세 조회, 대표 프로젝트 하이라이트)는 개발이 완료되어 Vercel에 배포되었다. Phase 1~4(Task 001~012) 전체 내역은 [docs/roadmaps/ROADMAP_v1.md](./roadmaps/ROADMAP_v1.md)에 아카이브되어 있다.

이번 로드맵(Phase 5)은 이미 수집 중인 `기술스택`·`기간` 데이터를 활용해 방문자의 프로젝트 탐색 경험을 넓히는 두 가지 기능을 추가한다:

- **프로젝트 목록 기술스택 필터링 및 정렬 방향 토글**: 프로젝트 목록에서 기술스택으로 추려 보고 기간 정렬 방향을 전환 (프로젝트 목록)
- **프로젝트 상세 이전/다음 프로젝트 네비게이션**: 프로젝트 상세에서 목록으로 되돌아가지 않고 인접 프로젝트로 이동 (프로젝트 상세)

두 기능은 [docs/PRD.md](./PRD.md)에 정식 요구사항으로 등재되어 있다.

### 기술 스택

Next.js 16(App Router, Turbopack) / React 19 / TypeScript 5 / TailwindCSS v4(CSS-first) / shadcn-ui(base-nova, Base UI) / Lucide React / next-themes / `@notionhq/client` / Vercel / npm

기존 스택을 그대로 사용하며 Phase 5에서 새로 도입하는 의존성은 없다.

### 사용자 여정

```
홈(대표 프로젝트)
  → 프로젝트 목록 ── 기술스택 필터 / 정렬 방향 토글로 추려 보기
  → 프로젝트 상세 ── 이전·다음 프로젝트로 연속 열람
  → GitHub/데모 외부 링크(새 탭)
```

### 범위 제외

아래 항목은 이번 로드맵의 범위가 아니며, 별도 요청 시 새로운 Phase로 추가한다.

- 키워드 검색 (PRD "MVP 이후 기능"의 필터링·검색 중 검색은 계속 제외)
- 필터/정렬 상태의 URL 쿼리 동기화 및 공유 가능한 필터 링크
- 기술스택 다중 선택의 AND(교집합) 매칭 — 이번에는 OR(합집합)만 지원
- 블로그/노트 페이지, 소개(About) 전용 페이지, Contact/문의 페이지
- 로그인/관리자 기능 (콘텐츠 수정은 Notion에서 직접 수행)
- 다국어 지원

### 현재 저장소 기준선

- MVP 3개 페이지(홈/프로젝트 목록/프로젝트 상세)와 Notion 연동(F001~F003) 정상 동작, Vercel 배포 완료
- `/projects`, `/projects/[id]` 모두 `export const revalidate = 600` ISR 적용 — Phase 5의 Client Component 분리는 이 캐시 전략을 유지해야 한다
- `getProjects`/`getProjectById`/`getProjectBlocks`는 `cache(unstable_cache(...))`로 감싼 async 함수(`src/lib/notion/projects.ts`)라 같은 요청 안에서 중복 호출해도 재조회가 발생하지 않는다
- `techStack: string[]`(Notion multi-select) 필드는 모든 프로젝트에 존재하지만 필터/검색에는 미사용
- `src/lib/sort-projects.ts`에 `sortProjectsByPeriodDesc` 순수 함수 존재 (기간 기준 최신순 정렬, 미입력 항목은 항상 끝으로 보내는 안정 정렬)
- `src/components/project/empty-state.tsx`의 `EmptyState`는 `title`/`description` props를 받으며, `ProjectGrid`는 0건일 때 기본 문구로 이를 렌더한다
- `src/app/projects/page.tsx`는 필터/정렬 UI 없는 async Server Component이고, `/projects/[id]` 상세 페이지에는 이전/다음 프로젝트 이동 수단이 없다
- 클라이언트 상태를 다루는 프로젝트 컴포넌트는 아직 없다 (`"use client"`는 `mode-toggle`, `theme-provider`, error boundary, shadcn primitive에만 존재)

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- `/tasks` 디렉토리에 새 작업 파일 생성 (명명 형식: `XXX-description.md`, 예: `013-project-list-controls.md`)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- 비즈니스 로직 및 화면 상호작용 작업은 "## 테스트 체크리스트" 섹션을 필수로 포함하고 Playwright MCP 테스트 시나리오를 작성
- 직전 완료 작업 2개를 예시로 참조 (Phase 5 착수 시에는 `/tasks/010-core-user-flow-integration.md`, `/tasks/009-f002-project-detail-integration.md`)
- 완료된 작업 파일은 체크된 박스와 변경 사항 요약을 포함하므로, 새 작업 파일은 빈 박스와 요약 없는 초기 상태로 작성

3. **작업 구현**

- 작업 파일의 명세서를 따라 기능 구현
- 화면 상호작용(필터/정렬 토글, 인접 이동) 구현 시 Playwright MCP로 실제 동작을 확인
- 각 단계 후 작업 파일 내 진행 상황 업데이트
- 구현 완료 후 `npm run test:run`, `npm run test:e2e` 통과 확인
- 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 완료된 Task 제목에 `✅ - 완료`와 `See: /tasks/XXX-description.md` 참조를 추가
- Phase의 모든 Task가 끝나면 Phase 제목에 완료 표시를 추가

## 테스트 전략

AGENTS.md의 레벨 판단 기준을 그대로 따른다. 공통 실행 명령과 픽스처 규칙은 [docs/roadmaps/ROADMAP_v1.md](./roadmaps/ROADMAP_v1.md#테스트-전략)와 동일하다.

| 대상 | 레벨 | 파일 규칙 |
| --- | --- | --- |
| 기술스택 필터링, 오름차순 정렬, 인접 프로젝트 조회 등 순수 로직 | 유닛(node) | `src/lib/*.test.ts` |
| 필터 버튼 그룹, 정렬 토글, 인접 네비게이션 등 sync/client 컴포넌트 | 유닛(jsdom) | `src/components/**/*.test.tsx` |
| 필터·정렬 조합의 실제 화면 반영, 상세 간 왕복 이동 등 라우팅 플로우 | E2E | `e2e/*.spec.ts` |

- 컴포넌트 테스트는 `src/test/utils.tsx`의 provider 포함 `render`를 재사용한다 (RTL 기본 `render`를 새로 import하지 않는다)
- E2E는 Notion 실데이터에 의존하므로 프로젝트 개수·기술스택 태그명을 하드코딩하지 않고 상대적 검증(선택 전후 개수 비교, URL 변화)으로 작성한다
- 테스트 작성/실행/실패 진단은 `.claude/agents/test-engineer.md` 서브에이전트에 위임할 수 있다

## 개발 단계

### Phase 5: 프로젝트 탐색 기능 강화

PRD가 "MVP 이후 기능"으로 분류했던 태그 필터링과 겹치지만, 이미 수집 중인 `기술스택` 데이터를 활용하는 작은 확장이라 사용자 요청에 따라 예외적으로 진행하며 PRD에 정식 요구사항으로 등재했다. 검색·블로그·About 등 나머지 MVP 이후 항목은 계속 범위 밖이다.

> Task 013/014의 개별 작업 파일(`/tasks/013-*.md`, `/tasks/014-*.md`)은 아직 생성되지 않았다. 이번 라운드는 로드맵·PRD 문서화까지이며, 착수 시 "개발 워크플로우 2. 작업 생성" 절차부터 시작한다.

- **Task 013: 프로젝트 목록 기술스택 필터링 및 정렬 방향 토글** - 우선순위
  - `/projects` 목록 페이지를 async Server Component(데이터 조회)와 신규 Client Component `ProjectExplorer`(필터/정렬 상태)로 분리하고, 기존 `revalidate = 600` ISR 설정을 유지
  - `src/lib/filter-projects.ts` 신규: `filterProjectsByTechStack`(다중 선택 시 OR/합집합 매칭), `collectTechStackOptions`(중복 제거 + 사전순 `localeCompare` 정렬)
  - `src/lib/sort-projects.ts`에 `sortProjectsByPeriodAsc` 추가 (오래된순, 기간 미입력 항목은 방향과 무관하게 항상 끝 — `sortProjectsByPeriodDesc(...).reverse()`로 구현 금지)
  - 기술스택 필터 버튼 그룹(`TechStackFilter`)과 정렬 방향 토글(`SortDirectionToggle`) UI 구현, 기존 `Button` 재사용(`Badge`는 `span` 기반이라 포커스/키보드 조작이 불가해 제외), 선택 상태에 `aria-pressed` 적용
  - 필터 결과 0건 시 `EmptyState`의 `title`/`description` props로 전용 안내 문구 노출 (`ProjectGrid`의 기본 빈 상태와 홈 화면 대표 프로젝트 섹션에는 영향 없음)
  - URL 쿼리 동기화는 범위 밖이며, 필터/정렬 상태는 `useState`로 페이지 내부에서만 유지
  - 유닛 테스트(node): `src/lib/sort-projects.test.ts`에 오름차순 케이스 추가, `src/lib/filter-projects.test.ts` 신규
  - 유닛 테스트(jsdom): `src/components/project/`에 `tech-stack-filter.test.tsx`, `sort-direction-toggle.test.tsx`, `project-explorer.test.tsx` 신규
  - E2E: `e2e/project-list-controls.spec.ts` 신규 (필터/정렬 조합 동작, 개수·태그명 하드코딩 없이 작성)

- **Task 014: 프로젝트 상세 이전/다음 프로젝트 네비게이션**
  - `src/lib/project-navigation.ts` 신규: `findAdjacentProjects(orderedProjects, currentId)` — 정렬된 배열 기준 인접 항목 조회, 첫/마지막 항목·단일 프로젝트·미존재 id 엣지 케이스 처리
  - `/projects/[id]` 상세 페이지에서 `sortProjectsByPeriodDesc(await getProjects())` 기준(목록 페이지의 일시적 정렬 토글 상태와 무관한 정식 순서)으로 이전/다음을 조회. `getProjects`는 `cache()`로 감싸져 있어 `generateStaticParams`와 함께 호출해도 요청당 중복 조회가 없다
  - `ProjectNavigation` 컴포넌트 신규: `ProjectLinks` 하단에 이전/다음 링크 배치, `rel="prev"`/`rel="next"` 부여, 인접 항목이 하나도 없으면(단일 프로젝트 카탈로그) 네비게이션 자체를 숨김
  - 링크는 `ProjectLinks`와 동일한 Base UI 관례(`Button`의 `nativeButton={false}` + `render={<Link/>}`)를 따르되 내부 이동이므로 새 탭을 열지 않음
  - 유닛 테스트(node): `src/lib/project-navigation.test.ts` 신규 (첫/마지막/중간/단일/미존재 id 케이스)
  - 유닛 테스트(jsdom): `src/components/project/project-navigation.test.tsx` 신규
  - E2E: `e2e/project-detail-navigation.spec.ts` 신규 (이전/다음 링크 클릭 시 URL 이동 및 왕복 확인)
