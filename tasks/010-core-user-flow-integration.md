# Task 010: 핵심 사용자 플로우 통합 테스트

> 직전 완료 작업: `tasks/009-f002-project-detail-integration.md`, `tasks/008-f003-featured-projects-highlight.md`

## 고수준 명세서

Phase 3(F001~F003, Task007~009)에서 홈/목록/상세가 모두 실제 Notion 데이터로 연동되었다. Task010은
새 기능을 추가하는 작업이 아니라, 그 위에서 PRD 사용자 여정(홈→상세, 홈→목록→상세→외부 링크)이
하나의 흐름으로 끊김 없이 동작하는지 확인하고, 지금까지 다루지 않았던 회귀 영역(모바일 뷰포트,
모바일+다크모드 조합)과 엣지 케이스를 마무리하는 통합 검증 작업이다.

`e2e/navigation.spec.ts`는 이미 헤더 내비게이션, 홈 대표 카드 클릭, "전체 프로젝트 보기" CTA, 목록
카드 클릭, GitHub 새 탭, 데모 버튼 조건부 노출, 잘못된 id(비-UUID 형식) 404를 개별 테스트로 촘촘히
커버하고 있어, 신규 `e2e/project-journey.spec.ts`는 이를 중복 검증하지 않고 (1) 여러 스텝을 하나로
이은 여정 테스트, (2) UUID 형식이지만 존재하지 않는 id의 404(`ObjectNotFound` 경로), (3) 모바일
뷰포트 회귀, (4) 모바일+다크모드 조합 회귀에 집중했다.

"0건/썸네일 없음/Notion 오류 응답" 엣지 케이스는 실제 브라우저 E2E로 재현하기 어렵다는 판단을
내렸다 — Notion 호출은 전부 Server Component 내부에서 발생해 `page.route()`로 가로챌 수 없고(저장소
전체에서 네트워크 모킹 전례 0건), 실제 Notion DB에는 프로젝트가 소수(2건)뿐이라 "0건"을 자연 데이터로
재현할 수 없다. 대신 이 세 가지는 이미 적절한 레벨(AGENTS.md 기준: sync 컴포넌트→유닛 jsdom, 순수
로직→유닛 node)에서 검증되어 있음을 확인했다:
- **0건** → `src/components/project/project-grid.test.tsx` (`projects={[]}` → EmptyState)
- **썸네일 없음** → `src/components/project/project-card.test.tsx` (placeholder 렌더)
- **Notion 오류 응답(auth/rate_limited/network/not_found)** → `src/lib/notion/errors.test.ts`,
  `src/lib/notion/projects.test.ts` (`classifyNotionError` 기반, Task006)

이는 Task007-3/008-3/009-2가 실데이터로 재현 불가능한 케이스를 "대체 검증 또는 판단 근거와 함께
스킵 처리"했던 전례와 일치하는 방식이며, 새 모킹 인프라(MSW 등)를 도입하지 않고 기존 테스트
피라미드를 그대로 활용했다.

## 관련 파일

- `e2e/project-journey.spec.ts` (신규) — 전체 사용자 여정 + 모바일/다크모드 회귀 + UUID 형식
  404 엣지 케이스
- `e2e/navigation.spec.ts` (참고, 변경 없음) — 개별 스텝 검증 원본
- `e2e/theme.spec.ts` (참고, 변경 없음) — 다크모드 토글 패턴 원본
- `src/components/project/project-grid.test.tsx`,
  `src/components/project/project-card.test.tsx`,
  `src/lib/notion/errors.test.ts`,
  `src/lib/notion/projects.test.ts` (참고, 변경 없음) — 0건/썸네일 없음/Notion 오류 응답의 기존
  유닛 테스트 커버리지

## 수락 기준

- [x] 홈 → 상세, 홈 → 목록 → 상세 → 외부 링크(새 탭) 전체 여정이 하나의 E2E 흐름으로 검증된다
- [x] UUID 형식이지만 존재하지 않는 프로젝트 id 접근 시 404가 표시된다(`ObjectNotFound` 경로)
- [x] 모바일 뷰포트에서 헤더 nav가 숨겨져도 대표 프로젝트/CTA로 목록까지 도달 가능함을 확인한다
- [x] 모바일 뷰포트 + 다크모드 조합에서 테마 전환이 적용되고 새로고침 후에도 유지되며 레이아웃이
      깨지지 않는다
- [x] 0건/썸네일 없음/Notion 오류 응답 엣지 케이스가 기존 유닛 테스트로 커버되어 있음을 확인하고,
      실브라우저 E2E로 재현하지 않는 판단 근거를 문서화한다
- [x] `npm run test:run`과 `npm run test:e2e` 전체가 통과한다
- [x] `docs/ROADMAP.md`의 Task010 제목에 완료 표시가 추가된다

## 테스트 체크리스트

- [x] **홈 → 상세 여정**: `project-journey.spec.ts`에서 홈의 대표 프로젝트 카드(`a[href^="/projects/"]`)
      클릭 후 상세 페이지의 h1/GitHub 버튼이 렌더됨을 검증
- [x] **홈 → 목록 → 상세 → 외부 링크 여정**: "전체 프로젝트 보기" → 목록 → 첫 카드 클릭 → 상세 →
      GitHub 버튼의 `target="_blank"`/`rel="noopener noreferrer"`를 한 흐름으로 검증
