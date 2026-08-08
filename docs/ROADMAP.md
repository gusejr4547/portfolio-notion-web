# Notion 포트폴리오 사이트 개발 로드맵

Notion에 정리해 둔 프로젝트 정보를 별도 관리 화면 없이 웹 포트폴리오로 노출한다.

## 개요

portfolio-notion-web은 채용담당자, 잠재 클라이언트 등 프로젝트를 살펴보러 오는 방문자를 위한 프로젝트 소개형 포트폴리오 사이트로 다음 기능을 제공합니다:

- **F001 프로젝트 목록 조회**: Notion Database의 프로젝트를 기간(시작일) 기준 최신순 카드 그리드로 표시 (홈, 프로젝트 목록)
- **F002 프로젝트 상세 조회**: 설명(Notion 본문), 기술스택, GitHub/데모 링크, 썸네일, 기간을 상세 페이지에 표시 (프로젝트 상세)
- **F003 대표 프로젝트 하이라이트**: 홈에 `대표`(checkbox) 프로젝트만 선별 노출, 없으면 기간 최신순으로 대체 노출 (홈)

### 기술 스택

Next.js 16(App Router, Turbopack) / React 19 / TypeScript 5 / TailwindCSS v4(CSS-first) / shadcn-ui(base-nova, Base UI) / Lucide React / next-themes / `@notionhq/client` / Vercel / npm

### 사용자 여정

홈(대표 프로젝트) → 프로젝트 목록 → 프로젝트 상세 → GitHub/데모 외부 링크(새 탭)

### MVP 범위 제외

아래 항목은 이번 로드맵의 범위가 아니며, 별도 요청 시 새로운 Phase로 추가한다.

- 블로그/노트 페이지
- 프로젝트 카테고리/태그 필터링 및 검색
- 소개(About) 전용 페이지
- 로그인/관리자 기능 (콘텐츠 수정은 Notion에서 직접 수행)
- 다국어 지원
- Contact/문의 페이지

### 현재 저장소 기준선

- 라우트: `src/app/page.tsx`(정적 히어로 문구), `src/app/projects/page.tsx`("준비 중입니다"), 상세 라우트 없음
- 헤더 네비게이션(`src/components/layout/header.tsx`)은 이미 홈/프로젝트 2개 링크로 PRD 메뉴 구조와 일치
- Notion 연동 코드 전무: `@notionhq/client` 미설치, `src/lib/notion*` 없음, `src/env.ts`에 Notion 환경변수 없음
- shadcn-ui 기설치: avatar, badge, button, card, dialog, dropdown-menu, form, input, label, separator, sheet, sonner, textarea, tooltip
- 테스트 인프라 완비(`vitest.config.mts`, `src/test/utils.tsx`, `playwright.config.ts`), 기능 테스트는 전무
- F001~F003 관련 구현은 전부 착수 전

## 개발 워크플로우

1. **작업 계획**

- 기존 코드베이스를 학습하고 현재 상태를 파악
- 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
- 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 생성**

- `/tasks` 디렉토리에 새 작업 파일 생성 (명명 형식: `XXX-description.md`, 예: `001-detail-route-skeleton.md`)
- 고수준 명세서, 관련 파일, 수락 기준, 구현 단계 포함
- Notion API 연동 및 비즈니스 로직 작업은 "## 테스트 체크리스트" 섹션을 필수로 포함하고 Playwright MCP 테스트 시나리오를 작성
- 직전 완료 작업 2개를 예시로 참조 (현재 작업이 `007`이면 `006`, `005` 참조)
- 완료된 작업 파일은 체크된 박스와 변경 사항 요약을 포함하므로, 새 작업 파일은 빈 박스와 요약 없는 초기 상태로 작성

3. **작업 구현**

- 작업 파일의 명세서를 따라 기능 구현
- Notion API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 실제 화면 동작을 확인
- 각 단계 후 작업 파일 내 진행 상황 업데이트
- 구현 완료 후 `npm run test:run`, `npm run test:e2e` 통과 확인
- 각 단계 완료 후 중단하고 추가 지시를 기다림

4. **로드맵 업데이트**

- 완료된 Task 제목에 `✅ - 완료`와 `See: /tasks/XXX-description.md` 참조를 추가
- Phase의 모든 Task가 끝나면 Phase 제목에 완료 표시를 추가

## 테스트 전략

AGENTS.md의 레벨 판단 기준을 그대로 따른다.

| 대상 | 레벨 | 파일 규칙 |
| --- | --- | --- |
| Notion 응답 매핑, 정렬, 대표 프로젝트 선별 등 순수 로직 | 유닛(node) | `*.test.ts` |
| ProjectCard, 기술스택 뱃지, Notion 블록 렌더러 등 sync 컴포넌트 | 유닛(jsdom) | `*.test.tsx` |
| async Server Component(홈/목록/상세 데이터 페칭), 라우팅 플로우, 테마 지속성 | E2E | `e2e/*.spec.ts` |

