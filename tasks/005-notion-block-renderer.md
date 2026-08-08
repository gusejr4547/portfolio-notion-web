# Task 005: Notion 블록 렌더러 컴포넌트 구현

> 직전 완료 작업: `tasks/004-home-list-detail-pages-ui.md`, `tasks/003-project-common-components-mock-data.md`

## 고수준 명세서

`getProjectBlocks(id)`(Task006 산출물)가 반환하는 원시 Notion `BlockObjectResponse[]`를 받아
paragraph/heading_1~3/bulleted·numbered list/code/image/quote/divider/callout/bookmark
12종을 렌더링하는 컴포넌트를 구현한다. rich text의 bold/italic/strikethrough/code 어노테이션과
link(href)를 처리하고, 지원하지 않는 블록 타입은 렌더링을 중단하지 않고 안전하게 무시한다.

- 입력 타입은 `@notionhq/client`의 `BlockObjectResponse[]`를 그대로 사용하고 자체 도메인 타입으로
  재매핑하지 않는다 (`getProjectBlocks`가 이미 이 SDK 타입을 반환)
- `getProjectBlocks`는 `has_children`인 블록의 자식을 재귀 조회하지 않으므로 렌더러는 flat 배열만
  다룬다
- Notion API가 `bulleted_list_item`/`numbered_list_item`을 개별 형제 블록으로 반환하고 `<ul>`로
  감싸주지 않으므로, 연속된 동일 타입 리스트 아이템을 하나의 렌더 단위로 묶는 순수 그룹핑 함수를
  별도로 둔다
- 상세 페이지가 이미 `h1`(제목)/`h2`("소개")를 사용하므로 Notion `heading_1/2/3`은 한 단계 낮춰
  `h3/h4/h5`로 매핑해 문서 아웃라인을 보존한다
- `@tailwindcss/typography`(prose) 플러그인은 설치하지 않고 각 블록 컴포넌트에서 Tailwind
  유틸리티 클래스를 직접 조합한다 (`globals.css` 변경 없음)
- `src/app/projects/[id]/page.tsx` 실연동(Notion 데이터로 `NotionBlockRenderer` 배선)은 Task009
  범위이므로 이번 작업에서 제외한다 — ROADMAP Task009 항목에 "상세 데이터와 본문 블록을 실제
  조회로 교체"가 명시되어 있고, `page.tsx`의 기존 `TODO(Task005/009)` 주석도 이를 뒷받침한다

## 관련 파일

- `src/components/notion/notion-block-renderer.tsx` (신규) — 최상위: 그룹핑 → `switch` 디스패치,
  `divider`는 `<Separator />` 인라인 처리, 미지원 타입은 `default: return null`
- `src/components/notion/group-blocks.ts` (신규) — 순수 함수, flat 블록 배열 → `RenderItem[]`
- `src/components/notion/rich-text.tsx` (신규) — annotations + href 렌더링 공통 컴포넌트
- `src/components/notion/text-blocks.tsx` (신규) — Paragraph/Heading/Quote
- `src/components/notion/list-blocks.tsx` (신규) — BulletedList/NumberedList
- `src/components/notion/code-block.tsx`, `image-block.tsx`, `callout-block.tsx`,
  `bookmark-block.tsx` (신규)
- `src/components/notion/*.test.ts(x)` (신규) — 각 소스 파일과 동일 디렉토리에 배치된 유닛 테스트
- `src/lib/notion/__fixtures__/notion-blocks.fixtures.ts` (신규) — 12종 + 미지원 블록 팩토리,
  어노테이션/리스트 그룹핑/image·callout 분기 픽스처
- `src/lib/notion/mapper.ts` (참고, 변경 없음) — `extractThumbnail`의 external/file 판별 패턴 재사용
- `src/components/ui/separator.tsx` (참고, 변경 없음) — divider 렌더링에 그대로 사용
- `src/app/projects/[id]/page.tsx` (참고, 변경 없음) — Task009에서 연결 예정
- `docs/ROADMAP.md` (수정) — 완료 표시 및 작업 파일 참조 추가

## 수락 기준

- [x] paragraph/heading_1~3/bulleted_list_item/numbered_list_item/code/image/quote/divider/
      callout/bookmark 12종 각각에 대한 렌더링 테스트가 존재한다
- [x] rich text의 bold/italic/strikethrough/code 어노테이션과 link(href)가 개별 및 조합으로
      정확히 렌더된다 (링크는 `target="_blank" rel="noopener noreferrer"`)
- [x] 지원하지 않는 블록 타입(예: `table`)이 섞여도 렌더링이 중단되지 않고, 그 앞뒤의 지원 블록은
      정상적으로 함께 렌더된다
- [x] 연속된 `bulleted_list_item`/`numbered_list_item`이 하나의 `<ul>`/`<ol>`로 그룹핑되고, 다른
      블록이 중간에 끼면 그룹이 분리되어 별도의 `<ul>`/`<ol>`이 생성된다
- [x] `heading_1/2/3`이 `h3/h4/h5`로 매핑되어 상세 페이지의 기존 `h1`/`h2`와 헤딩 레벨이 충돌하지
      않는다
- [x] `src/app/projects/[id]/page.tsx`는 수정되지 않았다 (Task009 범위로 명확히 분리)
- [x] `globals.css`와 `src/lib/mock/projects.ts`는 수정되지 않았다
- [x] `npm run test:run`이 신규 테스트를 포함해 전부 통과한다 (회귀 없음)
- [x] `npm run lint`가 에러 없이 통과한다
- [x] `docs/ROADMAP.md`의 Task 005 제목에 완료 표시가 추가된다

