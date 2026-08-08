# Task 009: F002 프로젝트 상세 조회 연동

> 직전 완료 작업: `tasks/008-f003-featured-projects-highlight.md`, `tasks/007-f001-project-list-integration.md`

## 고수준 명세서

Phase 3의 마지막 실데이터 연동 작업으로, `src/app/projects/[id]/page.tsx`를 `mockProjects` 조회에서
Task006이 만든 `getProjectById(id)`/`getProjectBlocks(id)`(`@/lib/notion`) 실호출로 전환해 PRD F002
(프로젝트 상세 조회: 설명/기술스택/GitHub·데모 링크/썸네일/기간)를 실제 Notion 데이터로 구현한다.
본문(소개)은 Task005가 만든 `NotionBlockRenderer`로 렌더링해 기존 `summary` 임시 대체를 제거했다.
`generateStaticParams()`로 전체 상세 경로를 정적 생성하고, `generateMetadata()`는 제목/요약/썸네일 기반
OG 메타데이터를 채운다. `next.config.ts`에는 Notion 파일 호스트용 `images.remotePatterns`를 등록했다.

새 비즈니스 로직을 만드는 작업이 아니라 Task005/006의 기존 산출물을 배선하는 작업이라, Shrimp MCP로
2개 구현 서브태스크(Task009-1, 009-2)와 통합 검증(Task009-3, 현재 작업)으로 나눠 진행했다. 구현 중
Notion API가 UUID 형식이 아닌 id에 대해 `validation_error`(400)를 반환하는데, 기존
`classifyNotionError`(`src/lib/notion/errors.ts`)가 이를 `kind: "unknown"`으로 분류해 `notFound()`가
아니라 루트 에러 페이지로 가는 결함을 발견해 함께 수정했다(`ObjectNotFound`와 동일하게 `not_found`로
분류). Task009-1(페이지/설정 구현)은 `nextjs-developer` 서브에이전트에, Task009-2(E2E 테스트 실데이터
전환 및 Playwright MCP 검증)는 `test-engineer` 서브에이전트에 위임했다.

## 관련 파일

- `src/app/projects/[id]/page.tsx` (수정) — `getProjectById`/`getProjectBlocks` 실호출, `not_found`
  분기, `NotionBlockRenderer` 연동, `generateStaticParams` 추가
- `next.config.ts` (수정) — `images.remotePatterns`에 Notion 파일 S3 호스트 등록
- `src/lib/notion/errors.ts` (수정) — `classifyNotionError`가 `APIErrorCode.ValidationError`도
  `kind: "not_found"`로 분류하도록 수정
- `src/lib/notion/errors.test.ts` (수정) — `ValidationError → not_found` 케이스 유닛 테스트 추가
- `e2e/navigation.spec.ts` (수정) — 상세 페이지 mock id 하드코딩 테스트 2개를 데이터 비의존 방식으로 교체
- `src/lib/notion/index.ts`, `src/components/notion/notion-block-renderer.tsx`,
  `src/components/project/project-links.tsx` (참고, 변경 없음)

## 수락 기준

- [x] `src/app/projects/[id]/page.tsx`가 `getProjectById(id)`/`getProjectBlocks(id)`로 실제 Notion
      데이터를 조회한다
- [x] 존재하지 않거나 접근 불가한 id(`kind: "not_found"`)는 `notFound()`로 처리되고, 그 외 에러(auth/
      network/rate_limited/unknown)는 재throw되어 루트 `error.tsx`로 위임된다
- [x] `generateMetadata`가 실제 조회 데이터의 title/summary/thumbnailUrl로 메타데이터·OG 이미지를 채운다
- [x] `generateStaticParams()`가 `getProjects()`로 전체 프로젝트 id 목록을 반환해 상세 경로가 정적으로
      생성된다
- [x] 본문(소개)이 `NotionBlockRenderer`로 렌더링되어 `summary` 임시 대체 및 TODO 주석이 제거되었다
- [x] `next.config.ts`의 `images.remotePatterns`에 Notion 파일 호스트가 등록되어 있다
- [x] Playwright MCP로 상세 정보 노출, 데모 링크 없는 프로젝트의 버튼 숨김, 외부 링크 새 탭
      (`target=_blank`, `rel=noopener noreferrer`) 동작, 잘못된 id 404를 확인하고 E2E 스펙에 반영했다