- 실행: `npm run test` (watch) / `npm run test:run` / `npm run test:coverage` / `npm run test:e2e` / `npm run test:e2e:ui`
- 컴포넌트 테스트는 `src/test/utils.tsx`의 provider 포함 `render`를 재사용한다 (RTL 기본 `render`를 새로 import하지 않는다)
- Phase 2에서 만든 더미 프로젝트 픽스처를 Phase 3 유닛 테스트 픽스처로 재사용해 중복을 없앤다
- 테스트 작성/실행/실패 진단은 `.claude/agents/test-engineer.md` 서브에이전트에 위임할 수 있다

## 개발 단계

### Phase 1: 애플리케이션 골격 및 데이터 계약 구축

- **Task 001: 프로젝트 상세 라우트 및 페이지 골격 생성** ✅ - 완료 (See: /tasks/001-detail-route-skeleton.md)
  - `src/app/projects/[id]/page.tsx` 빈 껍데기 생성 (식별자는 Notion Page ID이므로 `[slug]`가 아닌 `[id]` 사용. 대괄호는 Next.js 동적 세그먼트 폴더명 문법이며 실제 URL에는 포함되지 않고, 해당 위치에 Notion Page ID 값이 그대로 들어감)
  - Next.js 16의 동적 세그먼트 `params` 규약을 `node_modules/next/dist/docs/`에서 확인 후 적용
  - 상세 세그먼트용 `loading.tsx`, `not-found.tsx` 배치
  - `generateMetadata` 시그니처 골격 정의 (내용 채우기는 Task 009)
  - 홈/목록/상세 3개 라우트가 모두 정상 응답하는지 확인

- **Task 002: 도메인 타입 정의 및 Notion 데이터 계약 설계** ✅ - 완료 (See: /tasks/002-domain-types-notion-contract.md)
  - `src/types/project.ts`에 `Project`, `ProjectSummary`, `ProjectDetail`, `ProjectPeriod` 타입 정의
  - Notion DB 속성명 매핑 상수 정의 (제목/요약/기술스택/GitHub 링크/데모 링크/썸네일/기간/대표)
  - `src/env.ts` 서버 스키마에 `NOTION_API_KEY`, `NOTION_DATABASE_ID` 추가 (t3-oss env + zod)
  - `.env.example`에 Notion 환경변수 항목 및 발급 방법 주석 추가
  - 블록 렌더러가 지원할 Notion 블록 타입 유니온 정의 (렌더링 구현은 Task 005)

### Phase 2: UI/UX 완성 (더미 데이터 활용) ✅ - 완료

- **Task 003: 프로젝트 공통 컴포넌트 및 더미 데이터 구축** ✅ - 완료 (See: /tasks/003-project-common-components-mock-data.md)
  - `src/lib/mock/projects.ts`에 더미 프로젝트 픽스처 작성 (대표 있음/없음, 데모 링크 없음, 썸네일 없음, 기간 미입력 등 엣지 케이스 포함)
  - `ProjectCard`(썸네일/제목/요약/기간/기술스택), `ProjectGrid`, `TechStackBadges`, `ProjectLinks`, `EmptyState` 구현
  - 기설치된 shadcn card/badge/button 재사용, 썸네일 부재 시 플레이스홀더 처리
  - 컴포넌트 유닛 테스트 `*.test.tsx` 작성 (jsdom, `src/test/utils.tsx`의 render 사용)

- **Task 004: 홈/목록/상세 페이지 UI 완성 (더미 데이터)** ✅ - 완료 (See: /tasks/004-home-list-detail-pages-ui.md)
  - 홈: 히어로 문구 + 대표 프로젝트 섹션 + "전체 프로젝트 보기" CTA
  - 프로젝트 목록: 반응형 카드 그리드 (모바일 1 / 태블릿 2 / 데스크톱 3 컬럼)
  - 프로젝트 상세: 썸네일, 제목, 기간, 기술스택, 본문 영역, GitHub/데모 버튼 (데모 링크 없으면 버튼 숨김, 새 탭 + `rel="noopener noreferrer"`)
  - 라이트/다크 모드와 모바일 뷰포트에서 레이아웃 검증
  - `e2e/navigation.spec.ts` 확장: 홈 → 목록 → 상세 라우팅 플로우

- **Task 005: Notion 블록 렌더러 컴포넌트 구현** ✅ - 완료 (See: /tasks/005-notion-block-renderer.md)
  - 지원 블록: paragraph, heading_1~3, bulleted/numbered list, code, image, quote, divider, callout, bookmark
  - rich text 어노테이션 처리 (bold, italic, code, strikethrough, link)
  - 미지원 블록은 렌더링을 중단하지 않고 안전하게 무시하는 fallback 처리
  - 본문 타이포그래피 스타일 정의 (`globals.css` 또는 유틸리티 클래스)
  - 블록 픽스처 기반 유닛 테스트 `*.test.tsx` 작성

