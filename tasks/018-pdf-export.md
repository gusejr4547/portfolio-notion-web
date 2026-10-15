# Task 018: PDF 내보내기 (F008)

> 직전 완료 작업: `tasks/017-ai-chat.md`, `tasks/016-bottom-nav.md`

## 고수준 명세서

포트폴리오를 제출용 PDF로 저장할 수 있게 한다. 사용자가 포함할 **프로젝트를 고르고, 순서를 정하고, 프로젝트별로 어떤 영역(썸네일·요약·기술 스택·링크·본문)을 넣을지** 정한 뒤 인쇄 창에서 "PDF로 저장"한다.

생성 방식은 세 가지를 비교해 **브라우저 인쇄(`window.print()`) + `@media print` CSS**로 정했다.

| 방식 | 판단 |
| --- | --- |
| 브라우저 인쇄 (채택) | PDF 생성에는 의존성이 없다. 벡터 텍스트라 선택·검색·링크 클릭이 되고 한글 품질이 좋다. Notion 이미지 URL(약 1시간 후 만료)도 화면에서 바로 쓰므로 문제없다. 인쇄 창에서 한 번 더 누르는 단계가 남는다 |
| 서버 생성 (Playwright) | 한 번에 다운로드되지만 서버리스 용량·실행 시간 제한과 이미지 URL 만료를 따로 처리해야 한다 |
| 클라이언트 캡처 (`html2canvas`+`jspdf`) | 텍스트가 이미지가 되어 선택·링크가 사라지고 용량이 커진다. 최신 CSS 색상 해석도 불안정하다 |

순서 변경은 처음에는 위/아래 버튼만 두었다가, 사용자 요청으로 **드래그 앤 드롭(`@dnd-kit`)을 추가**하고 버튼은 키보드·스크린리더 대체 수단으로 유지했다. 영역 선택은 프로젝트별 섹션 토글까지로 했다. Notion 블록 단위 선택은 범위 밖이다.

## 관련 파일

- `src/lib/export/selection.ts`, `selection.test.ts` (신규): 선택·순서·영역 상태의 순수 로직
- `src/app/export/page.tsx` (신규): 서버 페이지(`revalidate = 600`)
- `src/components/export/export-builder.tsx`, `export-builder.test.tsx` (신규): 설정 패널 + 미리보기
- `src/components/ui/checkbox.tsx` (신규): shadcn CLI로 추가
- `package.json`: `@dnd-kit/core`·`sortable`·`utilities`·`modifiers` (드래그 앤 드롭)
- `src/app/globals.css`: `@media print`
- `src/components/layout/bottom-nav.tsx`, `theme-toggle-corner.tsx`: `print:hidden`
- `src/app/projects/page.tsx`: "PDF로 내보내기" 버튼
- `e2e/export.spec.ts` (신규)
- `docs/PRD.md` (F008), `docs/ROADMAP.md` (Phase 9)

## 수락 기준

