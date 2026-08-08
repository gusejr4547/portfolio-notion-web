# Task 008: F003 홈 대표 프로젝트 하이라이트 연동

> 직전 완료 작업: `tasks/007-f001-project-list-integration.md`, `tasks/006-notion-client-data-access.md`

## 고수준 명세서

Phase 3의 세 번째 작업으로, Task007이 `/projects` 목록 페이지에 적용한 "async Server Component +
`getProjects()` 실데이터 연동" 패턴을 홈(`src/app/page.tsx`)에도 적용해 PRD F003(대표 체크된 프로젝트만
홈에 노출, 없으면 기간 최신순으로 대체 노출)을 실데이터로 구현한다. 대표 선별 규칙을
`src/lib/select-featured-projects.ts`의 제네릭 순수 함수로 분리했고, fallback 정렬은 Task007이 만든
`sortProjectsByPeriodDesc()`를 그대로 재사용해 정렬 로직을 중복 작성하지 않았다.

작업 규모에 맞춰 Shrimp MCP로 4개 서브태스크(Task008-1~4)로 나눠 순차 진행했다: 선별 순수 함수 구현 →
홈페이지 실데이터 연동 → 실데이터 전환으로 깨지는 홈 e2e 테스트 수정 및 Playwright MCP 검증 → 통합 검증
및 문서화(현재 작업). Next.js 구현(서브태스크 1, 2)은 `nextjs-developer` 서브에이전트에, E2E 테스트
수정/검증(서브태스크 3)은 `test-engineer` 서브에이전트에 위임했다. 상세 페이지(`src/app/projects/[id]/page.tsx`)는
Task009 범위라 이번 작업에서 변경하지 않았다.

## 관련 파일

- `src/lib/select-featured-projects.ts` (신규) — `selectFeaturedProjects<T extends { featured: boolean; period?: ProjectPeriod }>(projects, fallbackLimit = 3)`
- `src/lib/select-featured-projects.test.ts` (신규)
- `src/app/page.tsx` (수정) — async Server Component 전환, `getProjects()` + `selectFeaturedProjects()` 연동
- `e2e/navigation.spec.ts` (수정) — 홈 대표 카드 mock 하드코딩 테스트를 데이터 비의존 테스트로 교체
- `src/lib/sort-projects.ts`, `src/lib/notion/index.ts`, `src/components/project/project-grid.tsx` (참고, 변경 없음)

## 수락 기준

- [x] `src/app/page.tsx`가 async Server Component로 전환되어 `getProjects()`로 실제 Notion 데이터를
      조회한다
- [x] `대표`(featured) 체크박스 필터링과, 대표가 하나도 없을 때 기간 최신순 상위 3개로 대체 노출하는
      fallback 로직이 `src/lib/select-featured-projects.ts`의 순수 함수로 분리되어 있다
- [x] 선별 함수 유닛 테스트 `src/lib/select-featured-projects.test.ts`가 node 환경에서 대표 전부/일부/
      없음 3케이스를 포함해 작성되어 있다
- [x] 홈의 "전체 프로젝트 보기" CTA가 `/projects` 목록 페이지로 연결되어 있다(기존 구현 유지 확인)
- [x] Playwright MCP로 홈의 대표 프로젝트 노출과 카드 클릭 → 상세 이동을 확인하고 E2E 스펙에 반영했다
- [x] `npm run test:run`, `npm run build`, `npm run test:e2e`가 모두 통과한다
- [x] `docs/ROADMAP.md`의 Task 008 제목에 완료 표시가 추가된다

## 테스트 체크리스트

Notion API 연동/비즈니스 로직 작업이므로 아래 케이스를 유닛(node) + E2E로 커버했다.

- [x] **대표 일부**: `select-featured-projects.test.ts`에서 `mockProjects`(6건 중 2건 featured)를 입력해
      featured 항목만 원래 순서대로 반환됨을 검증
- [x] **대표 전부**: `select-featured-projects.test.ts`에서 전부 `featured: true`인 ad-hoc 4건 입력 시
      개수 제한 없이 전부 반환됨을 검증(fallback 로직이 적용되지 않음을 확인)
- [x] **대표 없음**: `select-featured-projects.test.ts`에서 전부 `featured: false`인 ad-hoc 4건 입력 시
      `sortProjectsByPeriodDesc` 결과 상위 3개만 반환됨을 검증
- [x] **원본 배열 불변성**: `select-featured-projects.test.ts`에서 호출 후 원본 배열 순서가 바뀌지
      않음을 검증
- [x] **빈 배열 입력**: `select-featured-projects.test.ts`에서 빈 배열 입력 시 빈 배열을 반환함을 검증
- [x] **fallbackLimit 오버라이드**: `select-featured-projects.test.ts`에서 대표가 없을 때 `fallbackLimit`
      파라미터로 지정한 개수만큼만 반환됨을 검증
