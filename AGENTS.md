<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 테스트

- 유닛 테스트: `npm run test` (watch) / `npm run test:run` / `npm run test:coverage` — Vitest + React Testing Library
- E2E 테스트: `npm run test:e2e` / `npm run test:e2e:ui` — Playwright (`e2e/*.spec.ts`)
- 환경 규칙: `*.test.ts` → node 환경, `*.test.tsx` → jsdom 환경 (`vitest.config.mts`가 확장자로 분기)
- 레벨 판단: Route Handler / Server Action / proxy / 순수 로직은 유닛(node), 클라이언트 컴포넌트와 sync Server Component는 유닛(jsdom), async Server Component·layout 배선·캐시·테마 지속성·Base UI portal 상호작용은 E2E
- 테스트 작성·실행·실패 진단은 `.claude/agents/test-engineer.md` 서브에이전트에 위임할 수 있다
- 컴포넌트 테스트는 `src/test/utils.tsx`의 provider 포함 `render`를 재사용한다 (RTL 기본 `render`를 새로 import하지 않는다)