- [x] 프로젝트 목록의 "PDF로 내보내기" 버튼으로 `/export`에 들어간다
- [x] 프로젝트를 체크로 포함/제외하고 핸들 드래그 또는 위/아래 버튼으로 순서를 바꾸면 미리보기에 바로 반영된다
- [x] 프로젝트별로 썸네일·요약·기술 스택·링크·본문을 켜고 끌 수 있고, 프로필 포함 여부도 고를 수 있다
- [x] "PDF 저장"이 브라우저 인쇄를 호출한다
- [x] 인쇄 시 설정 패널·하단 독·테마 버튼이 숨겨지고 다크 테마에서도 흰 배경으로 출력된다
- [x] 선택 상태가 새로고침 후에도 복원되고, 삭제된 프로젝트는 무시, 새 프로젝트는 끝에 켜진 채로 추가된다
- [x] localStorage를 쓸 수 없어도(차단·비공개 창) 페이지가 동작한다
- [x] 외부 링크는 `toSafeUrl`을 거친다. 환경변수·Notion 필드 변경 없음
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run test:run`, `npm run test:e2e`가 통과한다
- [ ] 실제 인쇄 미리보기에서 페이지 나눔과 잘림 확인 (브라우저 자동화로는 인쇄 미리보기를 볼 수 없어 직접 확인 필요. 아래 "남은 확인" 참고)

## 구현 단계

- [x] 선택 상태 순수 로직과 유닛 테스트
- [x] 인쇄 CSS와 전역 UI(`BottomNav`, `ThemeToggleCorner`) 인쇄 숨김
- [x] `/export` 서버 페이지와 `ExportBuilder` (shadcn `checkbox` 추가 포함)
- [x] 목록 페이지 진입 버튼과 빌더 유닛 테스트
- [x] E2E와 문서(PRD·ROADMAP·작업 파일)

## 테스트 체크리스트

- [x] **선택 로직(node)**: 기본값, 위/아래 이동과 경계·없는 id, 프로젝트·섹션·프로필 토글, `normalize`(삭제된 id 제거·새 id 추가·형태 불일치 시 기본값), `serialize`/`parse` 왕복과 손상된 JSON
- [x] **빌더(jsdom)**: 기본 순서 렌더, 체크 해제 시 제거, 이동과 경계 버튼 비활성, 섹션·프로필 토글, `window.print` 호출, 저장 후 복원, 삭제된 id가 섞인 저장값 복원, `localStorage` 접근 실패
- [x] **E2E**: 목록 → `/export` 진입, 아래로 이동 시 미리보기 순서 변경, 핸들 마우스 드래그와 새로고침 후 유지, 키보드 이동, 요약 끄기·프로젝트 제외, 새로고침 후 순서 복원, 인쇄 미디어에서 패널·독 숨김과 흰 배경 (실데이터라 개수·제목을 하드코딩하지 않음)
- [x] **수동(Playwright MCP, 개발 서버)**: 콘솔 오류·경고 0건(하이드레이션 오류 없음), 순서·섹션 복원, 목록 버튼 이동

## 변경 사항 요약

- 상태는 **꺼진 것만 저장**한다(`hiddenProjects`, `hiddenSections`). 기본값이 전부 켜짐이라 새 프로젝트가 생겨도 마이그레이션이 필요 없다. 저장값은 zod로 검증하고 손상되면 기본값으로 돌아간다
- 본문(`NotionBlockRenderer`)과 프로필(`ProfileSection`)은 서버에서 렌더링해 슬롯으로 넘긴다. 블록 렌더러가 클라이언트 번들에 들어가지 않고, 홈과 같은 프로필 표현을 그대로 쓴다. 프로젝트별 `getProjectBlocks`는 기존 `unstable_cache`(600초)라 반복 비용이 낮다
- localStorage는 하이드레이션 이후 effect에서만 읽는다(#418 재발 방지). 복원 전에는 기본값을 저장소에 덮어쓰지 않도록 `restored` 플래그를 둔다
- 인쇄 CSS는 `:root, .dark`의 색상 토큰을 라이트 값으로 다시 정의해 다크 테마에서도 흰 배경으로 출력한다. 이미 주소가 글자로 보이는 링크에는 `export-link` 클래스를 붙여 인쇄 시 주소가 중복 표기되지 않게 한다
- **shadcn CLI 문제**: `npx shadcn add checkbox`가 `cn`을 `@/lib/utils`가 아닌 외부 npm 패키지 `cn`에서 가져오게 만들고 `package.json`에 추가했다. import를 `@/lib/utils`로 고치고 `package.json`·`package-lock.json` 변경은 되돌렸다
- **드래그 앤 드롭(추가 요청)**: `useSortable` 핸들(`GripVertical`)만 드래그를 시작하고, `PointerSensor`는 6px 이상 움직여야 시작해 체크박스·버튼 클릭과 겹치지 않는다. `KeyboardSensor`로 스페이스 → 방향키 → 스페이스 이동도 된다. `DndContext`의 `id`를 고정해 SSR/클라이언트 aria 속성 불일치(하이드레이션 오류)를 막았다. 순서 계산은 순수 함수 `moveItemTo`로 분리했다
- 검증: lint·`tsc`·`npm run test:run`(313개)·`npm run test:e2e`(46개 통과, 1개 건너뜀) 통과

### 남은 확인

- 실제 인쇄 미리보기(Chrome "PDF로 저장")에서 프로젝트마다 새 페이지로 시작하는지, 코드·이미지가 페이지 중간에서 잘리지 않는지, 링크가 PDF에서 클릭되는지 직접 확인한다
- 모바일 브라우저(특히 iOS Safari)는 인쇄 창에서 PDF 저장이 불편할 수 있다. 데스크톱 사용을 기준으로 만들었다
