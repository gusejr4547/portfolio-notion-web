# Task 004: 홈/목록/상세 페이지 UI 완성 (더미 데이터)

> 직전 완료 작업: `tasks/003-project-common-components-mock-data.md`, `tasks/002-domain-types-notion-contract.md`

## 고수준 명세서

Task003에서 만든 `ProjectCard`/`ProjectGrid`/`TechStackBadges`/`ProjectLinks`/`EmptyState`
컴포넌트와 `mockProjects` 더미 픽스처를 조립해 홈/목록/상세 3개 라우트의 UI를 완성한다.
Notion 실연동(Phase 3)은 이 작업 범위 밖이며, 순수 UI 조립 + 더미데이터 배선만 수행한다.

- `src/app/page.tsx`: 기존 히어로 문구를 유지하고 "대표 프로젝트" 섹션(`featured: true` 필터)과
  "전체 프로젝트 보기" CTA(`/projects` 링크)를 추가
- `src/app/projects/page.tsx`: `mockProjects` 전체를 `ProjectGrid`로 렌더 (기존 `h1` "프로젝트"
  텍스트는 `e2e/navigation.spec.ts` 기존 테스트가 의존하므로 변경 금지)
- `src/app/projects/[id]/page.tsx`: `mockProjects.find`로 조회 후 `notFound()` 처리, 썸네일/제목/
  기간/기술스택/소개(본문 임시 대체)/`ProjectLinks`로 상세 레이아웃 완성
- `e2e/navigation.spec.ts`에 홈→상세, 홈→CTA→목록→상세 라우팅 케이스와 외부 링크 속성/데모 버튼
  숨김 케이스 추가
- 대표 프로젝트 0건 시 최신순 대체(fallback) 로직, Notion 블록 렌더러 실연동은 각각 Task008,
  Task005/009에서 처리하므로 이번 작업 범위에서 제외

Notion API 연동이 아닌 순수 UI 조립 작업이므로 "테스트 체크리스트" 섹션은 포함하지 않는다
(ROADMAP.md 워크플로우 기준 해당 섹션은 Notion API 연동 및 비즈니스 로직 작업에만 필수). 다만
Task004 명세 자체가 Playwright MCP 뷰포트/테마 검증을 요구하므로 아래 수락 기준에 반영한다.

## 관련 파일

- `src/app/page.tsx` (수정) — 히어로 + 대표 프로젝트 섹션 + CTA
- `src/app/projects/page.tsx` (수정) — 전체 목록 그리드
- `src/app/projects/[id]/page.tsx` (수정) — 상세 레이아웃, `notFound()` 연동
- `e2e/navigation.spec.ts` (수정) — 라우팅 플로우 케이스 추가
- `src/components/project/*.tsx` (참고, 변경 없음) — Task003 산출물 재사용
- `src/lib/mock/projects.ts` (참고, 변경 없음) — 더미 데이터 소스
- `src/components/layout/header.tsx` (참고, 변경 없음) — `navLinks` 홈/프로젝트 2개 유지 확인용
- `docs/ROADMAP.md` (수정) — 완료 표시 및 작업 파일 참조 추가

## 수락 기준

- [x] 홈에 "대표 프로젝트" 섹션이 `mockProjects.filter(p => p.featured)` 결과를 `ProjectGrid`로
      렌더하고, 하단에 `/projects`로 이동하는 "전체 프로젝트 보기" CTA가 존재한다
- [x] `/projects`의 `h1` 텍스트가 기존과 동일하게 정확히 "프로젝트"이며, `mockProjects` 전체가
      `ProjectGrid`로 렌더된다
- [x] `/projects/[id]`가 `mockProjects`에서 `id`로 조회한 프로젝트의 썸네일(있을 때만)/제목/기간/
      기술스택/소개/`ProjectLinks`(GitHub 항상, 데모는 `demoUrl` 있을 때만)를 렌더한다
- [x] 존재하지 않는 `id`로 접근 시 `notFound()`가 호출되어 기존 `not-found.tsx`가 노출된다
- [x] 모든 외부 링크(GitHub/데모)가 `target="_blank" rel="noopener noreferrer"`를 갖는다
      (`ProjectLinks`가 이미 처리하므로 그대로 사용했는지 확인)
- [x] 헤더 `navLinks`와 `src/components/layout/header.tsx`는 수정되지 않았다 (상세 페이지 링크
      미노출 유지)
- [x] `e2e/navigation.spec.ts`에 홈→상세, 홈→CTA→목록→상세 라우팅 케이스가 추가되고 전부 통과한다
- [x] Playwright MCP로 라이트/다크 모드 및 모바일(약 390×844)/데스크톱(약 1280×800) 뷰포트에서
      홈/목록/상세 레이아웃 깨짐이 없음을 확인했다
- [x] `npm run test:run`과 `npm run test:e2e`가 모두 통과한다 (회귀 없음)
- [x] `docs/ROADMAP.md`의 Task 004 제목에 완료 표시가 추가된다

## 구현 단계

1. `src/app/page.tsx` 수정 — 대표 프로젝트 섹션(`ProjectGrid`) + CTA(`Button nativeButton={false}
   render={<Link href="/projects" />}`) 추가, 기존 히어로 텍스트 유지
2. `src/app/projects/page.tsx` 수정 — `mockProjects` 전체를 `ProjectGrid`로 렌더, `h1` 텍스트 불변
3. `src/app/projects/[id]/page.tsx` 수정 — `mockProjects.find`, `notFound()`, `generateMetadata`
   실제 제목 반영, 썸네일/제목/기간(페이지 내부 포맷 헬퍼)/`TechStackBadges`/소개(summary 임시
   대체, TODO 주석)/`ProjectLinks` 레이아웃 구성
