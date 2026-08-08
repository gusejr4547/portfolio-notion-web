# Task 007: F001 프로젝트 목록 조회 연동

> 직전 완료 작업: `tasks/006-notion-client-data-access.md`, `tasks/005-notion-block-renderer.md`

## 고수준 명세서

Phase 3의 두 번째 작업으로, Task006이 구축한 `getProjects()`(Notion 데이터 액세스 계층)를 실제로 소비해
`/projects` 목록 페이지를 더미 데이터에서 실데이터로 전환한다. `getProjects()`는 정렬되지 않은 순서로
프로젝트를 반환하므로, "기간(시작일) 기준 최신순" 정렬 규칙을 `src/lib/sort-projects.ts`의 제네릭 순수
함수로 분리했다. 이 함수는 `Project[]`/`ProjectSummary[]` 어디에나 재사용 가능하게 설계해 Task008(홈
대표 프로젝트 fallback 정렬)에서도 그대로 쓸 수 있게 했다.

작업 규모에 맞춰 Shrimp MCP로 4개 서브태스크(Task007-1~4)로 나눠 순차 진행했다: 정렬 순수 함수 구현 →
목록 페이지 실데이터 연동 → 실데이터 전환으로 깨지는 e2e 테스트 분리 수정 → 통합 검증 및 문서화(현재
작업). 홈(`src/app/page.tsx`)과 상세(`src/app/projects/[id]/page.tsx`)는 각각 Task008/Task009의
몫이라 이번 범위에서 변경하지 않았다.

## 관련 파일

- `src/lib/sort-projects.ts` (신규) — `sortProjectsByPeriodDesc<T extends { period?: ProjectPeriod }>()`
- `src/lib/sort-projects.test.ts` (신규)
- `src/app/projects/page.tsx` (수정) — async Server Component 전환, `getProjects()` + 정렬 연동
- `e2e/navigation.spec.ts` (수정) — mock 데이터 의존 테스트를 데이터 비의존 테스트로 분리
- `src/lib/notion/index.ts`, `src/components/project/project-grid.tsx` (참고, 변경 없음)

## 수락 기준

- [x] `src/app/projects/page.tsx`가 async Server Component로 전환되어 `getProjects()`로 실제 Notion
      데이터를 조회한다
- [x] 기간(시작일) 기준 최신순 정렬 로직이 `src/lib/sort-projects.ts`의 순수 함수로 분리되어 있다
- [x] 정렬 함수 유닛 테스트 `src/lib/sort-projects.test.ts`가 node 환경에서 작성되어 있다
- [x] 프로젝트 0건 시 `ProjectGrid`의 기존 `EmptyState`가 그대로 렌더링되고, 조회 실패 시 루트
      `error.tsx`로 에러가 위임된다
- [x] Playwright MCP로 `/projects` 목록 렌더링과 카드 클릭 → 상세 이동을 확인하고 E2E 스펙에 반영했다
- [x] `npm run test:run`, `npm run build`, `npm run test:e2e`가 모두 통과한다
- [x] `docs/ROADMAP.md`의 Task 007 제목에 완료 표시가 추가된다

## 테스트 체크리스트

Notion API 연동/비즈니스 로직 작업이므로 아래 케이스를 유닛(node) + E2E로 커버했다.

- [x] **최신순 정렬**: `sort-projects.test.ts`에서 셔플된 `mockProjects`를 정렬해 `period.start` 내림차순
      결과가 나오는지 검증
- [x] **시작일 없는 항목 처리**: `sort-projects.test.ts`에서 `period`/`period.start`가 없는 항목이 항상
      배열 끝으로 이동하고, 그런 항목끼리는 안정 정렬로 원래 순서를 유지함을 검증
- [x] **원본 배열 불변성**: `sort-projects.test.ts`에서 정렬 호출 후 원본 배열 순서가 바뀌지 않음을 검증
- [x] **빈 배열 / 전부 시작일 없음**: `sort-projects.test.ts`에서 각각 빈 배열 반환, 원래 순서 유지를 검증
- [x] **목록 실데이터 카드 렌더링**: `e2e/navigation.spec.ts`의 신규 테스트에서 `/projects`가
      `a[href^="/projects/"]` 링크(실제 Notion 프로젝트 카드)를 1개 이상 렌더링함을 검증