- [x] **홈 대표 프로젝트 실데이터 카드 렌더링**: `e2e/navigation.spec.ts`의 수정된 테스트에서 홈(`/`)이
      `a[href^="/projects/"]` 링크(실제 Notion 프로젝트 카드)를 1개 이상 렌더링함을 검증
- [x] **카드 클릭 → 상세 URL 이동**: 같은 테스트에서 첫 카드를 클릭하면 URL이 `/projects/[id]` 패턴
      (`/\/projects\/[^/]+$/`)으로 바뀜을 검증(상세 페이지는 아직 mock 기반이라 콘텐츠는 검증하지 않음)
- [x] **전체 프로젝트 보기 CTA**: 기존 `e2e/navigation.spec.ts` 테스트("홈에서 전체 프로젝트 보기 클릭 시
      목록 페이지로 이동한다")가 변경 없이 계속 통과함을 재확인

## 구현 단계

Shrimp MCP로 4개 서브태스크로 세분화해 순차 실행했다(각 서브태스크 `execute_task`→구현→`verify_task`).

1. **Task008-1** — `selectFeaturedProjects` 순수 함수 구현(`select-featured-projects.ts`+test),
   `nextjs-developer` 서브에이전트 위임
2. **Task008-2** — 홈페이지 실데이터 연동(`page.tsx` async 전환), `nextjs-developer` 서브에이전트 위임
3. **Task008-3** — 홈 e2e 테스트 수정 및 Playwright MCP 검증(`navigation.spec.ts`), `test-engineer`
   서브에이전트 위임
4. **Task008-4** — 통합 검증 및 작업 문서화(현재 작업)

이번 세션에서는 서브태스크별 커밋을 별도로 만들지 않았다(커밋 여부는 이번 작업 범위 밖).

## 변경 요약

- `src/lib/select-featured-projects.ts`에 `selectFeaturedProjects()` 제네릭 순수 함수를 신규 구현.
  `featured === true`인 항목이 있으면 개수 제한 없이 그대로 반환하고, 없으면 `sortProjectsByPeriodDesc()`를
  재사용해 정렬한 뒤 상위 `fallbackLimit`(기본값 3, 사용자 확정)개를 반환한다
- `src/app/page.tsx`를 async Server Component로 전환해 `mockProjects` import와
  `mockProjects.filter(p => p.featured)`를 제거하고 `getProjects()` → `selectFeaturedProjects()` →
  `ProjectGrid`로 이어지는 파이프라인을 구성. try/catch 없이 에러를 루트 `error.tsx`로 위임했다
  (Task007-2와 동일 원칙). 히어로 문구와 "전체 프로젝트 보기" `Button`/`Link`는 변경하지 않았다
- `e2e/navigation.spec.ts`의 mock 데이터 하드코딩 테스트("홈에서 대표 프로젝트 카드를 클릭하면 상세로
  이동한다")를 데이터 비의존 테스트("홈은 대표 프로젝트 카드를 렌더링하고, 카드 클릭 시 상세 페이지로
  이동한다")로 교체해, 대표 프로젝트가 실데이터로 바뀌어도 안정적으로 통과하도록 했다
  (`a[href^="/projects/"]` 셀렉터로 카드 특정)
- 상세(`src/app/projects/[id]/page.tsx`)는 Task009 범위라 이번 작업에서 전혀 수정하지 않았다

### 검증 결과

- `npm run test:run`: 22개 테스트 파일, 97개 테스트 전부 통과(회귀 없음)
- `npm run build`: Turbopack 프로덕션 빌드 성공, 타입 체크 통과. `/`가 실제 Notion 데이터로 정적
  프리렌더됨(`○ /`, Revalidate 1h / Expire 1y)을 빌드 로그로 확인
- `npm run test:e2e`: 11개 테스트 전부 통과(수정된 홈 대표 카드 테스트 포함, 전체 프로젝트 보기 CTA·
  목록·GitHub 버튼·데모 버튼·404 테스트 회귀 없음)
- Playwright MCP: `npm run dev` 로컬 서버에서 `/`에 접속해 "대표 프로젝트" 섹션에 실제 Notion 프로젝트
  카드("프로젝트 1", 요약/기간/기술스택 뱃지 포함)가 렌더링됨을 확인. 카드를 클릭해 URL이 실제 Notion
  페이지 ID 경로(`/projects/3b628b62-...`)로 이동함을 확인(상세 페이지 자체는 아직 mock 기반이라
  "프로젝트를 찾을 수 없습니다"가 뜨는 것은 예상된 동작이며 Task009 범위)