- [x] `npm run test:run`, `npm run build`, `npm run test:e2e`가 모두 통과한다
- [x] `docs/ROADMAP.md`의 Task 009 제목에 완료 표시가 추가된다

## 테스트 체크리스트

Notion API 연동/비즈니스 로직 작업이므로 아래 케이스를 유닛(node) + E2E + Playwright MCP 수동 확인으로
커버했다.

- [x] **ValidationError → not_found 분류**: `errors.test.ts`에서 `APIErrorCode.ValidationError`
      에러를 입력해 `kind: "not_found"`로 분류됨을 검증(UUID 형식이 아닌 id 접근 시 404 처리를 보장하는
      회귀 방지 케이스)
- [x] **기존 에러 분류 회귀 없음**: `errors.test.ts`의 auth/rate_limited/network/unknown/idempotent
      케이스가 모두 그대로 통과함을 확인
- [x] **GitHub 버튼 새 탭 동작**: `e2e/navigation.spec.ts`에서 `/projects` 목록의 첫 카드로 이동해
      GitHub 버튼의 `target="_blank"`/`rel="noopener noreferrer"`를 검증(특정 id에 의존하지 않음,
      Notion 스키마상 GitHub 링크는 모든 프로젝트에 존재)
- [x] **데모 버튼 조건부 숨김**: `e2e/navigation.spec.ts`에서 목록의 모든 프로젝트를 순회하며 데모
      버튼이 0개 또는 1개(중복 렌더링 없음)임을 검증하고, 실제 데이터 중 최소 한 건은 0개임을 검증
      (특정 mock id 대신 실데이터 관찰 기반, 데이터가 바뀌어도 유효한 회귀 신호 유지)
- [x] **잘못된 id 404**: `e2e/navigation.spec.ts`에서 UUID 형식이 아닌 `nonexistent-project-id` 접근 시
      `notFound()`로 404 UI가 뜨고 "프로젝트 목록으로 돌아가기" 클릭 시 `/projects`로 이동함을 검증
      (`ValidationError → not_found` 수정 덕분에 통과)
- [x] **본문 블록 렌더링 수동 확인**: Playwright MCP로 실제 Notion 프로젝트 상세 페이지에서
      heading/paragraph/list/image/code/quote 등 본문 블록이 `NotionBlockRenderer`로 정상 렌더링됨을
      확인
- [x] **정적 생성 확인**: `npm run build` 로그에서 `/projects/[id]`가 실제 Notion 프로젝트 2건에 대해
      SSG로 프리렌더됨을 확인

## 구현 단계

Shrimp MCP로 서브태스크를 나눠 순차 실행했다(각 서브태스크 `execute_task`→구현→`verify_task`).

1. **Task009-1** — 상세 페이지 실데이터 연동(`page.tsx`) 및 `next.config.ts` `remotePatterns` 등록,
   `nextjs-developer` 서브에이전트 위임
2. **버그 수정(구현 중 발견)** — Task009-1 구현 검증 과정에서 UUID 형식이 아닌 id가 `notFound()`가
   아닌 일반 에러 페이지로 가는 결함을 발견해 `classifyNotionError`를 직접 수정(에러 분류는 Task006이
   만든 공유 유틸리티라 별도 서브태스크 없이 통합 진행)
3. **Task009-2** — `e2e/navigation.spec.ts`의 상세 페이지 mock id 하드코딩 테스트 2개를 데이터
   비의존 방식으로 교체 및 Playwright MCP 검증, `test-engineer` 서브에이전트 위임
4. **Task009-3** — 통합 검증 및 작업 문서화(현재 작업)

이번 세션에서는 서브태스크별 커밋을 별도로 만들지 않았다(커밋 여부는 이번 작업 범위 밖).

## 변경 요약