### Phase 3: Notion 연동 및 핵심 기능 구현

- **Task 006: Notion API 클라이언트 및 데이터 액세스 계층 구축** ✅ - 완료 (See: /tasks/006-notion-client-data-access.md)
  - `@notionhq/client` 설치 후 `src/lib/notion/client.ts`에 싱글턴 클라이언트 구성
  - `getProjects()`, `getProjectById(id)`, `getProjectBlocks(id)` 구현 (커서 페이지네이션으로 100건 초과 대응)
  - `mapPageToProject()` 매핑 함수 구현 및 필드 누락/타입 불일치 방어 처리
  - 에러 핸들링 정의 (권한 오류, 레이트리밋, 네트워크 실패)와 캐시 재검증 전략 확정
  - Notion 응답 픽스처 기반 유닛 테스트 `*.test.ts` 작성 (node, SDK 모킹)

- **Task 007: F001 프로젝트 목록 조회 연동**
  - `src/app/projects/page.tsx`를 async Server Component로 전환하고 더미 데이터를 실제 조회로 교체
  - 기간(시작일) 기준 최신순 정렬 로직을 순수 함수로 분리 (시작일 미입력 항목 처리 규칙 포함)
  - 정렬 함수 유닛 테스트 `*.test.ts` 작성 (node)
  - 프로젝트 0건 및 조회 실패 상태 UI 처리
  - Playwright MCP로 목록 렌더링과 카드 클릭 이동을 확인하고 E2E 스펙에 반영

- **Task 008: F003 홈 대표 프로젝트 하이라이트 연동**
  - `대표`(checkbox) 필터링과 미체크 시 기간 최신순 대체 노출 fallback 구현
  - 선별 로직을 순수 함수로 분리하고 유닛 테스트 `*.test.ts` 작성 (대표 전부/일부/없음 케이스)
  - 홈의 "전체 프로젝트 보기" CTA를 프로젝트 목록 페이지에 연결
  - Playwright MCP로 대표 프로젝트 노출과 카드 클릭 → 상세 이동을 확인하고 E2E 스펙에 반영

- **Task 009: F002 프로젝트 상세 조회 연동**
  - `generateStaticParams`로 상세 경로 생성, 상세 데이터와 본문 블록을 실제 조회로 교체
  - 존재하지 않거나 접근 불가한 id는 `notFound()`로 처리
  - `generateMetadata`에서 제목/요약/썸네일 기반 메타데이터 및 OG 태그 생성
  - Notion 썸네일 도메인을 `next.config.ts`의 `remotePatterns`에 등록 (files & media의 서명 URL 만료 대응 포함)
  - Playwright MCP로 상세 정보 노출, 데모 링크 없는 프로젝트의 버튼 숨김, 외부 링크 새 탭 동작을 확인하고 E2E 스펙에 반영

- **Task 010: 핵심 사용자 플로우 통합 테스트**
  - 전체 여정 E2E 작성: 홈 → 상세, 홈 → 목록 → 상세 → 외부 링크
  - 엣지 케이스 검증: 프로젝트 0건, 썸네일 없음, 잘못된 id(404), Notion 오류 응답
  - 모바일 뷰포트와 다크모드 조합 회귀 검증
  - `npm run test:run`과 `npm run test:e2e` 전체 통과 확인

### Phase 4: 최적화 및 배포

- **Task 011: 성능, SEO, 접근성 최적화**
  - ISR revalidate 주기 설정 및 라우트별 캐시 전략 확정 (썸네일 서명 URL 만료 주기 고려)
  - `next/image` 최적화 적용 (sizes, priority, blur placeholder)와 번들 크기 점검
  - `sitemap.ts`, `robots.ts`, 기본 OG 이미지 구성
  - 시맨틱 마크업, 키보드 포커스 순서, 이미지 alt 점검 및 Lighthouse 기준치 확인

- **Task 012: Vercel 배포 및 운영 구성**
  - Vercel 프로젝트 연결 및 `NOTION_API_KEY`, `NOTION_DATABASE_ID`, `NEXT_PUBLIC_APP_URL` 환경변수 설정
  - Notion Integration에 대상 Database 공유 권한이 부여되었는지 확인
  - 프로덕션 스모크 테스트 (홈/목록/상세 3개 페이지와 외부 링크)
  - 콘텐츠 갱신 반영 수단 정리 (Revalidate Route Handler 또는 주기적 ISR)
  - README와 로컬 실행/환경변수 문서 갱신
