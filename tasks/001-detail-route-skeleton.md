# Task 001: 프로젝트 상세 라우트 및 페이지 골격 생성

> 이 저장소의 첫 작업 파일이라 참조할 직전 완료 작업(예: 006, 005) 예시가 없습니다.

## 고수준 명세서

Notion Page ID를 식별자로 쓰는 프로젝트 상세 라우트(`/projects/[id]`)의 빈 껍데기를 만든다.
실제 Notion 데이터 페칭/본문 렌더링은 이후 작업(Task 009 등)에서 진행하며, 이번 작업은 다음만 다룬다:

- Next.js 16 동적 세그먼트 `params` 규약(Promise 기반)에 맞춘 `page.tsx` 골격
- 세그먼트 전용 `loading.tsx`, `not-found.tsx` 배치
- `generateMetadata` 시그니처 골격 (내용 채우기는 Task 009)
- 홈/목록/상세 3개 라우트가 모두 정상 응답하는지 확인

비즈니스 로직·Notion 연동이 없는 순수 라우팅/스캐폴딩 작업이므로 "테스트 체크리스트" 섹션은
포함하지 않는다 (ROADMAP.md 워크플로우 기준 해당 섹션은 Notion API 연동 및 비즈니스 로직
작업에만 필수).

세그먼트 레벨 `error.tsx`는 추가하지 않는다 — Next.js의 `error.tsx` 오류 경계는 자신의
세그먼트와 그 하위 세그먼트를 모두 감싸므로, 루트의 `src/app/error.tsx`(및 `global-error.tsx`)가
`[id]` 세그먼트에서 발생하는 렌더링 오류도 그대로 처리한다.

## 관련 파일

- `src/app/projects/[id]/page.tsx` (신규) — 상세 페이지 골격, `generateMetadata` 포함
- `src/app/projects/[id]/loading.tsx` (신규) — 세그먼트 로딩 UI
- `src/app/projects/[id]/not-found.tsx` (신규) — 세그먼트 404 UI
- `src/app/loading.tsx` (참고) — 기존 로딩 스피너 패턴
- `src/app/not-found.tsx` (참고) — 기존 404 패턴 (Base UI 버튼 컨벤션)
- `src/app/projects/page.tsx` (참고) — 기존 "준비 중" 플레이스홀더 스타일
- `docs/ROADMAP.md` (수정) — 완료 표시 및 작업 파일 참조 추가

## 수락 기준

- [x] `src/app/projects/[id]/page.tsx`가 존재하며 `params: Promise<{ id: string }>`를 `await`하여 사용한다
- [x] `generateMetadata`가 동일한 Promise 기반 `params` 규약으로 정의되어 있다 (내용은 최소 스텁)
- [x] `src/app/projects/[id]/loading.tsx`, `not-found.tsx`가 배치되어 있다
- [x] `npm run dev` 기준 `/`, `/projects`, `/projects/{임의의 id}` 3개 라우트가 모두 에러 없이 응답한다
- [x] `npm run test:run`, `npm run test:e2e`가 기존과 동일하게 통과한다 (회귀 없음)
- [x] `docs/ROADMAP.md`의 Task 001 제목에 완료 표시가 추가된다

## 구현 단계

1. `src/app/projects/[id]/page.tsx` 생성 — `generateMetadata` 시그니처 골격 + 기본 페이지 컴포넌트
2. `src/app/projects/[id]/loading.tsx` 생성 — `src/app/loading.tsx` 패턴 재사용
3. `src/app/projects/[id]/not-found.tsx` 생성 — `src/app/not-found.tsx` 패턴을 상세 세그먼트 문구로 변형
4. `npm run dev`로 홈/목록/상세 라우트 수동 확인 (curl 또는 Playwright MCP)
5. `npm run test:run`, `npm run test:e2e` 실행하여 회귀 없음 확인
6. 본 작업 파일의 체크박스 및 변경 요약 갱신
7. `docs/ROADMAP.md`의 Task 001 제목에 `✅ - 완료` 및 `See: /tasks/001-detail-route-skeleton.md` 추가

## 변경 요약

- `src/app/projects/[id]/page.tsx` 신규 생성: `params: Promise<{ id: string }>`를 `await`하는 async 컴포넌트와 동일한 규약의 `generateMetadata` 스텁(제목에 id 반영)을 구현
- `src/app/projects/[id]/loading.tsx`, `not-found.tsx` 신규 생성: 각각 루트 `loading.tsx`/`not-found.tsx` 패턴을 재사용하되, 404 문구와 링크를 상세 세그먼트에 맞게 조정(`/projects`로 복귀)
- 세그먼트 전용 `error.tsx`는 계획대로 추가하지 않음 (루트 `error.tsx`가 하위 세그먼트 오류까지 처리)
- `npx tsc --noEmit`으로 타입 계약 확인, `npm run dev`로 `/`, `/projects`, `/projects/test-id` 3개 라우트가 모두 200 응답하고 `params.id`가 본문과 `<title>`에 정상 반영됨을 확인
- `npm run test:run`(2 passed), `npm run test:e2e`(5 passed) 모두 통과, 기존 기능 회귀 없음
- 참고: 로컬 `.env.local`의 `NOTION_DATABASE_ID`가 비어 있어 `npm run dev`/E2E 실행 시 임시로 프로세스 환경변수에만 더미 값을 주입해 검증했으며, 어떤 파일도 수정하지 않았다. 실제 Notion 연동은 Task 006 이후에 진행된다.
