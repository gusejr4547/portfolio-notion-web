# Task 006: Notion API 클라이언트 및 데이터 액세스 계층 구축

> 직전 완료 작업: `tasks/004-home-list-detail-pages-ui.md`, `tasks/003-project-common-components-mock-data.md`

## 고수준 명세서

Phase 3(Notion 연동 및 핵심 기능 구현)의 우선순위 작업으로, F001/F002/F003 실연동(Task007~009)의 선행 조건이 되는
Notion API 데이터 액세스 계층을 `src/lib/notion/`에 구축한다. `@notionhq/client`(v5.24.0)를 설치하고, 싱글턴
클라이언트/에러 분류/Notion 페이지→`Project` 매핑/`database_id`→`data_source_id` 해석/목록·단건·블록 조회
함수(캐싱 포함)를 구현한다.

`@notionhq/client` v5는 Notion API `2025-09-03` 버전부터 "data source" 개념이 도입되어 `databases.query`가
아닌 `dataSources.query`로 행(row)을 조회해야 하며, 그전에 `database_id`로 `data_source_id`를 먼저 해석하는
단계가 필요하다. 이는 원래 태스크 명세에 없던 사실이나 실제 SDK 타입 선언을 확인해 반영했다.

작업 규모가 커 Shrimp MCP(`plan_task`→`analyze_task`→`reflect_task`→`split_tasks`)로 6개 서브태스크
(Task006-1~6)로 세분화해 순차 진행했다. 이 작업은 **데이터 액세스 계층에 한정**되며, `src/app/**`에 실제로
연결하는 것은 Task007(목록)/Task008(홈 대표)/Task009(상세)의 몫이다. Task007/009는 이 계층이 export하는
`getProjects`/`getProjectById`/`getProjectBlocks` 3개 함수만 소비하면 된다.

## 관련 파일

- `src/lib/notion/errors.ts` (신규) — `NotionErrorKind`, `NotionDataAccessError`, `classifyNotionError()`
- `src/lib/notion/errors.test.ts` (신규)
- `src/lib/notion/mapper.ts` (신규) — `mapPageToProject()`
- `src/lib/notion/mapper.test.ts` (신규)
- `src/lib/notion/__fixtures__/notion-pages.fixtures.ts` (신규) — `mockProjects` 6건 미러 픽스처 + 결함 케이스
- `src/lib/notion/client.ts` (신규) — 싱글턴 `notion` 클라이언트
- `src/lib/notion/client.test.ts` (신규)
- `src/lib/notion/data-source.ts` (신규) — `getDataSourceId()`
- `src/lib/notion/data-source.test.ts` (신규)
- `src/lib/notion/projects.ts` (신규) — `getProjects()`/`getProjectById(id)`/`getProjectBlocks(id)`
- `src/lib/notion/projects.test.ts` (신규)
- `src/lib/notion/index.ts` (신규) — 공개 API 배럴
- `package.json` (수정) — `@notionhq/client` 의존성 추가
- `src/types/project.ts`, `src/env.ts`, `src/lib/mock/projects.ts` (참고, 변경 없음)

## 수락 기준

- [x] `src/lib/notion/errors.ts`에 `classifyNotionError()`가 SDK 에러(Unauthorized/RestrictedResource→auth,
      ObjectNotFound→not_found, RateLimited→rate_limited)와 비-SDK 에러(TypeError/네트워크 패턴→network,
      그 외→unknown)를 분류하고, 이미 분류된 에러는 idempotent하게 반환한다
- [x] `src/lib/notion/mapper.ts`의 `mapPageToProject()`가 `NOTION_PROPERTY` 상수로만 속성에 접근하며, title
      누락/빈값만 throw하고 나머지 필드(summary/techStack/githubUrl/demoUrl/thumbnailUrl/period/featured)는
      누락·타입 불일치 시 안전한 기본값으로 폴백한다
- [x] `src/lib/notion/client.ts`가 `env.NOTION_API_KEY`와 고정 `notionVersion`으로 구성된 싱글턴 `Client`
      인스턴스를 모듈 스코프로 export한다
- [x] `src/lib/notion/data-source.ts`의 `getDataSourceId()`가 `database_id`로 `data_source_id`를 해석하고
      `unstable_cache`(revalidate 86400)로 캐싱하며, 실패 시 `classifyNotionError`로 분류된 에러를 던진다
- [x] `src/lib/notion/projects.ts`의 `getProjects()`가 커서 페이지네이션으로 100건 초과 목록을 전부 수집하고
      개별 페이지 매핑 실패는 skip(전체 실패 방지)한다
- [x] `getProjectById(id)`가 단건 조회 시 매핑 실패를 그대로 전파하고, `getProjectBlocks(id)`가 페이지
      본문 블록을 커서 페이지네이션으로 수집하며 `isFullBlock`으로 partial 블록을 걸러낸다
- [x] `getProjects`/`getProjectById`/`getProjectBlocks` 모두 `unstable_cache`(revalidate 3600)로 캐싱된다
- [x] `src/lib/notion/index.ts`가 공개 API(`getProjects`/`getProjectById`/`getProjectBlocks`/
      `NotionDataAccessError`/`NotionErrorKind`)를 배럴 re-export한다
- [x] `npm run test:run`과 `npm run build`가 모두 통과한다
- [x] `docs/ROADMAP.md`의 Task 006 제목에 완료 표시가 추가된다

## 테스트 체크리스트

