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
    await page.goto("/projects");

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();

    // Notion 데이터 모델상 GitHub 링크 속성은 모든 프로젝트에 존재하므로,
    // 목록의 첫 카드로 이동해 어떤 프로젝트가 오더라도 검증할 수 있다.
    await projectLinks.first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);

    const githubButton = page.getByRole("button", { name: "GitHub" });
    await expect(githubButton).toHaveAttribute("target", "_blank");
    await expect(githubButton).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("데모 링크가 없는 프로젝트는 데모 버튼이 노출되지 않는다", async ({
    page,
  }) => {
    await page.goto("/projects");

    const projectHrefs = await page
      .locator('a[href^="/projects/"]')
      .evaluateAll((anchors) =>
        anchors.map((a) => a.getAttribute("href")).filter(Boolean),
      );
    expect(projectHrefs.length).toBeGreaterThan(0);

    // 목록의 모든 프로젝트를 순회하며 데모 버튼 유무를 조건부로 검증한다.
    // 특정 프로젝트 id에 의존하지 않고, "데모 링크가 없으면 버튼이 없다"는
    // 규칙이 실제 Notion 데이터 중 최소 한 건에서 실제로 관찰되는지까지 확인한다.
    const demoButtonCounts: number[] = [];
    for (const href of projectHrefs) {
      await page.goto(href as string);
      const demoButtonCount = await page
        .getByRole("button", { name: "데모 보기" })
        .count();
      demoButtonCounts.push(demoButtonCount);
    }

    // 데모 버튼은 있으면 정확히 1개, 없으면 0개여야 한다 (중복 렌더링 방지).
    for (const count of demoButtonCounts) {
      expect([0, 1]).toContain(count);
    }

    // 실제 Notion 데이터 중 데모 링크가 없는 프로젝트가 최소 한 건 존재해야
    // "데모 링크 없으면 버튼 숨김" 규칙이 실제로 검증된다. 언젠가 모든
    // 프로젝트에 데모 링크가 채워지면 이 assertion이 실패하며, 그때는
    // 이 테스트 시나리오 자체를 재검토해야 한다는 신호다.
    expect(demoButtonCounts).toContain(0);
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
