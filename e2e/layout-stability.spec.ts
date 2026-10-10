import { expect, test } from "@playwright/test";

// 홈(긴 페이지)은 세로 스크롤바가 생기고 프로젝트 목록(짧은 페이지)은 생기지 않는 높이에서,
// 페이지를 오가도 헤더 위치가 흔들리지 않는지(html의 scrollbar-gutter) 검증한다.
// 실데이터에 의존하지 않도록 절대 좌표 대신 페이지 간 상대 비교만 한다.
// Playwright의 헤드리스 Chromium은 기본적으로 스크롤바를 숨겨(--hide-scrollbars) 이 문제를 재현할 수
// 없으므로, 이 파일에서만 해당 기본 플래그를 끈다.
test.use({
  viewport: { width: 1280, height: 1600 },
  launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] },
});

async function headerPositions(page: import("@playwright/test").Page) {
  const logo = await page.locator("header a").first().boundingBox();
  const toggle = await page.getByRole("button", { name: "테마 전환" }).boundingBox();
  expect(logo).not.toBeNull();
  expect(toggle).not.toBeNull();
  return { logoX: logo!.x, toggleRight: toggle!.x + toggle!.width };
}

test("페이지를 이동해도 헤더 위치가 같다 (스크롤바 유무 무관)", async ({ page }) => {
  await page.goto("/");
  const home = await headerPositions(page);

  await page.goto("/projects");
  const list = await headerPositions(page);

  await page.locator('a[href^="/projects/"]').first().click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  const detail = await headerPositions(page);

  expect(list).toEqual(home);
  expect(detail).toEqual(home);
});
