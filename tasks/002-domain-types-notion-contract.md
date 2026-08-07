# Task 002: 도메인 타입 정의 및 Notion 데이터 계약 설계

> 직전 완료 작업: `tasks/001-detail-route-skeleton.md` (다른 완료 작업이 아직 없어 이 하나만 참조)

## 고수준 명세서

Notion Database와 웹 UI 사이의 데이터 계약을 코드 레벨에서 확정한다. Phase 2(더미 데이터 UI)와
Phase 3(Notion 연동) 이후의 모든 작업(Task003 컴포넌트, Task005 블록 렌더러, Task006 Notion 클라이언트)이
이 작업에서 정의하는 타입/상수를 그대로 재사용한다.

- `src/types/project.ts`에 `Project`(전체), `ProjectSummary`(목록 축약), `ProjectDetail`(상세), `ProjectPeriod` 정의
- Notion DB 속성명 매핑을 단일 상수 객체(`NOTION_PROPERTY`)로 정의해 이후 매핑 함수가 문자열 리터럴을 흩어 쓰지 않도록 함
- 블록 렌더러(Task005)가 지원할 `NotionBlockType` 유니온 정의
- `src/env.ts`/`.env.example`의 `NOTION_API_KEY`, `NOTION_DATABASE_ID` 서버 전용 스키마는 이전 커밋
  (`f86b52d ✨ feat: Notion 연동용 환경변수 스키마 추가`)에서 이미 반영되어 있음을 확인 — 이번 작업에서는 재작업하지 않음

비즈니스 로직·Notion API 호출이 없는 순수 타입/계약 정의 작업이므로 "테스트 체크리스트" 섹션은 포함하지 않는다
(ROADMAP.md 워크플로우 기준 해당 섹션은 Notion API 연동 및 비즈니스 로직 작업에만 필수).

## 관련 파일

- `src/types/project.ts` (신규) — 도메인 타입 및 Notion 속성 매핑 상수, 블록 타입 유니온
- `src/env.ts` (참고, 변경 없음) — 이미 `NOTION_API_KEY`/`NOTION_DATABASE_ID` 서버 스키마 반영됨
- `.env.example` (참고, 변경 없음) — 이미 Notion 환경변수 항목과 발급 방법 주석 반영됨
- `docs/PRD.md` (참고) — 데이터 모델 표(제목/요약/기술스택/GitHub 링크/데모 링크/썸네일/기간/대표)
- `docs/ROADMAP.md` (수정) — 완료 표시 및 작업 파일 참조 추가

## 수락 기준

- [x] `src/types/project.ts`가 존재하며 `Project`, `ProjectSummary`, `ProjectDetail`, `ProjectPeriod` 타입을 export한다
- [x] `NOTION_PROPERTY` 상수가 제목/요약/기술스택/GitHub 링크/데모 링크/썸네일/기간/대표 8개 속성명을 모두 매핑한다
- [x] `NotionBlockType` 유니온이 paragraph/heading_1~3/bulleted_list_item/numbered_list_item/code/image/quote/divider/callout/bookmark를 포함한다
- [x] `npx tsc --noEmit`이 에러 없이 통과한다
- [x] `NOTION_API_KEY`/`NOTION_DATABASE_ID`가 비어 있을 때 `src/env.ts` import 시 zod 검증이 명확히 실패함을 확인했다(임시 검증, 파일 변경 없음)
- [x] `npm run test:run`이 기존과 동일하게 통과한다 (회귀 없음)
- [x] `docs/ROADMAP.md`의 Task 002 제목에 완료 표시가 추가된다

## 구현 단계

1. `src/types/project.ts` 생성 — `ProjectPeriod`, `Project`, `ProjectSummary`(Pick 기반 축약), `ProjectDetail`, `NOTION_PROPERTY`, `NotionBlockType` 정의
2. `src/env.ts`/`.env.example`이 이미 요구사항을 충족하는지 확인만 하고 재작업하지 않음
3. `npx tsc --noEmit`으로 타입 컴파일 확인
4. Vitest 임시 테스트로 env 스키마가 필수값 누락 시 명확히 throw하는지 확인 후 임시 파일 삭제(영구 테스트 파일로 남기지 않음 — 순수 계약 정의 작업이라 테스트 체크리스트 비대상)
5. `npm run test:run` 실행하여 회귀 없음 확인
6. 본 작업 파일의 체크박스 및 변경 요약 갱신
7. `docs/ROADMAP.md`의 Task 002 제목에 `✅ - 완료` 및 `See: /tasks/002-domain-types-notion-contract.md` 추가

## 변경 요약

- `src/types/project.ts` 신규 생성: `ProjectPeriod`, `Project`(전체 필드 기준 타입), `ProjectSummary`(`Pick`으로 목록 카드용 필드만 축약, `featured`는 F003 선별 로직을 위해 포함), `ProjectDetail`(현재는 `Project`와 동일 — 본문은 별도 `getProjectBlocks()`로 조회하므로 타입에 포함하지 않음), `NOTION_PROPERTY`(8개 속성 매핑 상수), `NotionBlockType`(10개 지원 블록 유니온)을 정의
- `src/env.ts`, `.env.example`은 이전 커밋에서 이미 `NOTION_API_KEY`/`NOTION_DATABASE_ID` 서버 전용 스키마가 반영되어 있음을 확인만 하고 변경하지 않음
- `npx tsc --noEmit` 통과로 타입 계약에 컴파일 에러 없음을 확인
- env 스키마 검증: Vitest로 임시 테스트(`vi.stubEnv` + `vi.resetModules`)를 작성해 `NOTION_API_KEY`/`NOTION_DATABASE_ID`가 빈 문자열일 때 `src/env.ts` import가 "Invalid environment variables" 에러로 명확히 실패하고, 값이 있을 때는 정상 로드됨을 확인한 뒤 테스트 파일은 삭제(영구 테스트로 남기지 않음)
- `npm run test:run`(2 passed) 통과, 기존 기능 회귀 없음
- 이번 작업에서는 커밋을 생성하지 않았다(사용자 요청) — 변경 사항은 워킹 트리에 남아 있음