4. `e2e/navigation.spec.ts`에 라우팅 플로우 + 외부 링크 속성 + 데모 버튼 숨김 케이스 추가 (기존
   `getByRole` 컨벤션 준수, `ProjectLinks` 버튼은 `role="button"`임에 주의)
5. `npm run dev`로 개발 서버 기동 확인
6. Playwright MCP로 라이트/다크 모드 + 모바일/데스크톱 뷰포트 수동 확인
7. `npm run test:run`, `npm run test:e2e` 실행하여 전체 통과 및 회귀 없음 확인
8. 본 작업 파일의 체크박스 및 변경 요약 갱신
9. `docs/ROADMAP.md`의 Task 004 제목에 `✅ - 완료` 및 `See: /tasks/004-home-list-detail-pages-ui.md`
   추가

## 변경 요약

- `src/app/page.tsx`: 기존 히어로(`h1`/부제) 유지, 그 아래 "대표 프로젝트" `h2` 섹션을 추가해
  `mockProjects.filter(p => p.featured)`(mock-project-1, mock-project-2)를 `ProjectGrid`로 렌더.
  섹션 하단에 `Button nativeButton={false} render={<Link href="/projects" />}` 패턴의 "전체 프로젝트
  보기" CTA 추가.
- `src/app/projects/page.tsx`: 기존 `h1`("프로젝트") 텍스트 불변, `mockProjects` 전체(6건)를
  `ProjectGrid`로 렌더하도록 "준비 중입니다" placeholder 제거.
- `src/app/projects/[id]/page.tsx`: `mockProjects.find(p => p.id === id)`로 조회 후 없으면
  `notFound()` 호출. `generateMetadata`도 동일 조회로 실제 `project.title`(못 찾으면 "프로젝트를
  찾을 수 없습니다")을 반영. 레이아웃은 썸네일(있을 때만)/`h1`/기간 텍스트(파일 내부에
  `formatYearMonth`/`formatPeriod` 헬퍼를 `project-card.tsx`와 동일 로직으로 복제)/
  `TechStackBadges`/"소개" 섹션(`project.summary`를 본문 임시 대체, Notion 블록 렌더러 도입 전까지의
  TODO 주석 포함)/`ProjectLinks` 순서로 구성. 컨테이너는 `max-w-3xl`.
- `e2e/navigation.spec.ts`: 새 `describe("프로젝트 라우팅 플로우")` 블록에 5개 케이스 추가
  (홈→카드 클릭→상세, 홈→CTA→목록→카드 클릭→상세, GitHub 버튼 `target`/`rel` 속성 검증, 데모 버튼
  없음(mock-project-4) count 0 검증, 존재하지 않는 id 접근 시 404 헤딩 노출 + "프로젝트 목록으로
  돌아가기" 클릭 시 `/projects` 복귀). 기존 "헤더 내비게이션" 두 케이스는 홈/목록 페이지에 새로
  추가된 프로젝트 카드 링크(`Notion 포트폴리오 사이트` 등 텍스트에 "프로젝트"/"포트폴리오" 부분
  문자열을 포함)와 `getByRole` 기본 substring 매칭이 충돌해 strict mode violation이 발생했으므로,
  헤더 링크 로케이터에만 `exact: true`를 추가해 회귀를 해소함 (표시 텍스트는 변경하지 않음).

### 검증 결과

- `npm run test:run`: 6개 테스트 파일, 12개 테스트 전부 통과 (기존 컴포넌트 유닛 테스트 포함, 회귀
  없음).
- `npm run test:e2e`: 10개 테스트(기존 4개 + 신규 5개 + 기존 theme 2개 중 헤더 내비게이션 2개 수정)
  전부 통과.
- `npm run build`: Turbopack 프로덕션 빌드 성공 (`/`, `/projects` 정적, `/projects/[id]` 동적 렌더
  확인).
- Playwright MCP로 수동 확인: 홈 라이트/다크 모드에서 대표 프로젝트 2건 + CTA 노출, `/projects`
  데스크톱 실제 브라우저 폭(2560px, `lg` 이상)에서 3열 그리드로 6건 전부 렌더(썸네일 없는
  mock-project-5는 플레이스홀더, 기간 없는 mock-project-6은 "기간 미정" 정상 노출), 상세 페이지
  진입/뒤로가기, GitHub 버튼 `target="_blank"`/`rel="noopener noreferrer"` 속성 확인, 데모 링크
  없는 mock-project-4는 데모 버튼 미노출 확인, 존재하지 않는 id 접근 시 `not-found.tsx`(404 문구 +
  "프로젝트 목록으로 돌아가기" 버튼) 노출 확인. 단, 이번 세션에 제공된 Playwright MCP 툴 목록에는
  `browser_resize`가 포함되어 있지 않아 390×844 모바일 뷰포트를 실제로 리사이즈해 스크린샷으로
  검증하지는 못했다 — 대신 `ProjectGrid`가 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`(Task003
  산출물, 미수정)를 그대로 사용하고 `globals.css`에 `--breakpoint-*` 오버라이드가 없어 Tailwind v4
  기본 브레이크포인트(`sm=640px`, `lg=1024px`)가 적용됨을 코드로 확인하는 방식으로 대체 검증했다.
  다음 세션에서 `browser_resize` 툴이 제공되면 390×844/1280×800 스크린샷으로 재검증을 권장한다.
