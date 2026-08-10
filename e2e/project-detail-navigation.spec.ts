import { expect, test } from "@playwright/test";

// 이 파일은 실제 Notion API(.env.local의 NOTION_API_KEY/NOTION_DATABASE_ID)로 데이터를
// 조회하는 실서버 기반 E2E이므로, 특정 프로젝트 id/제목/개수를 하드코딩하지 않고
// 상대적으로(URL 변화 유무 중심으로) 검증한다.
test.describe("프로젝트 상세 이전/다음 프로젝트 네비게이션(F005)", () => {
  test("다음 프로젝트로 이동한 뒤 이전 프로젝트 링크로 원래 페이지로 돌아온다", async ({
    page,
  }) => {
    await page.goto("/projects");

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();
    await projectLinks.first().click();

    await page.waitForURL(/\/projects\/.+/);
    const originalUrl = page.url();

    const nextLink = page.getByRole("button", { name: /^다음 프로젝트/ });

    // 프로젝트가 1개뿐이거나 마지막 프로젝트로 진입한 경우 다음 링크가 없을 수 있다.
    if ((await nextLink.count()) === 0) {
      test.skip();
      return;
    }

    await nextLink.click();
    await page.waitForURL((url) => url.toString() !== originalUrl);
    expect(page.url()).not.toBe(originalUrl);

    const previousLink = page.getByRole("button", { name: /^이전 프로젝트/ });
    await expect(previousLink).toBeVisible();
    const intermediateUrl = page.url();
    await previousLink.click();

    await page.waitForURL((url) => url.toString() !== intermediateUrl);
    expect(page.url()).toBe(originalUrl);
  });
});
