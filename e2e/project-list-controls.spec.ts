import { expect, test } from "@playwright/test";

// 이 파일은 실제 Notion API(.env.local의 NOTION_API_KEY/NOTION_DATABASE_ID)로 데이터를
// 조회하는 실서버 기반 E2E이므로, 특정 프로젝트 개수나 기술스택 태그명을 하드코딩하지 않고
// 상대적으로(변화 유무 중심으로) 검증한다.
test.describe("프로젝트 목록 필터/정렬 컨트롤(F004)", () => {
  test("기술스택 필터 클릭 시 카드 개수가 줄거나 유지되고, 필터 초기화로 복원된다", async ({
    page,
  }) => {
    await page.goto("/projects");

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();
    const initialCount = await projectLinks.count();

    const filterGroup = page.getByRole("group", { name: "기술스택 필터" });
    const filterButtons = filterGroup.getByRole("button");
    const filterButtonCount = await filterButtons.count();

    // 기술스택이 하나도 없는 프로젝트만 있는 경우 필터 그룹 자체가 렌더되지 않을 수 있다.
    if (filterButtonCount === 0) {
      test.skip();
      return;
    }

    await filterButtons.first().click();
    await expect(projectLinks.first()).toBeVisible();
    const filteredCount = await projectLinks.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await page.getByRole("button", { name: "필터 초기화" }).click();
    await expect(projectLinks).toHaveCount(initialCount);
  });

  test("정렬 방향을 '오래된순'으로 바꾸면 첫 번째 카드가 달라질 수 있다", async ({
    page,
  }) => {
    await page.goto("/projects");

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();
    const totalCount = await projectLinks.count();

    const beforeHref = await projectLinks.first().getAttribute("href");

    const oldestButton = page.getByRole("button", { name: "오래된순" });
    await expect(oldestButton).toBeVisible();
    await oldestButton.click();

    await expect(oldestButton).toHaveAttribute("aria-pressed", "true");

    if (totalCount <= 1) {
      // 프로젝트가 1개 이하면 정렬 방향이 바뀌어도 첫 카드는 그대로일 수 있으니
      // aria-pressed 상태 변화로 대체 검증한다.
      return;
    }

    const afterHref = await projectLinks.first().getAttribute("href");
    expect(afterHref).not.toBe(beforeHref);
  });
});