## 구현 단계

1. `src/lib/notion/__fixtures__/notion-blocks.fixtures.ts` 작성 — 12종 + 미지원(`table`) 블록
   팩토리, 어노테이션 조합 rich text, 연속/중단 리스트 케이스, image external/file 분기, callout
   icon 3분기(null/emoji/external), 전체 문서 시나리오(`mockNotionBlocks`)
2. `rich-text.tsx` + `rich-text.test.tsx` 구현 — annotations를 `cn()` 클래스 조합으로, href는
   `next/link`(새 탭)로 처리
3. `group-blocks.ts` + `group-blocks.test.ts`(node) 구현 — 연속 리스트 아이템 그룹핑 순수 함수
4. `text-blocks.tsx` → `list-blocks.tsx` → `code-block.tsx` → `image-block.tsx` →
   `callout-block.tsx` → `bookmark-block.tsx` 순서로 구현, 각 단계마다 해당 테스트 실행
5. `notion-block-renderer.tsx` + `notion-block-renderer.test.tsx` — 위 컴포넌트 전체를 조립하는
   최상위 디스패처, `mockNotionBlocks` 통합 렌더/미지원 블록 fallback/리스트 그룹핑 DOM 검증
6. `npm run test:run` 전체 통과, `npm run lint` 통과 확인
7. 본 작업 파일의 체크박스 및 변경 요약 갱신
8. `docs/ROADMAP.md`의 Task 005 제목에 `✅ - 완료` 및
   `See: /tasks/005-notion-block-renderer.md` 추가

## 변경 요약

- `src/components/notion/` 신규 디렉토리에 9개 소스 파일 + 9개 테스트 파일 작성. `NotionBlockRenderer`가
  최상위 진입점으로 `group-blocks.ts`의 `groupBlocksForRendering()`으로 flat 블록 배열을 리스트
  그룹까지 포함한 `RenderItem[]`로 변환한 뒤 `switch (block.type)`으로 각 블록 컴포넌트에 위임한다.
  `divider`는 별도 파일 없이 `<Separator />`(`@/components/ui/separator`)로 인라인 처리했고,
  지원하지 않는 타입은 `default: return null` + 개발 모드 `console.warn` 한 줄로 처리했다.
- `RichText`(`rich-text.tsx`)는 각 rich text 아이템을 flat boolean(`bold`/`italic`/`strikethrough`/
  `code`) 조합의 단일 span으로 렌더하고, `href`가 있으면 `next/link`의 `Link`(`target="_blank"
  rel="noopener noreferrer"`)로 감쌌다. `color`/`underline`은 요구사항 범위 밖으로 명시적으로
  제외했다.
- `HeadingBlock`(`text-blocks.tsx`)은 `heading_1→h3`, `heading_2→h4`, `heading_3→h5`로 한 단계
  낮춰 매핑해 상세 페이지의 기존 `h1`(제목)/`h2`(소개)와 헤딩 레벨 충돌을 피했다.
- `ImageBlock`/`CalloutBlock`은 `mapper.ts`의 `extractThumbnail`과 동일한 external/file 판별
  패턴을 재사용했고, `CalloutBlock`은 icon이 emoji/external/file/null 네 가지 형태를 모두
  안전하게 처리한다.
- `src/lib/notion/__fixtures__/notion-blocks.fixtures.ts`에 12종 지원 블록 + 미지원(`table`) 팩토리,
  어노테이션 조합 샘플, 연속/중단 리스트 케이스, image external/file, callout icon 3분기, 전체
  문서 시나리오(`mockNotionBlocks`)를 작성했다. 기존 `src/lib/notion/projects.test.ts`의
  `createFullParagraphBlock` 패턴(공통 envelope 필드 + `as BlockObjectResponse` 캐스팅)을
  일반화했다.
- `src/app/projects/[id]/page.tsx`, `globals.css`, `src/lib/mock/projects.ts`는 계획대로
  수정하지 않았다.

### 검증 결과

- `npm run test:run`: 20개 테스트 파일, 84개 테스트 전부 통과 (신규 8개 파일 33개 테스트 포함,
  기존 스위트 회귀 없음).
- `npm run lint`: 에러 0건. 경고 6건은 모두 기존에 있던 `<img>` LCP 권고 경고 계열(신규 파일
  `image-block.tsx`/`callout-block.tsx` 포함, `next/image` 전환은 Task011 최적화 범위)이며
  이번 작업과 무관한 `page.tsx`의 기존 `no-unused-vars` 경고 1건도 포함되어 있다.
- `npx tsc --noEmit`: 타입 에러 없음.
- `npm run build`는 로컬 `.env.local`의 `NOTION_DATABASE_ID`가 비어 있어 `src/env.ts`의 zod 검증
  단계에서 실행되지 않았다 — Task005 변경과 무관한 기존 로컬 환경설정 이슈이며, Task012(배포)에서
  실제 환경변수가 설정되면 해소된다.
- `page.tsx`가 아직 `NotionBlockRenderer`를 사용하지 않아(Task009 범위) Playwright MCP로 실제
  라우트를 통한 화면 검증은 수행하지 않았다. 이번 작업은 라우트/페이지를 건드리지 않아 기존
  `e2e/*.spec.ts` 플로우에 영향이 없으므로 `npm run test:e2e`는 별도로 실행하지 않았다.