- [x] **UUID 형식 404**: `/projects/00000000-0000-0000-0000-000000000000` 접속 시 `not-found.tsx`가
      렌더됨을 검증. 실행 로그에서 Notion API가 `object_not_found`를 반환함을 확인해, 기존
      `nonexistent-project-id`(`validation_error`) 테스트와 다른 코드 경로를 검증했음을 확인
- [x] **모바일 뷰포트 회귀**: `test.use({ viewport: { width: 390, height: 844 } })`로 홈/목록에서
      카드 렌더링과 클릭 이동을 검증. `devices["iPhone 13"]` 전체 프로필은 `defaultBrowserType:
      "webkit"`를 포함해 `playwright.config.ts`의 chromium 단일 프로젝트 구성과 충돌(새 worker 강제
      에러)하여 뷰포트 크기만 오버라이드하는 방식으로 조정
- [x] **모바일 + 다크모드 조합 회귀**: 모바일 뷰포트에서 테마 전환 → Dark 선택 → `html.dark` 적용 →
      새로고침 후에도 유지 → 카드 렌더링 유지까지 검증. Playwright MCP로 실제 화면(390×844, Dark)을
      스크린샷 확인해 레이아웃이 깨지지 않음을 육안으로도 확인(우연히 실데이터 중 썸네일 없는
      프로젝트가 노출되어 placeholder 렌더링도 함께 확인됨)
- [x] **0건 엣지 케이스(기존 커버리지 확인)**: `project-grid.test.tsx`의 "빈 배열을 전달하면
      EmptyState 기본 문구를 렌더한다" 케이스가 이미 존재함을 확인
- [x] **썸네일 없음 엣지 케이스(기존 커버리지 확인)**: `project-card.test.tsx`의 "썸네일이 없는
      프로젝트는 이미지 대신 플레이스홀더를 렌더한다" 케이스가 이미 존재함을 확인
- [x] **Notion 오류 응답 엣지 케이스(기존 커버리지 확인)**: `errors.test.ts`/`projects.test.ts`의
      auth/rate_limited/network/not_found 분류 테스트가 이미 존재함을 확인(Task006)

## 구현 단계

1. `e2e/navigation.spec.ts`, `e2e/theme.spec.ts`, `playwright.config.ts`를 읽고 기존 커버리지와
   재사용 가능한 패턴(데이터 비의존 셀렉터, 다크모드 토글 셀렉터) 파악
2. `src/lib/notion/errors.ts`, `src/lib/notion/projects.ts`, 컴포넌트 유닛 테스트를 읽고 0건/썸네일
   없음/오류 응답이 이미 유닛 레벨에서 커버됨을 확인, 새 모킹 인프라 없이 E2E는 실브라우저로 재현
   가능한 영역에 집중하기로 판단
3. `e2e/project-journey.spec.ts` 작성(여정 2개, UUID 404 1개, 모바일 회귀 2개, 모바일+다크모드
   회귀 1개)
4. `npm run test:e2e` 실행 중 `devices["iPhone 13"]`가 `defaultBrowserType` 충돌로 실패하는 것을
   발견해 뷰포트 크기만 오버라이드하는 방식으로 수정
5. `npm run test:run`, `npm run test:e2e` 전체 통과 확인
6. Playwright MCP로 `npm run dev` 로컬 서버에서 모바일(390×844) + 다크모드 조합을 직접 확인
7. 작업 문서(`tasks/010-core-user-flow-integration.md`)와 `docs/ROADMAP.md` 갱신

## 변경 요약

- `e2e/project-journey.spec.ts`를 신규 작성해 PRD 사용자 여정 2개, UUID 형식 404 엣지 케이스 1개,
  모바일 뷰포트 회귀 2개, 모바일+다크모드 조합 회귀 1개를 추가(총 6개 신규 테스트)
- 기존 `e2e/navigation.spec.ts`, `e2e/theme.spec.ts`, `playwright.config.ts`는 변경하지 않음
- 0건/썸네일 없음/Notion 오류 응답 엣지 케이스는 새 테스트를 추가하지 않고, 이미 존재하는 유닛
  테스트(`project-grid.test.tsx`, `project-card.test.tsx`, `errors.test.ts`, `projects.test.ts`)로
  커버되어 있음을 확인하고 그 근거를 문서화

## 검증 결과

- `npm run test:run`: 22개 테스트 파일, 98개 테스트 전부 통과(회귀 없음)
- `npm run test:e2e`: 17개 테스트 전부 통과(기존 11개 + 신규 6개, 실행 로그에서 UUID 404 테스트가
  `object_not_found`를 반환함을 확인해 기존 `validation_error` 경로와 별개 경로임을 검증)
- Playwright MCP: `npm run dev` 로컬 서버를 390×844 뷰포트로 열어 홈 화면에서 헤더 nav가 숨겨지고
  대표 프로젝트 카드/CTA가 정상 노출됨을 확인. 테마 전환 → Dark 선택 후 스크린샷으로 다크 배경/텍스트
  대비/카드 레이아웃이 깨지지 않음을 확인(스크린샷은 확인 후 삭제, 저장소에 커밋하지 않음)
