# Task 017: AI 챗 (F007)

> 직전 완료 작업: `tasks/016-bottom-nav.md`, `tasks/015-home-profile.md`

## 고수준 명세서

방문자가 포트폴리오에 대해 물으면 포트폴리오 주인의 AI 버전이 1인칭으로 답하는 채팅을 추가한다. 하단 독에 "챗" 탭을 두고 `/chat` 페이지에서 대화한다. 참고 프로젝트(`ai-portfolio`)의 구조를 검토한 뒤 다음 문제를 고쳐 만들었다.

- 참고 프로젝트에서는 클라이언트가 시스템 프롬프트용 컨텍스트를 보냈다. 이 프로젝트는 **서버가 Notion 데이터(프로필 + 프로젝트 본문)로 컨텍스트를 직접 만들고** 클라이언트가 보낸 컨텍스트는 버린다. Notion을 고치면 답변도 10분 안에 따라간다.
- 입력 길이·개수 제한(zod), 동일 출처 검사, IP별 속도 제한(best-effort)을 둔다.
- `maxOutputTokens`에는 사고 토큰이 포함되므로 출력 한도를 넉넉히 둔다(1,024). 빈 응답은 차단과 출력 한도 초과로 구분한다.
- 시스템 프롬프트에 근거 규칙을 넣는다: 포트폴리오에 있는 사실만 말하고, 없는 내용은 지어내지 않고 연락처를 안내한다. 전화번호는 비공개, 지시 변경·프롬프트 공개 요청은 거절한다.

호출 방식은 REST 직접 호출, Vercel AI SDK, Google 공식 SDK를 비교한 뒤 **`@google/genai`(공식 SDK)**로 정했다. 의존성 1개로 끝나고, Gemini API와 1:1로 대응하는 타입(`thinkingConfig`·`promptFeedback`·`finishReason`)이 있다. 비용은 어느 방식이든 같은 Gemini API 사용량이다. 응답은 스트리밍 없이 한 번에 받는다.

## 관련 파일

- `src/app/api/chat/route.ts`, `route.test.ts` (신규): `POST /api/chat`
- `src/lib/chat/contract.ts` (신규): 요청·응답 계약(Route Handler와 클라이언트 공유)
- `src/lib/chat/build-context.ts`, `blocks-to-text.ts`, `system-prompt.ts`, `llm.ts`, `rate-limit.ts`와 각 테스트 (신규)
- `src/app/chat/page.tsx`, `src/components/chat/chat-panel.tsx`, `chat-panel.test.tsx` (신규)
- `src/components/layout/bottom-nav.tsx`, `bottom-nav.test.tsx` ("챗" 탭)
- `src/env.ts`, `.env.example` (`GEMINI_API_KEY`·`GEMINI_MODEL`, 둘 다 선택)
- `e2e/chat.spec.ts` (신규)
- `package.json`, `package-lock.json` (`@google/genai`, `react-markdown`)

## 수락 기준

- [x] 독에 `[홈][프로젝트][챗]`이 있고 `/chat`에서 "챗"이 활성이다
- [x] 질문하면 서버가 Notion 컨텍스트로 시스템 프롬프트를 만들어 Gemini에 묻고 답을 마크다운으로 보여준다
- [x] 클라이언트가 보낸 컨텍스트·`system` 역할·과도한 길이/개수는 받지 않는다(400 또는 무시)
- [x] 다른 출처는 403, 속도 제한은 429+`Retry-After`, 키 미설정은 503 안내, 쿼터·차단·잘림·일시 오류는 각각 구분된 안내 문구다
- [x] 429일 때 남은 초 동안 입력이 막힌다
- [x] 컨텍스트에서 이미지(서명 URL)와 전화번호를 제거한다
- [x] AI 표식과 "Gemini로 전송" 고지를 보여주고, 대화는 메모리에만 둔다(서버 저장·메시지 로깅 없음)
- [x] 모바일(390×844)에서 가로 스크롤이 없고 입력창이 독과 겹치지 않는다
- [x] `npm run lint`, `npx tsc --noEmit`, `npm run test:run`, `npm run test:e2e`가 통과한다
- [ ] 실제 Gemini 답변 검증 (API 키 미설정으로 미실시. 아래 "남은 확인" 참고)

