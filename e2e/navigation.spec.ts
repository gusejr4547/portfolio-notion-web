import { expect, test } from "@playwright/test";

test.describe("헤더 내비게이션", () => {
  test("프로젝트로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "프로젝트" }).click();
    await expect(page).toHaveURL("/projects");
    await expect(
      page.getByRole("heading", { level: 1, name: "프로젝트" }),
    ).toBeVisible();
  });

  test("로고를 클릭하면 홈으로 이동한다", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: "포트폴리오" }).click();
    await expect(page).toHaveURL("/");
  });
});

test("존재하지 않는 경로는 404 페이지를 보여준다", async ({ page }) => {
  const response = await page.goto("/nonexistent-route-xyz");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없습니다" }),
  ).toBeVisible();
});
