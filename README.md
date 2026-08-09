# 포트폴리오 (Notion 연동)

Notion에 정리해 둔 프로젝트 정보를 웹에서 프로젝트 소개형 포트폴리오로 보여주는 사이트입니다.

## 🎯 프로젝트 개요

**목적**: Notion에 정리해 둔 프로젝트 정보를 웹에서 프로젝트 소개형 포트폴리오로 보여준다
**사용자**: 포트폴리오를 열람하는 방문자(채용담당자, 잠재 클라이언트 등)

상세 요구사항은 [docs/PRD.md](./docs/PRD.md), 개발 진행 상황은 [docs/ROADMAP.md](./docs/ROADMAP.md)를 참고하세요.

## 📱 주요 페이지

1. **홈** (`/`) — 대표(Featured) 프로젝트 하이라이트, 없으면 최신순 대체 노출
2. **프로젝트 목록** (`/projects`) — Notion Database 기반 프로젝트 카드 그리드 (기간 최신순)
3. **프로젝트 상세** (`/projects/[id]`) — 설명(Notion 본문)/기술스택/GitHub·데모 링크/기간

## 🛠️ 기술 스택

- [Next.js 16](https://nextjs.org) (App Router, Turbopack 기본)
- TypeScript / React 19
- Tailwind CSS v4 (CSS-first 설정)
- [shadcn/ui](https://ui.shadcn.com) — `base-nova` 스타일, [Base UI](https://base-ui.com) 프리미티브 기반
- [next-themes](https://github.com/pacocoursey/next-themes) — 다크모드
- [lucide-react](https://lucide.dev) — 아이콘
- Notion 공식 API (`@notionhq/client`) — 프로젝트 목록/상세/본문 블록 연동
- [`@t3-oss/env-nextjs`](https://env.t3.gg) + Zod — 환경변수 검증

> ⚠️ 이 프로젝트는 표준 Next.js와 다른 부분(Turbopack 기본, 비동기 API 전면화, `middleware` → `proxy`, `next lint` 제거 등)이 있는 최신 Next.js 16입니다. 새 기능을 추가하기 전에 `AGENTS.md`와 `node_modules/next/dist/docs/`를 참고하세요.

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`에 `NOTION_API_KEY`, `NOTION_DATABASE_ID` 값을 채워야 합니다. 발급 절차는 `.env.example`의 주석을 참고하세요 (Notion Integration 생성 → Internal Integration Secret 발급 → 대상 Database에 Connect).

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다. 개발 서버와 빌드는 기본적으로 Turbopack을 사용합니다.

## 폴더 구조

| 경로                     | 설명                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `src/app`                | App Router 페이지/레이아웃 (홈, `projects`, `projects/[id]`, `robots.ts`, OG 이미지 등)     |
| `src/components/ui`      | shadcn CLI로 관리되는 프리미티브 컴포넌트 (직접 스타일을 고치기보다 CLI로 재설치/업데이트) |
| `src/components/layout`  | `Header`, `Footer` 등 레이아웃 컴포넌트                                                    |
| `src/components/project` | `ProjectCard`, `ProjectGrid`, `TechStackBadges`, `ProjectLinks` 등 프로젝트 도메인 컴포넌트 |
| `src/components/notion`  | Notion 본문 블록 렌더러(paragraph/heading/list/code/image/quote/callout 등)                |
| `src/components` (루트)  | `ThemeProvider`, `ModeToggle` 등 앱 전역 컴포넌트                                          |
| `src/lib/notion`         | Notion API 클라이언트, 페이지 → 도메인 모델 매핑, 데이터 조회 함수, 에러 처리              |
| `src/lib`                | 정렬(`sort-projects`), 대표 프로젝트 선별(`select-featured-projects`), 기간 포맷 등 순수 로직 |
| `src/types`               | `Project` 등 도메인 타입 정의                                                              |
| `src/hooks`              | 커스텀 훅 (필요 시 shadcn 컴포넌트가 자동 생성)                                            |

## 다크모드

`next-themes`로 라이트 / 다크 / 시스템 3단 테마를 지원합니다. `globals.css`의 `.dark` 클래스 기반 테마 변수를 그대로 사용하며, `src/components/theme-provider.tsx`가 앱 전체를 감싸고 우측 상단 `ModeToggle`(`src/components/mode-toggle.tsx`)로 전환합니다.

## shadcn 컴포넌트 추가하기

```bash
npx shadcn add <component-name>
```

`components.json`의 `style: "base-nova"` 설정을 그대로 사용해 기존 컴포넌트와 일관된 스타일로 생성됩니다. 만약 특정 컴포넌트가 `base-nova` 레지스트리에 없어 CLI가 실패하면, `src/components/ui/button.tsx`의 패턴(`@base-ui/react/<primitive>` + `cva` + `cn` + `data-slot`)을 참고해 직접 작성하세요.

## 테스트

| 명령어                  | 설명                                              |
| ------------------------ | ------------------------------------------------- |
| `npm run test`           | Vitest watch 모드                                 |
| `npm run test:run`       | Vitest 전체 1회 실행                              |
| `npm run test:coverage`  | 커버리지 리포트 포함 실행                          |
| `npm run test:e2e`       | Playwright E2E 실행 (`e2e/*.spec.ts`)             |
| `npm run test:e2e:ui`    | Playwright UI 모드                                |

- `*.test.ts` → node 환경, `*.test.tsx` → jsdom 환경 (`vitest.config.mts`가 확장자로 자동 분기)
- Notion 매핑/정렬/대표 선별 등 순수 로직은 유닛(node), 클라이언트 컴포넌트와 sync 컴포넌트는 유닛(jsdom), async Server Component·라우팅·테마 지속성은 E2E(`e2e/navigation.spec.ts`, `e2e/project-journey.spec.ts`, `e2e/theme.spec.ts`)로 검증합니다.
- 자세한 레벨 판단 기준은 `AGENTS.md` 참고.

## 스크립트

| 명령어          | 설명                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `npm run dev`   | 개발 서버 실행 (Turbopack)                                             |
| `npm run build` | 프로덕션 빌드                                                          |
| `npm run start` | 프로덕션 서버 실행                                                     |
| `npm run lint`  | ESLint 실행 (`next lint`는 Next.js 16에서 제거되어 bare `eslint` 사용) |

## 🚀 배포 (Vercel)

1. [Vercel New Project](https://vercel.com/new)에서 GitHub 저장소(`gusejr4547/portfolio-notion-web`)를 Import합니다.
2. 프로젝트 Settings → Environment Variables에서 아래 3개를 Production 환경에 입력합니다.
   - `NOTION_API_KEY` — Notion Integration의 Internal Integration Secret
   - `NOTION_DATABASE_ID` — 대상 Database ID
   - `NEXT_PUBLIC_APP_URL` — 배포된 프로덕션 도메인 (예: `https://your-project.vercel.app`)
3. Notion 워크스페이스에서 대상 Database 우측 상단 "..." → Connections에 위 Integration이 Connect되어 있는지 확인합니다 (발급 절차는 `.env.example` 주석 참고).
4. Deploy를 클릭하고 빌드 로그를 확인합니다. 완료되면 발급된 프로덕션 URL로 접속해 정상 동작을 확인합니다.

### 콘텐츠 갱신 정책

Notion에서 프로젝트 정보를 수정하면 ISR `revalidate=600`(10분) 설정에 따라 최대 10분 내에 자동으로 반영됩니다. 이 주기는 Notion 썸네일 서명 URL(~1시간 후 만료) 대비 넉넉한 안전마진입니다. 즉시 반영이 필요하면 별도 Route Handler 없이 Vercel 대시보드 → Deployments → Redeploy로 강제 갱신할 수 있습니다.

### 검색 노출 정책

`robots.ts`에서 전체 크롤링을 차단(`Disallow: "/"`)합니다. 포트폴리오 특성상 검색엔진 노출보다 직접 공유(이력서, 링크)를 통한 접근을 의도한 결정이며, `sitemap.ts`도 별도로 생성하지 않습니다.

### 프로덕션 스모크 테스트

배포 후 프로덕션 URL에서 아래 항목을 확인합니다.

- [ ] 홈(`/`) 대표 프로젝트 카드가 노출된다
- [ ] 프로젝트 목록(`/projects`) 카드 그리드가 정상 로드된다
- [ ] 프로젝트 상세(`/projects/[id]`)에서 설명/기술스택/GitHub·데모 링크가 노출된다
- [ ] GitHub/데모 링크가 새 탭(`target="_blank"`)으로 안전하게 열린다
- [ ] 라이트/다크 모드 전환이 정상 동작한다
- [ ] 모바일 뷰포트(390×844)에서 레이아웃이 깨지지 않는다

## 📋 개발 상태

- ✅ 스타터킷 정리 및 포트폴리오 기본 구조(홈/프로젝트 메뉴) 세팅
- ✅ Notion API 연동 및 F001~F003(프로젝트 목록/상세 조회, 대표 프로젝트 하이라이트) 구현
- ✅ 성능/SEO/접근성 최적화
- ⏳ Vercel 배포 및 운영 구성 — 문서/코드 준비 완료, 실제 배포는 계정 접근이 필요해 대기 중

자세한 단계별 진행 상황은 [docs/ROADMAP.md](./docs/ROADMAP.md)를 참고하세요.