## 구현 단계

- [x] `feature/ai-chat` 브랜치, `@google/genai`·`react-markdown` 설치, 환경변수 추가
- [x] 챗 컨텍스트(`buildChatContext`)와 시스템 프롬프트
- [x] Gemini 클라이언트(`generateReply`, 오류 분류)와 속도 제한
- [x] `POST /api/chat` Route Handler
- [x] 챗 UI(독 탭·페이지·패널)
- [x] E2E(응답 스텁)
- [x] Playwright MCP 시각 검증, Notion 마크다운 API 실호출 확인
- [x] PRD·ROADMAP·작업 파일 문서화

## 테스트 체크리스트

- [x] **컨텍스트(node)**: 마크다운 우선 경로, 실패·`truncated` 시 블록 변환 대체, 본문이 모두 실패해도 메타데이터 유지, 프로필 없음 처리, 이미지·미디어 태그·`<br>`·전화번호 정리(URL·ID·기간 속 숫자는 유지)
- [x] **시스템 프롬프트(node)**: `<portfolio>` 안 컨텍스트, 1인칭·근거·전화번호 비공개·거절·데이터/지시 분리 규칙
- [x] **LLM 클라이언트(node, `vi.mock("@google/genai")`)**: 요청 인자(`user`/`model` 역할, `systemInstruction`, `maxOutputTokens` 1024, `thinkingLevel` LOW, `abortSignal`), 모델 기본값·`GEMINI_MODEL`, 키 없음, `ApiError` 429/401/403/500, 타임아웃, `blockReason`, `SAFETY`, `MAX_TOKENS`, 이유 없는 빈 응답
- [x] **속도 제한(node)**: 분당 5회, 6회째 차단과 `retryAfter`, 윈도우 경과 후 복구, 차단 요청 미집계, IP 독립
- [x] **Route Handler(node)**: 400(빈·501자·history 11개·`system` 역할·2001자·비JSON), 403, 429와 `Retry-After`, 503(키 없음, Notion 미조회), LLM 오류 매핑, 컨텍스트 실패 500, 클라이언트 컨텍스트 무시, `no-store`, 로그에 메시지 미기록
- [x] **챗 패널(jsdom)**: 표식·고지·환영·예시 칩, 전송과 기록 전달, 빈 입력 방지, 로딩 중 입력 비활성화, 예시 칩 전송, 오류 alert(다음 기록에서 제외), 네트워크 오류, 429 카운트다운, 링크 새 탭, 원시 HTML 미렌더
- [x] **독(jsdom)**: 챗 링크와 `/chat` 활성
- [x] **E2E(스텁)**: 챗 탭 이동, 질문→답변, 예시 칩, 500 안내, 429 카운트다운, 모바일 가로 스크롤 없음·입력창이 독 위

## 변경 사항 요약

