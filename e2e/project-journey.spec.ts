import { expect, test } from "@playwright/test";

// playwright.config.ts가 chromium 프로젝트 1개만 사용하므로, devices["iPhone 13"] 같은
// 전체 디바이스 프로필(webkit 기본 브라우저 지정 포함)을 쓰면 새 worker를 강제하며
// 충돌한다. 뷰포트 크기만 오버라이드해 모바일 레이아웃 회귀를 확인한다.
const mobileViewport = { width: 390, height: 844 };

// e2e/navigation.spec.ts가 개별 스텝(내비게이션 링크, 버튼 노출 등)을 검증한다면,
// 이 파일은 PRD 사용자 여정(홈→상세, 홈→목록→상세→외부링크)을 하나의 흐름으로
// 이어서 검증하고, 아직 다루지 않은 회귀 영역(잘못된 id의 UUID 형식, 모바일 뷰포트,
// 모바일+다크모드 조합)을 담당한다.
test.describe("전체 사용자 여정", () => {
  test("홈 → 상세: 대표 프로젝트 카드를 클릭하면 상세 정보가 노출된다", async ({
    page,
  }) => {
    await page.goto("/");

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();
    await projectLinks.first().click();

    await expect(page).toHaveURL(/\/projects\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "GitHub" })).toBeVisible();
  });

  test("홈 → 목록 → 상세 → 외부 링크: 전체 흐름을 따라가면 GitHub 저장소로 이동할 수 있다", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "전체 프로젝트 보기" }).click();
    await expect(page).toHaveURL("/projects");

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();
    await projectLinks.first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);

    const githubButton = page.getByRole("button", { name: "GitHub" });
    await expect(githubButton).toBeVisible();
    await expect(githubButton).toHaveAttribute("target", "_blank");
    await expect(githubButton).toHaveAttribute("rel", "noopener noreferrer");
  });
});

test("UUID 형식이지만 존재하지 않는 프로젝트 id는 404를 보여준다", async ({
  page,
}) => {
  // classifyNotionError는 비-UUID 형식(ValidationError)과 UUID 형식이지만
  // 존재하지 않는 id(ObjectNotFound)를 모두 "not_found"로 매핑한다.
  // e2e/navigation.spec.ts는 전자만 검증하므로, 후자 경로를 별도로 확인한다.
  await page.goto("/projects/00000000-0000-0000-0000-000000000000");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "프로젝트를 찾을 수 없습니다",
    }),
  ).toBeVisible();
});

test.describe("모바일 뷰포트 회귀", () => {
  test.use({ viewport: mobileViewport });

  test("홈: 헤더 nav가 숨겨져도 대표 프로젝트와 CTA로 목록까지 도달할 수 있다", async ({
    page,
  }) => {
    await page.goto("/");

    // sm 미만에서는 헤더 nav 링크가 hidden 처리된다.
    await expect(
      page.getByRole("link", { name: "프로젝트", exact: true }),
    ).toBeHidden();

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();

    await page.getByRole("button", { name: "전체 프로젝트 보기" }).click();
    await expect(page).toHaveURL("/projects");
  });

  test("목록: 카드 그리드가 렌더되고 클릭으로 상세 진입이 가능하다", async ({
    page,
  }) => {
    await page.goto("/projects");

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();
    await projectLinks.first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  });
});

test.describe("모바일 + 다크모드 조합 회귀", () => {
  test.use({ viewport: mobileViewport });

  test("모바일 뷰포트에서 다크모드로 전환해도 레이아웃이 유지되고 새로고침 후에도 유지된다", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "테마 전환" }).click();
    await page.getByRole("menuitem", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(projectLinks.first()).toBeVisible();
  });
});
