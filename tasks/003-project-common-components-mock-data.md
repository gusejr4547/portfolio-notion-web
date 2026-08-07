# Task 003: 프로젝트 공통 컴포넌트 및 더미 데이터 구축

> 직전 완료 작업: `tasks/002-domain-types-notion-contract.md`, `tasks/001-detail-route-skeleton.md`

## 고수준 명세서

Task002에서 정의한 `Project`/`ProjectSummary`/`ProjectDetail`/`ProjectPeriod` 타입을 소비하는
더미 프로젝트 픽스처와 5개 프레젠테이션 컴포넌트를 만든다. Notion API 연동(Phase 3) 이전에
UI를 완성하기 위한 작업이며, 이 산출물은 다음 작업(Task004: 홈/목록/상세 페이지 UI)이 그대로
조립해서 사용한다.

- `src/lib/mock/projects.ts`에 `Project[]` 더미 픽스처 6개 작성 (대표/데모 없음/썸네일 없음/기간
  없음/진행중 등 엣지 케이스 포함)
- `TechStackBadges`, `EmptyState`, `ProjectCard`, `ProjectGrid`, `ProjectLinks` 5개 컴포넌트를
  `src/components/project/`에 구현 (모두 서버 컴포넌트, `"use client"` 없음)
- `ProjectCard`/`ProjectGrid`는 `ProjectSummary`(링크류 제외)를, `ProjectLinks`는
  `Pick<Project, "githubUrl" | "demoUrl">`을 각각 사용해 목록 카드와 상세 페이지 전용 링크
  버튼의 책임을 분리
- 썸네일은 `next/image`가 아닌 일반 `<img>`를 사용 (Notion 이미지 도메인이 아직
  `next.config.ts`의 `remotePatterns`에 등록되지 않았기 때문)
- `next/link`를 Base UI `Button`으로 렌더하는 `nativeButton={false} render={<Link ... />}`
  패턴(`src/app/not-found.tsx` 기준)을 `ProjectLinks`의 GitHub/데모 버튼에 적용

Notion API 연동이 아닌 순수 UI/픽스처 작업이므로 "테스트 체크리스트" 섹션은 포함하지 않는다
(ROADMAP.md 워크플로우 기준 해당 섹션은 Notion API 연동 및 비즈니스 로직 작업에만 필수).

## 관련 파일

- `src/lib/mock/projects.ts` (신규) — 더미 프로젝트 픽스처 6개 (`Project[]`)
- `src/components/project/tech-stack-badges.tsx` + `.test.tsx` (신규)
- `src/components/project/empty-state.tsx` + `.test.tsx` (신규)
- `src/components/project/project-card.tsx` + `.test.tsx` (신규)
- `src/components/project/project-grid.tsx` + `.test.tsx` (신규)
- `src/components/project/project-links.tsx` + `.test.tsx` (신규)
- `src/types/project.ts` (참고, 변경 없음) — Task002에서 정의한 타입 소비
- `src/app/not-found.tsx` (참고) — Base UI `Button` + `next/link` 렌더 패턴
- `src/components/ui/{button,card,badge}.tsx` (참고, 변경 없음) — 기설치 shadcn 컴포넌트 재사용
- `docs/ROADMAP.md` (수정) — 완료 표시 및 작업 파일 참조 추가

## 수락 기준

- [x] `src/lib/mock/projects.ts`가 `Project[]` 타입의 `mockProjects`를 export하며, 대표 있음
      (완료 기간 포함) / 대표+진행중 / 비대표 정상 데이터 / 데모 링크 없음 / 썸네일 없음 / 기간
      없음 엣지 케이스를 모두 포함한다
- [x] `TechStackBadges`, `EmptyState`, `ProjectCard`, `ProjectGrid`, `ProjectLinks` 5개
      컴포넌트가 모두 `function ComponentName() {}` 선언 + 파일 하단 `export { ComponentName }`
      패턴(default export 금지)으로 구현되어 있다
- [x] `ProjectCard`/`ProjectGrid`는 `ProjectSummary`를, `ProjectLinks`는
      `Pick<Project, "githubUrl" | "demoUrl">`을 props로 사용한다
- [x] 썸네일 렌더링에 `next/image`가 아닌 `<img>`를 사용하고, 썸네일이 없을 때는 `ImageOff`
      아이콘 플레이스홀더를 보여준다
- [x] `ProjectLinks`의 GitHub 버튼은 항상 렌더되고, 데모 버튼은 `demoUrl`이 있을 때만 렌더되며
      둘 다 `target="_blank" rel="noopener noreferrer"`를 갖는다
- [x] 기간 포맷 헬퍼가 `project-card.tsx` 파일 내부 비공개 함수로 존재하며 "YYYY.MM ~ YYYY.MM",
      "YYYY.MM ~ 진행중", "기간 미정" 3가지 케이스를 모두 올바르게 표기한다
- [x] 5개 컴포넌트 모두 `*.test.tsx` 유닛 테스트가 존재하고, 전부 `@/test/utils`의
      `render`/`screen`을 사용한다 (`@testing-library/react` 직접 import 없음)