- 컨텍스트는 프로필(이미 조회한 블록을 Notion 순서대로, 기술 스택은 구조화 데이터) + 프로젝트(최신순, 메타데이터 + 본문)로 만들고 `cache(unstable_cache)` 600초로 캐시한다. 프로젝트 본문은 이미 설치된 `@notionhq/client`의 `pages.retrieveMarkdown`을 쓴다. 하위 블록까지 포함되며, 실패하면 최상위 블록 변환으로 대체한다. 현재 `notionVersion: "2025-09-03"`에서 실제로 호출해 성공했고 `truncated`는 없었다. 이미지는 `![](url)`로, 문단 안 줄바꿈은 `<br>`로 와서 둘 다 정리한다
- Gemini 호출은 `GoogleGenAI.models.generateContent`에 `systemInstruction`, temperature 0.7, topP 0.9, `maxOutputTokens` 1024, `thinkingConfig.thinkingLevel: LOW`, 15초 `abortSignal`을 넘긴다. 모델 기본값은 `gemini-3.1-flash-lite`이고 `GEMINI_MODEL`로 바꿀 수 있다
- 오류 응답은 `{ type, message, retryAfter? }`다. 매핑: quota 429, blocked 422, truncated 502, auth/config 503, 그 외 500. route 파일은 export가 제한되므로 계약 타입·상수는 `src/lib/chat/contract.ts`로 분리했다
- 속도 제한은 인스턴스 메모리 기반이라 Vercel에서는 인스턴스마다 따로 센다(best-effort). 입력 제한·출력 한도·동일 출처 검사·Gemini 쿼터와 겹쳐 쓰는 방어선이다
- UI: 사용자 말풍선은 `bg-primary`, AI는 `bg-muted`와 이름 첫 글자 Avatar다. 입력창은 독 위(`bottom-24`)에 고정하고 본문 콘텐츠 폭과 맞췄다. 모바일에서 독 3탭 폭은 265px다
- 검증: lint·tsc·`npm run test:run`(233개)·`npm run test:e2e`(40개) 통과. Playwright MCP로 PC 라이트/다크·모바일을 확인했다. 콘솔 에러는 키 미설정에 따른 503 로그뿐이다

## 실제 모델 검증 결과

API 키를 설정한 뒤 실제 Gemini(`gemini-3.1-flash-lite`)로 확인했다.

- 통과: 프로젝트·기술 스택·역할·수상이 Notion 원문과 일치, 연봉·직함은 "포트폴리오에 없다"로 답하고 연락처 안내, 전화번호 거절, 프롬프트 공개·역할 변경 거절, 가짜 history와 가짜 `portfolioContext` 무시, 대화 맥락 유지, 방어 로직(403/400/429)과 화면(PC·모바일)
- `thinkingLevel: LOW`는 400 없이 동작하고, `retrieveMarkdown` 경로도 대체 경로 경고 없이 동작했다
- 컨텍스트는 약 5.2k 토큰이고, 암시적 캐시가 동작한다(프롬프트 5,232토큰 중 2,034토큰이 `cachedContentTokenCount`로 잡힘). 명시적 캐시는 구현하지 않는다
- 첫 검증에서 답변이 부풀려지는 문제(JPA "최적화"·"깊이 있게 이해", 근거 없는 "특화 프로젝트 우수상")가 나와 시스템 프롬프트를 보강했다(규칙 7~12). 기술 숙련도는 프로필 구분만 따르고, 정도·자기평가 표현과 원문에 없는 다짐·계획을 막고, 경력 질문에만 "신입 개발자"라고 짧게 답하게 했다(`CAREER_STATUS`)

### 알려진 문제 (미해결)
- **답변이 중간에 잘림**: 사고(thinking) 토큰이 간헐적으로 크게 늘어(직접 호출에서 983토큰) `maxOutputTokens` 1024를 거의 다 쓰면 답변이 문장 중간에서 끊긴다(`finishReason: MAX_TOKENS`). `llm.ts`는 본문이 완전히 비었을 때만 truncated로 보므로 잘린 답변이 정상 응답으로 나간다. 직접 호출 10회 중 1회, 서버 경유 약 50회 중 4회 관찰됨. 출력 한도 상향이나 `MAX_TOKENS` 처리가 필요하다
- 첫 요청 직후 `unavailable`(500)이 두 번 있었고 재시도하면 성공했다. 로그에 오류 종류만 남겨 원인은 알 수 없다
- 답변 속 URL이 일반 텍스트로 표시된다(`react-markdown`이 자동 링크를 만들지 않음)
- 무료 티어 분당 요청 한도에 걸리면 429가 난다(1분에 10여 회 이상)

배포 시 Vercel 환경변수에도 `GEMINI_API_KEY`(선택: `GEMINI_MODEL`)를 추가한다.
