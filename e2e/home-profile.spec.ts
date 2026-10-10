import { expect, test } from "@playwright/test";

const mobileViewport = { width: 390, height: 844 };

// 프로필은 Notion 실데이터(NOTION_PROFILE_PAGE_ID)에 의존하므로 이름·기술명을 하드코딩하지 않고,
// 기본 히어로 문구가 아닌지·구조가 존재하는지 같은 상대적 조건만 검증한다.
test.describe("홈 프로필", () => {
  test("이름이 h1으로 노출된다 (기본 히어로 문구가 아님)", async ({ page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).not.toHaveText("포트폴리오");
  });

  test("분야별 기술 스택과 숙련도 범례가 노출된다", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("dl dt").first()).toBeVisible();
    await expect(page.locator("dl dd span").first()).toBeVisible();
    await expect(page.getByText("많이 해봤어요")).toBeVisible();
    await expect(page.getByText("해본 적 있어요")).toBeVisible();
  });

  test("연락처 링크가 있고 전화번호는 노출되지 않는다", async ({ page }) => {
    await page.goto("/");

    const mailLink = page.locator('a[href^="mailto:"]');
    await expect(mailLink.first()).toBeVisible();
    await expect(mailLink.first()).not.toHaveAttribute("target", "_blank");

    const githubLink = page.locator('main a[href^="https://github.com/"]');
    await expect(githubLink.first()).toHaveAttribute("target", "_blank");

    const bodyText = await page.locator("main").innerText();
    expect(bodyText).not.toMatch(/0\d{1,2}-\d{3,4}-\d{4}/);
  });

  test("연락처는 두 줄로 나뉘어 표시된다", async ({ page }) => {
    await page.goto("/");

    const mailLink = page.locator('a[href^="mailto:"]').first();
    const githubLink = page.locator('main a[href^="https://github.com/"]').first();
    const mailBox = await mailLink.boundingBox();
    const githubBox = await githubLink.boundingBox();

    expect(mailBox).not.toBeNull();
    expect(githubBox).not.toBeNull();
    // 이메일 링크는 GitHub 링크보다 아래 줄에 있다.
    expect(mailBox!.y).toBeGreaterThan(githubBox!.y + githubBox!.height - 1);
  });

  test("섹션 제목(h3)이 소제목(h4)보다 크고, 소제목에는 강조 막대가 있다", async ({ page }) => {
    await page.goto("/");

    const sectionHeading = page.locator("main h3").first();
    const subHeading = page.locator("main h4").first();
    await expect(sectionHeading).toBeVisible();
    await expect(subHeading).toBeVisible();

    const sizeOf = (locator: typeof sectionHeading) =>
      locator.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(await sizeOf(sectionHeading)).toBeGreaterThan(await sizeOf(subHeading));

    const barWidth = await subHeading.evaluate((el) =>
      parseFloat(getComputedStyle(el).borderLeftWidth),
    );
    expect(barWidth).toBeGreaterThan(0);
  });

  test("프로필 아래에 대표 프로젝트 섹션이 유지된다", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 2, name: "대표 프로젝트" }),
    ).toBeVisible();
    await expect(page.locator('a[href^="/projects/"]').first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "전체 프로젝트 보기" }),
    ).toBeVisible();
  });
});

test.describe("홈 프로필 모바일 뷰포트", () => {
  test.use({ viewport: mobileViewport });

  test("가로 스크롤 없이 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("dl dt").first()).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
