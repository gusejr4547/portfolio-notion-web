import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // 로컬 반복 속도를 위해 chromium 1개만 사용한다. 필요 시 devices["Desktop Firefox"] 등을
  // projects 배열에 추가하면 된다.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // 로컬 개발 루프에서는 dev 서버로 충분하다. CI에서 프로덕션 빌드 대상으로 검증하려면
    // command를 "npm run build && npm run start"로 바꾼다 (공식 문서 권장 사항).
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
