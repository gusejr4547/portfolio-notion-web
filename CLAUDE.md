**포트폴리오**는 Notion에 정리해 둔 프로젝트 정보를 웹에서 프로젝트 소개형 포트폴리오로 보여주는 사이트입니다.

📋 요구사항: docs/PRD.md / 🗺️ 로드맵·진행 상황: docs/ROADMAP.md (작업 전 해당 Task 확인)

@AGENTS.md

## 작업 흐름
- 작업 계획은 `docs/ROADMAP.md` + `tasks/XXX-*.md` 체계를 따른다. Task Master(`.taskmaster/`)는 사용하지 않는다.
- Task 완료 시: `tasks/XXX-*.md` 체크박스·변경 요약, ROADMAP의 Task 제목에 `✅ - 완료`와 `See: /tasks/XXX-*.md` 추가.

## 규칙
- 환경변수를 추가하면 `src/env.ts` 스키마와 `.env.example`을 함께 고친다. 필수는 `NOTION_API_KEY`, `NOTION_DATABASE_ID`.
- `src/app/layout.tsx`의 provider 트리를 바꾸면 `src/test/utils.tsx`의 `AllProviders`도 동일하게 맞춘다.
- Notion DB 필드를 바꾸면 `docs/PRD.md` 데이터 모델, `src/types/project.ts`, 속성명 매핑 상수를 함께 갱신한다.
- 페이지는 ISR(`revalidate = 600`)이고 Notion 조회는 `cache(unstable_cache(...))`로 감싼다. 새 조회도 같은 방식을 쓴다.
- E2E는 실제 Notion 데이터를 쓰므로 프로젝트 개수·태그명을 하드코딩하지 않는다.
- 보안: 외부(Notion) URL은 `toSafeUrl`(`src/lib/safe-url.ts`)을 거쳐 렌더링한다.
- 커밋 메시지는 한국어, `<이모지> <타입>: <설명>` 형식(`/commit`). Claude 서명은 붙이지 않는다.
