import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// 규칙: 파일 확장자가 곧 실행 환경을 결정한다.
//   *.test.ts  -> node    (Route Handler, Server Action, proxy, 순수 로직)
//   *.test.tsx -> jsdom   (컴포넌트)
// 예외가 필요하면 파일 최상단에 `// @vitest-environment <env>` docblock으로 오버라이드한다.
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { tsconfigPaths: true },
        plugins: [react()],
        test: {
          name: "unit-jsdom",
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          include: ["src/**/*.test.tsx"],
          globals: true,
        },
      },
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "unit-node",
          environment: "node",
          include: ["src/**/*.test.ts", "app/**/*.test.ts", "proxy.test.ts"],
          globals: true,
        },
      },
    ],
    // e2e/**는 Playwright(@playwright/test) 전용이다. include 글롭이 확장자(.spec.ts)와
    // 디렉터리로 이미 분리되어 있지만, 방어적으로 명시해 둔다.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});