- [x] **카드 클릭 → 상세 URL 이동**: 같은 테스트에서 첫 카드를 클릭하면 URL이 `/projects/[id]` 패턴
      (`/\/projects\/[^/]+$/`)으로 바뀜을 검증(상세 페이지는 아직 mock 기반이라 콘텐츠는 검증하지 않음)
- [x] **0건 시 EmptyState**: Task003의 `src/components/project/project-grid.test.tsx`가 이미 커버 —
      이번 작업에서는 신규 테스트 없이 기존 커버리지를 재확인
- [x] **조회 실패 시 에러 전파**: `getProjects()`가 throw하는 `NotionDataAccessError`(Task006에서 유닛
      테스트 완료)를 페이지에서 catch하지 않고 루트 `error.tsx`로 위임하는 구조로 구현(신규 테스트 없음)

## 구현 단계

Shrimp MCP로 4개 서브태스크로 세분화해 순차 실행했다(각 서브태스크 `execute_task`→구현→`verify_task`).

1. **Task007-1** — 기간 최신순 정렬 순수 함수 구현(`sort-projects.ts`+test)
2. **Task007-2** — 프로젝트 목록 페이지 실데이터 연동(`page.tsx` async 전환)
3. **Task007-3** — e2e 회귀 수정 및 실데이터 목록 E2E 반영(`navigation.spec.ts`)
4. **Task007-4** — 통합 검증 및 작업 문서화(현재 작업)

이번 세션에서는 서브태스크별 커밋을 별도로 만들지 않았다(커밋 여부는 이번 작업 범위 밖).

## 변경 요약

- `src/lib/sort-projects.ts`에 `sortProjectsByPeriodDesc()` 제네릭 순수 함수를 신규 구현. ISO
  `YYYY-MM-DD` 문자열의 사전식 비교가 곧 시간순 비교와 같다는 점을 이용해 `Date` 파싱 없이 구현했고,
  `period`/`period.start`가 없는 항목은 항상 끝으로 보내되 안정 정렬로 상대 순서를 유지한다
- `src/app/projects/page.tsx`를 async Server Component로 전환해 `mockProjects` import를 제거하고
  `getProjects()` → `sortProjectsByPeriodDesc()` → `ProjectGrid`로 이어지는 파이프라인을 구성. `Project`가
  `ProjectSummary`의 구조적 상위집합이라 별도 매핑 없이 그대로 전달했고, try/catch 없이 에러를 루트
  `error.tsx`로 위임했다
- `e2e/navigation.spec.ts`의 mock 데이터 하드코딩 테스트 1개를 데이터 비의존적인 2개 테스트로 분리해,
  목록이 실데이터로 바뀌어도 안정적으로 통과하도록 했다(`a[href^="/projects/"]` 셀렉터로 카드 특정)
- 홈(`src/app/page.tsx`)과 상세(`src/app/projects/[id]/page.tsx`)는 각각 Task008/Task009 범위라 이번
  작업에서 전혀 수정하지 않았다

### 검증 결과

- `npm run test:run`: 21개 테스트 파일, 91개 테스트 전부 통과(회귀 없음)
- `npm run build`: Turbopack 프로덕션 빌드 성공, 타입 체크 통과. `/projects`가 실제 Notion 데이터로
  정적 프리렌더됨(`○ /projects`, Revalidate 1h / Expire 1y)을 빌드 로그로 확인
- `npm run test:e2e`: 11개 테스트 전부 통과(신규/수정된 목록 테스트 2개 포함, 기존 홈 대표 카드·GitHub
  버튼·데모 버튼·404 테스트 회귀 없음)
- Playwright MCP: `npm run dev` 로컬 서버에서 `/projects`에 접속해 실제 Notion 프로젝트 카드 2건
  ("프로젝트 1", "프로젝트 2", 정렬 규칙대로 진행중 항목이 먼저 노출)이 렌더링됨을 확인. 첫 카드를
  클릭해 URL이 실제 Notion 페이지 ID 경로(`/projects/3b628b62-...`)로 이동함을 확인(상세 페이지 자체는
  아직 mock 기반이라 "프로젝트를 찾을 수 없습니다"가 뜨는 것은 예상된 동작이며 Task009 범위)
