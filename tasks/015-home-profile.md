# Task 015: 홈 프로필 소개 (F006)

> 직전 완료 작업: `tasks/010-core-user-flow-integration.md`, `tasks/009-f002-project-detail-integration.md`

## 고수준 명세서

홈 상단이 고정 문구("포트폴리오")뿐이라 누구의 포트폴리오인지 알 수 없다. Notion 프로필 페이지의 이름·연락처·소개·기술 스택·학력/교육·수상/자격증을 홈에 표시한다. 별도 About 페이지는 만들지 않는다.

- 데이터: 환경변수 `NOTION_PROFILE_PAGE_ID`(선택)가 가리키는 Notion 페이지. 제목 = 이름, 본문 = 연락처 한 줄(이름 바로 아래)·소개·학력/교육·수상/자격증, 소제목은 한글·이모지 없이 작성, 본문 중간의 인라인 DB(`Skills & Tools`) = 분야별 기술 스택
- 본문은 Notion에서 작성한 순서대로 렌더하며, DB(`child_database`) 위치에서 본문을 앞/뒤로 나눠 그 사이에 기술 스택 섹션을 끼운다
- 전화번호는 공개하지 않는다 (프로필 페이지에 넣지 않음)
- 값이 없거나 조회에 실패하면 기존 히어로 문구로 대체한다 (홈 전체가 에러가 되지 않음)

## 변경 사항 요약

- Notion: `Portfolio` 하위에 프로필 페이지(제목=이름, 본문=About Me → SKILLS → EXPERIENCE → Awards/Certificates → Contact)와 기술 스택 인라인 DB(`Skills & Tools`, 7행)를 이력서 원문에서 그대로 옮겼다. 전화번호는 제외했다. 환경변수 `NOTION_PROFILE_PAGE_ID`를 `.env.local`에 설정했고, Vercel에도 추가해야 한다
- 코드: `getProfile`이 이름 + 본문 블록(`getProjectBlocks` 재사용) + `child_database` 기준 앞/뒤 분리 + 기술 스택 행 매핑을 수행하고, `getOptionalProfile`은 ID 미설정·조회 실패 시 `null`을 반환해 홈이 기존 히어로로 대체된다
- 기술 스택 DB 분야 순서는 Notion 생성 시각(분 단위)으로 정해지지 않아 선택 속성 `순서`(number)를 추가해 클라이언트에서 정렬한다
- `RichText`: `mailto:` 링크는 새 탭 속성 없이 같은 탭에서 연다
- 가독성 개선: 프로필 본문의 섹션 제목(h3)은 `text-2xl` + 아래 구분선, 소제목(h4)은 본문 크기 + 왼쪽 강조 막대로 위계를 구분한다(`ProfileSection` 컨테이너 안에서만 적용, 프로젝트 상세는 변경 없음). 연락처는 Notion 문단 안 줄바꿈(`<br>`)으로 두 줄로 표시하며, 이를 위해 `ParagraphBlock`에 `whitespace-pre-line`을 적용해 프로젝트 상세 본문에서도 원문 줄바꿈이 그대로 보인다
- 검증: lint·tsc·`npm run test:run`(161개)·`npm run test:e2e`(24 통과, 1 skip) 통과. Playwright MCP로 다크/라이트/모바일(390×844) 화면, 전화번호 미노출, `NOTION_PROFILE_PAGE_ID` 미설정 시 폴백을 직접 확인했다

## 관련 파일

- `src/types/profile.ts` (신규), `src/env.ts`, `.env.example`
- `src/lib/notion/profile.ts` (신규), `src/lib/notion/mapper.ts`, `src/lib/notion/index.ts`
- `src/components/profile/skills-section.tsx`, `profile-section.tsx` (신규)
- `src/components/notion/rich-text.tsx` (`mailto:` 링크는 같은 탭)
- `src/app/page.tsx`
- `src/lib/notion/profile.test.ts`, `src/lib/notion/mapper.test.ts`, `src/components/profile/*.test.tsx`, `src/components/notion/rich-text.test.tsx`
- `e2e/home-profile.spec.ts` (신규)

## 수락 기준

- [x] 홈에 이름(h1), 연락처(GitHub·이메일), 소개, 분야별 기술 스택, 학력/교육, 수상/자격증이 Notion 본문 순서대로 표시된다
- [x] 기술 스택은 "많이 해봤어요"(채운 배지)와 "해본 적 있어요"(윤곽선 배지)로 구분되고 범례가 있다
- [x] 전화번호가 화면 어디에도 노출되지 않는다
- [x] 프로필 아래에 "대표 프로젝트" 섹션이 그대로 유지된다
- [x] `NOTION_PROFILE_PAGE_ID`가 없거나 페이지 조회에 실패해도 홈이 기존 히어로 문구로 정상 렌더된다
- [x] 모바일 뷰포트(390×844)에서 가로 스크롤 없이 표시된다
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run test:run`, `npm run test:e2e`가 통과한다
- [x] `docs/ROADMAP.md`의 Task015 제목에 완료 표시가 추가된다

## 구현 단계

- [x] Notion에 프로필 페이지와 기술 스택 DB 작성, 통합(Integration)에 Connect
- [x] 타입·매퍼·`getProfile`/`getOptionalProfile` 구현
- [x] `SkillsSection`, `ProfileSection` 구현 및 홈 연결 (폴백 포함)
- [x] 유닛/E2E 테스트 작성
- [x] Playwright MCP로 실제 화면 확인

## 테스트 체크리스트

- [x] **프로필 노출**: 홈 `/`에서 h1이 기본 문구("포트폴리오")가 아닌 이름으로 표시된다
- [x] **기술 스택**: 분야명(`dt`)과 배지가 1개 이상 표시되고, 범례(많이 해봤어요/해본 적 있어요)가 보인다
- [x] **연락처**: `mailto:` 링크가 있고 새 탭 속성이 없으며, GitHub 링크는 새 탭으로 열린다
- [x] **개인정보**: 본문에 전화번호 형식 문자열이 없다
- [x] **대표 프로젝트 유지**: 프로필 아래에 프로젝트 카드(`a[href^="/projects/"]`)와 "전체 프로젝트 보기" 버튼이 보인다
- [x] **모바일(390×844)**: 가로 스크롤이 생기지 않는다
- [x] **폴백**: `NOTION_PROFILE_PAGE_ID`를 제거한 상태에서 홈이 기존 히어로 문구로 렌더된다
