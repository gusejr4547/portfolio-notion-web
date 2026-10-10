import { expect, test } from "@playwright/test";

// 홈(긴 페이지)은 세로 스크롤바가 생기고 프로젝트 목록(짧은 페이지)은 생기지 않는 높이에서,
// 페이지를 오가도 하단 독의 위치가 흔들리지 않는지(html의 scrollbar-gutter) 검증한다.
// 실데이터에 의존하지 않도록 절대 좌표 대신 페이지 간 상대 비교만 한다.
// Playwright의 헤드리스 Chromium은 기본적으로 스크롤바를 숨겨(--hide-scrollbars) 이 문제를 재현할 수
// 없으므로, 이 파일에서만 해당 기본 플래그를 끈다.
test.use({
  viewport: { width: 1280, height: 1600 },
  launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] },
});

async function dockPositions(page: import("@playwright/test").Page) {
  const dock = page.getByRole("navigation", { name: "주요 메뉴" });
  const firstTab = await dock.getByRole("link").first().boundingBox();
  const toggle = await dock.getByRole("button", { name: "테마 전환" }).boundingBox();
  expect(firstTab).not.toBeNull();
  expect(toggle).not.toBeNull();
  return { firstTabX: firstTab!.x, toggleRight: toggle!.x + toggle!.width };
}

test("페이지를 이동해도 독 위치가 같다 (스크롤바 유무 무관)", async ({ page }) => {
  await page.goto("/");
  const home = await dockPositions(page);

  await page.goto("/projects");
  const list = await dockPositions(page);

  await page.locator('a[href^="/projects/"]').first().click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  const detail = await dockPositions(page);

  expect(list).toEqual(home);
  expect(detail).toEqual(home);
});