- [x] `npx tsc --noEmit`이 에러 없이 통과한다
- [x] `npm run test:run`이 기존 테스트를 포함해 전부 통과한다 (회귀 없음)
- [x] `docs/ROADMAP.md`의 Task 003 제목에 완료 표시가 추가된다

## 구현 단계

1. `src/lib/mock/projects.ts` 생성 — `Project[]` 픽스처 6개, 엣지 케이스 커버리지 확보
2. `src/components/project/tech-stack-badges.tsx` + 테스트 구현
3. `src/components/project/empty-state.tsx` + 테스트 구현 (`src/app/not-found.tsx` 레이아웃 패턴 재사용)
4. `src/components/project/project-card.tsx` + 테스트 구현 (파일 내부 기간 포맷 헬퍼 포함, `<img>`/`ImageOff` 플레이스홀더, `next/link` 카드 래핑)
5. `src/components/project/project-grid.tsx` + 테스트 구현 (빈 배열 시 `EmptyState` 위임)
6. `src/components/project/project-links.tsx` + 테스트 구현 (Base UI `Button` + `next/link` 렌더 패턴, GitHub 아이콘 미사용/ExternalLink 아이콘 사용)
7. `npx tsc --noEmit`으로 타입 컴파일 확인
8. `npm run test:run` 실행하여 신규 테스트 포함 전체 통과 및 회귀 없음 확인
9. 본 작업 파일의 체크박스 및 변경 요약 갱신
10. `docs/ROADMAP.md`의 Task 003 제목에 `✅ - 완료` 및 `See: /tasks/003-project-common-components-mock-data.md` 추가

## 변경 요약

- `src/lib/mock/projects.ts` 신규 생성: `Project[]` 타입의 `mockProjects` 6개 픽스처를 정의.
  대표+완료기간+데모+썸네일(mock-project-1), 대표+진행중(mock-project-2), 비대표 정상
  데이터(mock-project-3), 데모 링크 없음(mock-project-4), 썸네일 없음(mock-project-5), 기간
  없음(mock-project-6) 엣지 케이스를 각각 커버
- `src/components/project/tech-stack-badges.tsx` 신규 생성: `techStack: string[]`을
  `Badge`(`variant="secondary"`) 목록으로 매핑하는 서버 컴포넌트, `tech-stack-badges.test.tsx`로
  다중 항목 렌더링 검증
- `src/components/project/empty-state.tsx` 신규 생성: `src/app/not-found.tsx`와 동일한 중앙
  정렬 레이아웃에 `FolderOpen` 아이콘 + 기본/커스텀 title·description을 렌더, `empty-state.test.tsx`로
  기본값과 커스텀 값 모두 검증
- `src/components/project/project-card.tsx` 신규 생성: `ProjectSummary`를 받아 `next/link`로
  `/projects/{id}`를 감싸고, 파일 스코프 비공개 헬퍼(`formatYearMonth`, `formatPeriod`)로
  "YYYY.MM ~ YYYY.MM"/"YYYY.MM ~ 진행중"/"기간 미정" 3가지 포맷을 처리, 썸네일 유무에 따라
  `<img>` 또는 `ImageOff` 플레이스홀더 렌더. `project-card.test.tsx`에서 (a) 썸네일 있음 →
  제목/요약/링크 href/img role 존재, (b) 썸네일 없음 → img role 부재, (c) 기간 없음 → "기간
  미정" 텍스트 3케이스 검증
- `src/components/project/project-grid.tsx` 신규 생성: `projects.length === 0`이면
  `EmptyState`, 아니면 반응형 그리드(`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)에
  `ProjectCard` 매핑. `project-grid.test.tsx`에서 목록 링크 개수 일치, 빈 배열 시 EmptyState
  노출 검증
- `src/components/project/project-links.tsx` 신규 생성: `Pick<Project, "githubUrl" | "demoUrl">`을
  받아 GitHub 버튼(항상 렌더, 아이콘 없이 텍스트만 — lucide-react v1에 `Github` 아이콘이 없어
  import 시 에러가 남을 확인)과 데모 버튼(`demoUrl` 있을 때만, `ExternalLink` 아이콘 +
  `data-icon="inline-end"`)을 `nativeButton={false} render={<Link .../>}` 패턴으로 렌더, 모두
  `target="_blank" rel="noopener noreferrer"` 부여. `project-links.test.tsx`에서 두 케이스(데모
  있음/없음) 검증 — Base UI `Button`이 `<a>` 태그로 렌더되어도 `role="button"`을 명시적으로
  부여하므로 테스트 쿼리를 `getByRole("button", { name })`으로 작성함 (plain `next/link`인
  `ProjectCard`는 `role="link"` 그대로 유지)
- `npx tsc --noEmit` 에러 없이 통과
- `npm run test:run` 6 test files / 12 tests 모두 통과 (기존 `header.test.tsx` 포함 회귀 없음)
- 이번 작업에서는 커밋을 생성하지 않았다(사용자 요청) — 변경 사항은 워킹 트리에 남아 있음
