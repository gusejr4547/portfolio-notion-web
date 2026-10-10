# Task 016: 하단 플로팅 내비게이션 독

> 직전 완료 작업: `tasks/015-home-profile.md`, `tasks/010-core-user-flow-integration.md`

## 고수준 명세서

화면 위쪽에 있던 내비게이션(로고 "포트폴리오" + 홈/프로젝트 링크 + 테마 토글)을 화면 하단의 둥근 pill 독(홈, 프로젝트)으로 옮기고, 테마 토글은 페이지 우상단 버튼으로 분리한다. 참고 프로젝트(`ai-portfolio`)는 상태 기반 탭을 쓰는 단일 페이지 앱이라 구조를 그대로 가져오지 않고, 독의 시각 구조(유리 효과 pill, 아이콘+라벨 탭, 슬라이딩 활성 표시)만 우리 사이트의 멀티 라우트와 흑백 중립 디자인 토큰에 맞게 재구성한다.

- 상단 헤더는 완전히 제거한다. 홈으로 돌아가는 동작은 "홈" 탭이 맡는다.
- 독 구성: `[홈] [프로젝트]` (이동 전용).
- 테마 토글: 페이지 우상단 버튼. 자주 쓰지 않는 설정이라 화면에 고정하지 않고 페이지와 함께 스크롤되며, 드롭다운(Light/Dark/System)은 아래로 열린다. 처음에는 독 오른쪽 끝에 두었다가 독을 이동 전용으로 단순화하기 위해 분리했다.
- 활성 탭: 홈은 `/`에서만, 프로젝트는 `/projects`와 `/projects/[id]` 모두에서 활성이다.
- 활성 pill은 탭 이동 시 `motion`의 `layoutId` 스프링으로 미끄러지며, 모션 감소 설정(`prefers-reduced-motion`)을 존중한다.
- 새 의존성은 `motion` 하나다.

## 관련 파일

- `src/components/layout/bottom-nav.tsx` (신규), `src/components/layout/bottom-nav.test.tsx` (신규)
- `src/components/layout/theme-toggle-corner.tsx`, `theme-toggle-corner.test.tsx` (신규)
- `src/app/layout.tsx` (Header → BottomNav + ThemeToggleCorner, `body`에 `relative`, `main`에 `pb-8`)
- `src/components/layout/header.tsx`, `header.test.tsx` (삭제)
- `e2e/navigation.spec.ts`, `e2e/project-journey.spec.ts`, `e2e/layout-stability.spec.ts` (독 기준으로 갱신), `e2e/theme.spec.ts` (변경 없이 통과)
- `package.json`, `package-lock.json` (`motion` 추가)

## 수락 기준

- [x] 모든 페이지(`/`, `/projects`, `/projects/[id]`)에서 하단 중앙에 독이 보이고 상단 헤더가 없다
- [x] 현재 페이지의 탭이 `aria-current="page"`로 표시되고, 프로젝트 상세에서도 "프로젝트"가 활성이다
- [x] 탭 이동 시 활성 pill이 슬라이딩한다 (`prefers-reduced-motion`에서는 비활성)
- [x] 테마 토글이 우상단에 있고 페이지와 함께 스크롤되며, 메뉴(Light/Dark/System)가 아래로 열려 동작한다
- [x] 독이 마지막 콘텐츠를 가리지 않는다 (하단 간격 확보)
- [x] 모바일(390×844)에서 가로 스크롤 없이 라벨과 함께 표시된다
- [x] 스크롤바 유무와 관계없이 페이지 간 독 위치가 같다 (`scrollbar-gutter: stable` 유지)
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run test:run`, `npm run test:e2e`가 통과한다
- [x] `docs/PRD.md` 메뉴 구조와 `docs/ROADMAP.md`가 새 구조를 반영한다

## 구현 단계

- [x] `motion` 설치
- [x] `BottomNav` 구현, 루트 레이아웃에서 `Header` 교체 및 삭제
- [x] 유닛·E2E 테스트 갱신
- [x] Playwright MCP로 PC(라이트/다크)·모바일 시각 검증 및 하단 여백 보정
- [x] PRD·ROADMAP·작업 파일 문서화

## 테스트 체크리스트

- [x] **독 노출**: `nav[aria-label="주요 메뉴"]`에 홈/프로젝트 링크가 있고 "테마 전환" 버튼은 없다
- [x] **활성 표시**: `/`에서 홈만, `/projects`와 `/projects/[id]`에서 프로젝트가 `aria-current="page"`다
- [x] **이동**: 홈 탭과 프로젝트 탭 클릭으로 각각 `/`, `/projects`로 이동한다
- [x] **고정 위치**: 스크롤 전후로 독의 화면 기준 위치가 같고 화면 아래쪽에 있다
- [x] **모바일(390×844)**: 독이 보이고 가로 스크롤이 없으며 프로젝트 탭으로 목록에 도달할 수 있다
- [x] **독·테마 버튼 위치 안정성**: 홈·목록·상세 사이에서 독과 우상단 테마 버튼의 위치가 같다
- [x] **테마 버튼 배치**: 우상단에 있고, 스크롤하면 화면 밖으로 올라가며(고정 아님), 독 안에는 없다
- [x] **테마**: 우상단 메뉴에서 Dark/Light 선택 후 새로고침해도 유지된다 (`theme.spec.ts`)

## 변경 사항 요약

- 상단 sticky 헤더를 삭제하고 루트 레이아웃에 `BottomNav`를 두었다. 루트에 있어 라우트 이동 중 언마운트되지 않으므로 활성 pill이 페이지를 가로질러 미끄러진다
- 활성 pill은 `motion`의 `layoutId` 스프링(`bounce 0.2`, `duration 0.6`)이며, 프레임 측정으로 0.3초 안에 이동하고 살짝 오버슈트하는 것을 확인했다
- 테마 토글은 처음에 독 오른쪽 끝에 뒀다가(메뉴가 위로 열리며 독 테두리와 겹쳐 `sideOffset` 보정), 독을 이동 전용으로 단순화하기 위해 우상단 absolute 버튼으로 분리했다. 이에 따라 독용으로 추가했던 `ModeToggle`의 `side`/`align`/`sideOffset` props는 되돌렸다. 버튼은 본문 컨테이너 오른쪽 끝(1129px)과 정렬되고 제목(96px부터)과 겹치지 않는다
- 하단 간격이 18px로 빡빡해 `main`에 `pb-8`을 추가했다(모바일 기준 50px)
- 설치된 `motion`은 14.1.0이며 React 19를 지원(peer `react ^18 || ^19`)하고 `motion/react` 진입점을 쓴다
- 검증: lint·tsc·`npm run test:run`(168개)·`npm run test:e2e`(34개) 통과. Playwright MCP로 라이트/다크/모바일, 슬라이딩, 우상단 테마 메뉴(아래로 열림)와 스크롤 시 함께 이동, 상세 페이지 활성 표시, 콘솔 에러 0건을 확인했다