- `src/app/projects/[id]/page.tsx`에서 `mockProjects.find(...)`를 `getProjectById(id)` 실호출로
  교체하고, `generateMetadata`/페이지 본체 양쪽에서 `try/catch`로 감싸 `NotionDataAccessError.kind
  === "not_found"`일 때만 `notFound()`를 호출, 그 외 에러는 재throw해 루트 `error.tsx`로 위임(홈/목록
  페이지가 에러를 그대로 전파하는 기존 원칙에 `not_found` 분기만 추가한 형태)
- `generateMetadata`가 `project.title`/`project.summary`/`project.thumbnailUrl`로 title/description/
  `openGraph.images`를 채우도록 구현
- "소개" section의 `{/* TODO(Task005/009) */}` 주석과 `<p>{project.summary}</p>` 임시 렌더링을
  `getProjectBlocks(id)` + `<NotionBlockRenderer blocks={blocks} />`로 교체
- `generateStaticParams()`를 신규 추가해 `getProjects()`로 전체 id 목록을 반환, 상세 경로를 빌드
  타임에 정적 생성(SSG)하도록 함
- `next.config.ts`에 `images.remotePatterns`를 추가해 Notion 파일 서명 URL 호스트
  (`prod-files-secure.s3.us-west-2.amazonaws.com`)를 등록
- `src/lib/notion/errors.ts`의 `classifyNotionError`에서 `APIErrorCode.ValidationError`를
  `APIErrorCode.ObjectNotFound`와 동일하게 `kind: "not_found"`로 분류하도록 수정(UUID 형식이 아닌
  id 요청 시 Notion API가 404가 아닌 400 `validation_error`를 반환하는데, 이를 이전에는
  `"unknown"`으로 분류해 일반 에러 페이지로 갔던 결함을 수정). `errors.test.ts`에 해당 케이스 유닛
  테스트를 추가
- `e2e/navigation.spec.ts`의 상세 페이지 mock 하드코딩 테스트 2개(`mock-project-1`, `mock-project-4`)를
  `a[href^="/projects/"]` 기반 데이터 비의존 테스트로 교체. GitHub 버튼 테스트는 목록의 첫 카드로 이동해
  검증하고, 데모 버튼 숨김 테스트는 목록 전체를 순회하며 "버튼은 0~1개, 최소 한 건은 0개" 조건으로
  검증(향후 데이터 변경에도 유효한 회귀 신호 유지). `nonexistent-project-id` 404 테스트는 버그 수정
  덕분에 변경 없이 계속 통과

### 검증 결과

- `npm run test:run`: 22개 테스트 파일, 98개 테스트 전부 통과(회귀 없음, `ValidationError → not_found`
  케이스 포함)
- `npm run build`: Turbopack 프로덕션 빌드 성공, 타입 체크 통과. `/projects/[id]`가 `generateStaticParams`
  를 통해 실제 Notion 프로젝트 2건(`3b628b62-3ff5-80f3-9b73-c50c622a3772`,
  `3b628b62-3ff5-8097-a9d3-cdd46e3566dc`)에 대해 SSG로 프리렌더됨을 빌드 로그로 확인
- `npm run test:e2e`: 11개 테스트 전부 통과(수정된 GitHub 버튼·데모 버튼 테스트 포함, 404·목록·홈 대표
  카드·전체 프로젝트 보기 CTA 테스트 회귀 없음)
- Playwright MCP: `npm run dev` 로컬 서버에서 실제 Notion 프로젝트 상세 페이지에 제목/기간/기술스택
  뱃지/본문 블록(heading/paragraph/list/image 등)이 정상 렌더링됨을 확인. GitHub 버튼의
  `target="_blank"`/`rel="noopener noreferrer"`를 확인. 데모 링크가 없는 두 프로젝트 모두 데모 버튼이
  노출되지 않음을 확인. `/projects/nonexistent-project-id`(UUID 형식 아님)와
  `/projects/00000000-0000-0000-0000-000000000000`(형식은 유효하지만 존재하지 않는 UUID) 모두
  `not-found.tsx`의 404 UI가 뜨고 "프로젝트 목록으로 돌아가기" 클릭 시 `/projects`로 이동함을 확인
