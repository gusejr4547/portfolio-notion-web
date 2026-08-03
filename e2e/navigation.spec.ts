import { expect, test } from "@playwright/test";

test.describe("헤더 내비게이션", () => {
  test("Docs로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Docs" }).click();
    await expect(page).toHaveURL("/docs");
    await expect(
      page.getByRole("heading", { level: 1, name: "Docs" }),
    ).toBeVisible();
  });

  test("Components로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Components" }).click();
    await expect(page).toHaveURL("/components");
    await expect(
      page.getByRole("heading", { level: 1, name: "Components" }),
    ).toBeVisible();
  });

  test("Contact로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL("/contact");
    await expect(
      page.getByRole("heading", { level: 1, name: "Contact" }),
    ).toBeVisible();
  });
});

test("존재하지 않는 경로는 404 페이지를 보여준다", async ({ page }) => {
  const response = await page.goto("/nonexistent-route-xyz");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없습니다" }),
  ).toBeVisible();
});
