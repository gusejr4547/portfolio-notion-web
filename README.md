# Next.js Starter Kit

빠르게 웹 개발을 시작하기 위한 핵심 기반 스타터킷입니다.

## 기술 스택

- [Next.js 16](https://nextjs.org) (App Router, Turbopack 기본)
- TypeScript
- Tailwind CSS v4 (CSS-first 설정)
- [shadcn/ui](https://ui.shadcn.com) — `base-nova` 스타일, [Base UI](https://base-ui.com) 프리미티브 기반
- [next-themes](https://github.com/pacocoursey/next-themes) — 다크모드
- [lucide-react](https://lucide.dev) — 아이콘

> ⚠️ 이 프로젝트는 표준 Next.js와 다른 부분(Turbopack 기본, 비동기 API 전면화, `middleware` → `proxy`, `next lint` 제거 등)이 있는 최신 Next.js 16입니다. 새 기능을 추가하기 전에 `AGENTS.md`와 `node_modules/next/dist/docs/`를 참고하세요.

## Getting Started

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다. 개발 서버와 빌드는 기본적으로 Turbopack을 사용합니다.

## 폴더 구조

| 경로                    | 설명                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `src/app`               | App Router 페이지/레이아웃                                                                 |
| `src/components/ui`     | shadcn CLI로 관리되는 프리미티브 컴포넌트 (직접 스타일을 고치기보다 CLI로 재설치/업데이트) |
| `src/components/layout` | `Header`, `Footer` 등 레이아웃 컴포넌트                                                    |
| `src/components` (루트) | `ThemeProvider`, `ModeToggle` 등 앱 전역 컴포넌트                                          |
| `src/hooks`             | 커스텀 훅 (필요 시 shadcn 컴포넌트가 자동 생성)                                            |
| `src/lib`               | `cn()` 등 유틸리티                                                                         |

## 다크모드

`next-themes`로 라이트 / 다크 / 시스템 3단 테마를 지원합니다. `globals.css`의 `.dark` 클래스 기반 테마 변수를 그대로 사용하며, `src/components/theme-provider.tsx`가 앱 전체를 감싸고 우측 상단 `ModeToggle`(`src/components/mode-toggle.tsx`)로 전환합니다.

## shadcn 컴포넌트 추가하기

```bash
npx shadcn add <component-name>
```

`components.json`의 `style: "base-nova"` 설정을 그대로 사용해 기존 컴포넌트와 일관된 스타일로 생성됩니다. 만약 특정 컴포넌트가 `base-nova` 레지스트리에 없어 CLI가 실패하면, `src/components/ui/button.tsx`의 패턴(`@base-ui/react/<primitive>` + `cva` + `cn` + `data-slot`)을 참고해 직접 작성하세요.

## 스크립트

| 명령어          | 설명                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `npm run dev`   | 개발 서버 실행 (Turbopack)                                             |
| `npm run build` | 프로덕션 빌드                                                          |
| `npm run start` | 프로덕션 서버 실행                                                     |
| `npm run lint`  | ESLint 실행 (`next lint`는 Next.js 16에서 제거되어 bare `eslint` 사용) |
