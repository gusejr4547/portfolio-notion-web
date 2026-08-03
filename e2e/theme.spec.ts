import { expect, test } from "@playwright/test";

// next-themes 지속성 + Base UI 드롭다운(portal) 상호작용은 jsdom에서 신뢰할 수 없어
// E2E로 검증한다.
test("다크모드로 전환하면 새로고침 후에도 유지된다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "테마 전환" }).click();
  await page.getByRole("menuitem", { name: "Dark" }).click();

  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("dark");

  await page.reload();

  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("라이트모드로 되돌리면 dark 클래스가 사라진다", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "테마 전환" }).click();
  await page.getByRole("menuitem", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.getByRole("button", { name: "테마 전환" }).click();
  await page.getByRole("menuitem", { name: "Light" }).click();

  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
