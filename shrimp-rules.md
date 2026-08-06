# Development Guidelines

## 프로젝트 개요

- Notion Database에 정리된 프로젝트 정보를 웹 포트폴리오로 노출하는 사이트. 상세 요구사항은 `docs/PRD.md`, 작업 계획/진행상황은 `docs/ROADMAP.md`.
- 스택: Next.js 16(App Router, Turbopack) / React 19 / TypeScript 5 / TailwindCSS v4(CSS-first, config 파일 없음) / shadcn/ui(`base-nova` 스타일, Base UI 프리미티브) / Lucide React / next-themes / `@notionhq/client`(미설치) / Vercel / npm.
- 현재 저장소 상태: `src/app/page.tsx`, `src/app/projects/page.tsx`는 정적 placeholder. 상세 라우트, Notion 연동 코드, 도메인 타입 모두 미구현(Phase 1 착수 전).

## 필수 참조 문서 (다중 파일 동기화 규칙)

- **`docs/PRD.md`를 수정하면** 데이터 모델/기능 변경이 `docs/ROADMAP.md`의 "현재 저장소 기준선"·"MVP 범위 제외" 절과 어긋나지 않는지 함께 확인한다.
- **작업을 시작하기 전** 반드시 `docs/ROADMAP.md`의 "개발 워크플로우"·"개발 단계" 절을 확인해 어느 Task(001~012)에 해당하는지 파악한다. Task Master AI(`.taskmaster/`)는 이 프로젝트의 1차 작업 관리 도구가 아니며, 실제 작업 계획/진행은 `docs/ROADMAP.md` + `/tasks/XXX-description.md` 체계를 따른다.
- **Task를 완료하면** 다음을 모두 수행한다: (1) 해당 `/tasks/XXX-description.md` 파일의 체크박스를 체크하고 변경 요약을 추가, (2) `docs/ROADMAP.md`의 해당 Task 제목에 `✅ - 완료`와 `See: /tasks/XXX-description.md` 참조 추가, (3) 해당 Phase의 모든 Task가 끝났으면 Phase 제목에도 완료 표시.
- **`src/app/layout.tsx`의 provider 트리(`ThemeProvider` > `TooltipProvider` 등)를 수정하면** `src/test/utils.tsx`의 `AllProviders`도 동일하게 갱신한다 (파일 상단 주석에 이미 명시된 규칙).
- **Notion DB에 필드를 추가/변경하면** `docs/PRD.md`의 데이터 모델 표, `src/types/project.ts`(Task 002 이후 존재), Notion 속성명 매핑 상수를 함께 갱신한다.
- **새 환경변수를 추가하면** `src/env.ts`의 zod 스키마와 `.env.example`(발급 방법 주석 포함)을 함께 갱신한다. 예: `NOTION_API_KEY`, `NOTION_DATABASE_ID`는 `server` 스키마에 추가(공개 노출 금지, `NEXT_PUBLIC_` 접두사 사용 금지).

## Next.js 버전 관련 필수 확인 사항

- **이 저장소의 Next.js 16은 학습 데이터 기준 Next.js와 API/컨벤션이 다를 수 있다.** Next.js API(동적 세그먼트 `params`, `generateMetadata`, `generateStaticParams`, 캐시/재검증 등)를 사용하기 전, 반드시 `node_modules/next/dist/docs/`에서 관련 문서를 확인한다. 추측으로 구현하지 않는다.
- 상세 페이지 동적 세그먼트는 반드시 `src/app/projects/[id]/page.tsx`로 만든다 (식별자가 Notion Page ID이므로 `[slug]` 사용 금지).

## 라우팅 · 페이지 구조 규칙

- 페이지는 3개만 존재: 홈(`src/app/page.tsx`), 프로젝트 목록(`src/app/projects/page.tsx`), 프로젝트 상세(`src/app/projects/[id]/page.tsx`). 프로젝트 상세는 헤더 메뉴에 노출하지 않는다 — 카드 클릭을 통해서만 진입 가능해야 한다.
- 헤더 네비게이션(`src/components/layout/header.tsx`)의 `navLinks`는 홈/프로젝트 2개로 고정한다. PRD MVP 범위 외 메뉴(About, Contact, 블로그 등)를 추가하지 않는다.
- PRD "MVP 이후 기능"으로 명시된 다음 기능은 별도 요청 없이 구현하지 않는다: 블로그/노트 페이지, 카테고리/태그 필터링·검색, About 전용 페이지, 로그인/관리자 기능, 다국어 지원, Contact 페이지.

## UI 컴포넌트 규칙

- shadcn/ui 컴포넌트가 필요하면 직접 프리미티브를 작성하지 말고 `npx shadcn add <컴포넌트>`로 추가한다 (스타일 `base-nova`, Base UI 기반, `components.json` 설정 준수). 이미 설치된 컴포넌트: avatar, badge, button, card, dialog, dropdown-menu, form, input, label, separator, sheet, sonner, textarea, tooltip.
- import alias는 `components.json`에 정의된 대로 사용한다: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- TailwindCSS v4는 CSS-first이므로 `tailwind.config.{js,ts}` 파일을 새로 만들지 않는다. 테마/토큰 설정은 `src/app/globals.css`에서 한다.
- 사용자에게 노출되는 텍스트(제목, 버튼, 안내 문구 등)는 기존 코드(`header.tsx`, `page.tsx`)와 동일하게 한국어로 작성한다.