Notion API 연동 작업이므로 SDK 모킹 기반 유닛 테스트로 아래 케이스를 커버했다(node 환경, `*.test.ts`).

- [x] **100건 초과 페이지네이션**: `projects.test.ts`에서 `dataSources.query`를 2회(50건+60건=110건) 응답하도록
      모킹해 커서(`start_cursor`)를 따라 전체 수집됨을 검증. `blocks.children.list`도 동일 패턴으로 검증
- [x] **필드 누락/타입 불일치 방어**: `mapper.test.ts`에서 title 없음/빈값(throw), techStack 타입 불일치,
      summary 없음, url null, 썸네일 file 타입/빈 배열, 기간 키 없음, featured 타입 불일치를 각각 검증
      (6개 기본 케이스는 `mockProjects`와 `toEqual`, 8개 결함 케이스는 개별 폴백값 검증)
- [x] **권한 오류(401/403)**: `errors.test.ts`/`data-source.test.ts`/`projects.test.ts`에서 실제
      `APIResponseError`(`APIErrorCode.Unauthorized`/`RestrictedResource`)로 `kind: "auth"` 분류 검증
- [x] **404(ObjectNotFound)**: `projects.test.ts`의 `getProjectById`에서 `kind: "not_found"` 분류 검증
- [x] **레이트리밋(429)**: `errors.test.ts`/`projects.test.ts`에서 `APIErrorCode.RateLimited`로
      `kind: "rate_limited"` 분류 검증
- [x] **네트워크 실패**: `errors.test.ts`/`data-source.test.ts`/`projects.test.ts`에서 순수 `TypeError`로
      `kind: "network"` 분류 검증
- [x] **개별 매핑 실패 skip**: `projects.test.ts`에서 목록 중 1건(`pageMissingTitle`)이 매핑 실패해도
      나머지는 정상 반환됨을 검증
- [x] **비페이지/partial 결과 필터링**: `projects.test.ts`에서 `isFullPage`/`isFullBlock`이 데이터소스
      참조·partial block을 걸러냄을 검증
- [x] **캐시 재검증 전략**: `unstable_cache` 사용이 Next.js 16 "Previous Model"(`cacheComponents` 미사용)에
      부합함을 실제 SDK/Next.js 타입 선언으로 확인. 테스트에서는 `vi.mock("next/cache", ...)`로 identity
      passthrough 처리해 렌더링 컨텍스트 부재로 인한 invariant 에러를 회피

## 구현 단계

Shrimp MCP로 6개 서브태스크로 세분화해 순차 실행했다(각 서브태스크 `execute_task`→구현→`verify_task`).

1. **Task006-1** — 에러 분류 계층(`errors.ts`+test). 커밋 `b192c5a`
2. **Task006-2** — Notion 페이지→Project 매퍼(`mapper.ts`+test+fixtures). 커밋 `f3c92e9`
3. **Task006-3** — `@notionhq/client` 설치 및 싱글턴 클라이언트(`client.ts`+test). 커밋 `1bf7bce`
4. **Task006-4** — `database_id`→`data_source_id` 해석(`data-source.ts`+test). 커밋 `45073a3`
5. **Task006-5** — 조회 함수 및 캐싱(`projects.ts`+`index.ts`+test). 커밋 `62b697f`
6. **Task006-6** — 통합 검증 및 문서화(현재 작업)

## 변경 요약

- `@notionhq/client`(v5.24.0) 설치. `databases.query`가 아닌 `dataSources.query` 기반 v5 API 사용, 그 전에
  `databases.retrieve()`로 `data_source_id`를 해석하는 단계가 필요함을 실제 SDK 타입 선언으로 확인해 반영
- `src/lib/notion/` 아래 6개 모듈(`errors`/`mapper`/`client`/`data-source`/`projects`/`index`)과
  `__fixtures__/notion-pages.fixtures.ts`를 신규 구현
- 모든 공개 함수의 에러는 `NotionDataAccessError`(kind: auth/not_found/rate_limited/network/invalid_data/
  unknown)로 통일해 Task007~009가 예측 가능한 방식으로 처리할 수 있게 함
- Next.js 16 "Previous Model" 캐싱(`unstable_cache`)을 적용: 프로젝트 콘텐츠는 revalidate 3600(1시간),
  `data_source_id`(스키마급 메타데이터)는 86400(24시간). 세부 튜닝은 Task011로 위임
- `src/app/**`는 전혀 수정하지 않음 — 이 계층을 실제 페이지에 연결하는 것은 Task007~009의 몫

### 검증 결과

- `npm run test:run`: 11개 테스트 파일, 50개 테스트 전부 통과(회귀 없음)
- `npm run build`: Turbopack 프로덕션 빌드 성공, 타입 체크 통과(`NOTION_DATABASE_ID`가 로컬에 비어있어
  검증 시 임시 환경변수를 인라인으로만 부여해 빌드했으며 `.env.local`에는 저장하지 않음 — 실제 값 설정은
  Task012 배포 작업의 몫). `/lib/notion/**`는 아직 어떤 라우트에서도 참조되지 않으므로 빌드 결과물에는
  포함되지 않지만, 타입 체크 전체 파이프라인은 정상 통과함을 확인
- Playwright MCP 검증은 이번 작업에서 생략함 — `src/app/**`를 전혀 수정하지 않아 화면상 확인할 대상이
  없고(Task007~009에서 실제 연결 시 Playwright MCP로 검증 예정), 순수 데이터 액세스 계층은
  `npm run test:run`(유닛)로 충분히 커버됨
