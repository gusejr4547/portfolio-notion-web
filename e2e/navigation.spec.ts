import { expect, test } from "@playwright/test";

test.describe("헤더 내비게이션", () => {
  test("프로젝트로 이동한다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "프로젝트", exact: true }).click();
    await expect(page).toHaveURL("/projects");
    await expect(
      page.getByRole("heading", { level: 1, name: "프로젝트" }),
    ).toBeVisible();
  });

  test("로고를 클릭하면 홈으로 이동한다", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: "포트폴리오", exact: true }).click();
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

test.describe("프로젝트 라우팅 플로우", () => {
  test("홈은 대표 프로젝트 카드를 렌더링하고, 카드 클릭 시 상세 페이지로 이동한다", async ({
    page,
  }) => {
    await page.goto("/");

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();
    expect(await projectLinks.count()).toBeGreaterThan(0);

    await projectLinks.first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  });

  test("홈에서 전체 프로젝트 보기 클릭 시 목록 페이지로 이동한다", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "전체 프로젝트 보기" }).click();
    await expect(page).toHaveURL("/projects");
  });

  test("프로젝트 목록 페이지는 실제 프로젝트 카드를 렌더링하고, 카드 클릭 시 상세 페이지로 이동한다", async ({
    page,
  }) => {
    await page.goto("/projects");

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();
    expect(await projectLinks.count()).toBeGreaterThan(0);

    await projectLinks.first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  });

  test("상세 페이지의 GitHub 버튼은 새 탭으로 안전하게 열린다", async ({
    page,
  }) => {
    await page.goto("/projects/mock-project-1");
    const githubButton = page.getByRole("button", { name: "GitHub" });
    await expect(githubButton).toHaveAttribute("target", "_blank");
    await expect(githubButton).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  test("데모 링크가 없는 프로젝트는 데모 버튼이 노출되지 않는다", async ({
    page,
  }) => {
    await page.goto("/projects/mock-project-4");
    await expect(
      page.getByRole("button", { name: "데모 보기" }),
    ).toHaveCount(0);
  });

  test("존재하지 않는 프로젝트 id는 404를 보여주고 목록으로 돌아갈 수 있다", async ({
    page,
  }) => {
    await page.goto("/projects/nonexistent-project-id");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "프로젝트를 찾을 수 없습니다",
      }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "프로젝트 목록으로 돌아가기" })
      .click();
    await expect(page).toHaveURL("/projects");
  });
});