## 테스트 규칙

- 테스트 레벨 판단은 `AGENTS.md`의 기준(Route Handler/Server Action/proxy/순수 로직 → 유닛 node, 클라이언트 컴포넌트·sync Server Component → 유닛 jsdom, async Server Component·라우팅 플로우·캐시·테마 지속성 → E2E)을 그대로 따른다.
- 파일 확장자가 실행 환경을 결정한다(`vitest.config.mts`): `*.test.ts` → node 프로젝트(`src/**/*.test.ts`, `app/**/*.test.ts`, `proxy.test.ts`), `*.test.tsx` → jsdom 프로젝트(`src/**/*.test.tsx`). E2E는 `e2e/*.spec.ts`(Playwright 전용, vitest에서 제외됨).
- 컴포넌트 테스트에서는 `@testing-library/react`를 직접 import하지 않고 반드시 `@/test/utils`의 `render`(provider 래핑 버전)를 사용한다.
- Notion API 연동·정렬·대표 프로젝트 선별 등 비즈니스 로직 작업 시 작업 파일(`/tasks/XXX-*.md`)에 "## 테스트 체크리스트" 섹션을 포함하고 Playwright MCP 테스트 시나리오를 작성한다.
- 테스트 작성·실행·실패 진단이 필요하면 `test-engineer` 서브에이전트에 위임할 수 있다.
- 기능 구현 완료 후 `npm run test:run`과 `npm run test:e2e` 통과를 확인한다.

## 데이터 계약 규칙 (Notion 연동, Task 002 이후 적용)

- Notion DB 속성명(제목/요약/기술스택/GitHub 링크/데모 링크/썸네일/기간/대표)은 하드코딩된 문자열로 여러 곳에 흩어놓지 말고, 단일 매핑 상수 모듈에서 관리한다.
- `Project`, `ProjectSummary`, `ProjectDetail`, `ProjectPeriod` 등 도메인 타입은 `src/types/project.ts`에 정의한다.
- Notion 응답 필드 누락/타입 불일치에 대한 방어 처리를 데이터 액세스 계층(`src/lib/notion/`)에서 수행하고, UI 컴포넌트에서 직접 Notion 원시 응답을 다루지 않는다.

## 커밋 규칙

- 커밋 메시지는 한국어로 작성한다.
- `.claude/commands/commit.md`에 정의된 이모지 + 컨벤셔널 커밋 포맷(`<이모지> <타입>: <설명>`)을 따른다. 예: `✨ feat: 프로젝트 상세 페이지 라우트 추가`, `✅ test: 정렬 로직 유닛 테스트 추가`.
- 커밋에 Claude 서명을 추가하지 않는다(이미 `.claude/commands/commit.md`에 명시).

## 금지 사항

- **금지**: `src/app/projects/[slug]/page.tsx`처럼 `[slug]` 세그먼트를 사용하는 것. 식별자는 항상 Notion Page ID(`[id]`)를 쓴다.
- **금지**: Next.js 16 API를 `node_modules/next/dist/docs/` 확인 없이 학습 데이터 기억만으로 구현하는 것.
- **금지**: shadcn/ui로 이미 제공되는 컴포넌트를 CLI 없이 손으로 재작성하는 것.
- **금지**: `tailwind.config.js`/`.ts` 파일을 새로 생성하는 것 (TailwindCSS v4 CSS-first 구조 위반).
- **금지**: 컴포넌트 테스트에서 `@testing-library/react`의 `render`를 직접 import하는 것 (`@/test/utils`의 `render`를 사용해야 함).
- **금지**: PRD "MVP 이후 기능"에 명시된 기능(블로그, 태그 필터/검색, About 페이지, 로그인/관리자, 다국어, Contact 페이지)을 별도 요청 없이 구현하는 것.
- **금지**: Notion API 키(`NOTION_API_KEY`)를 `client` 환경변수 스키마나 `NEXT_PUBLIC_` 접두사로 노출하는 것.
- **금지**: Task 완료 후 `docs/ROADMAP.md`와 `/tasks/XXX-*.md` 갱신을 생략하는 것.

## AI 의사결정 기준

- Notion 연동/비즈니스 로직 작업과 순수 UI 작업이 모호하게 섞여 있으면, 먼저 UI를 더미 데이터(`src/lib/mock/projects.ts`, Phase 2)로 완성하고 이후 Phase 3에서 실제 연동으로 교체하는 로드맵 순서를 따른다 (임의로 순서를 바꾸지 않는다).
- 어떤 shadcn/ui 컴포넌트를 쓸지 애매하면, 먼저 `components.json`에 이미 설치된 목록에서 재사용 가능한지 확인한 뒤에만 신규 설치를 고려한다.
- 테스트 레벨이 애매하면(예: 컴포넌트가 async data fetching을 포함하는지 불확실) `AGENTS.md`의 판단 기준표를 우선 적용하고, 그래도 애매하면 E2E로 분류한다(async Server Component 관련 로직은 유닛 테스트로 신뢰성 있게 검증하기 어렵기 때문).
