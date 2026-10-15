import { expect, test, type Page } from "@playwright/test";

/**
 * 하이드레이션이 끝날 때까지 기다린다. 빌더는 마운트 후 effect에서 상태를 localStorage에 저장하므로,
 * 저장값이 생기면 드래그 센서 등 이벤트 핸들러가 붙은 뒤다(그 전에 누르면 입력이 유실된다).
 */
async function gotoExport(page: Page) {
  await page.goto("/export");
  await page.waitForFunction(
    () => window.localStorage.getItem("portfolio-export-v1") !== null,
  );
}

// 이 파일은 실제 Notion API로 데이터를 조회하는 실서버 기반 E2E이므로, 프로젝트 개수나
// 제목을 하드코딩하지 않고 화면에서 읽은 값을 기준으로 상대적으로 검증한다.
test.describe("PDF 내보내기(F008)", () => {
  test("프로젝트 목록의 'PDF로 내보내기' 링크로 진입한다", async ({ page }) => {
    await page.goto("/projects");

    await page.locator('a[href="/export"]').click();

    await expect(page).toHaveURL(/\/export$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "PDF 내보내기" }),
    ).toBeVisible();
  });

  test("아래로 이동하면 미리보기 순서가 바뀐다", async ({ page }) => {
    await page.goto("/export");

    const titles = page.locator('[data-testid="export-project"] h2');
    await expect(titles.first()).toBeVisible();
    const before = await titles.allTextContents();
    test.skip(before.length < 2, "프로젝트가 2개 미만이면 순서를 바꿀 수 없다");

    await page
      .getByRole("button", { name: /아래로 이동$/ })
      .first()
      .click();

    await expect
      .poll(async () => titles.allTextContents())
      .toEqual([before[1], before[0], ...before.slice(2)]);
  });

  test("핸들을 끌어 놓으면 미리보기 순서가 바뀌고 새로고침 후에도 유지된다", async ({
    page,
  }) => {
    await gotoExport(page);

    const titles = page.locator('[data-testid="export-project"] h2');
    await expect(titles.first()).toBeVisible();
    const before = await titles.allTextContents();
    test.skip(
      before.length < 3,
      "프로젝트가 3개 미만이면 드래그 검증이 어렵다",
    );

    const handles = page.getByRole("button", { name: /순서 끌어서 변경$/ });
    const from = await handles.nth(0).boundingBox();
    const to = await handles.nth(2).boundingBox();
    expect(from && to).toBeTruthy();

    // 첫 항목을 세 번째 항목 자리로 끈다(약간 움직여야 드래그가 시작된다).
    await page.mouse.move(
      from!.x + from!.width / 2,
      from!.y + from!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(from!.x + 5, from!.y + 20, { steps: 5 });
    await page.mouse.move(to!.x + 5, to!.y + to!.height / 2 + 10, {
      steps: 15,
    });
    await page.mouse.up();

    const moved = [before[1], before[2], before[0], ...before.slice(3)];
    await expect.poll(async () => titles.allTextContents()).toEqual(moved);

    await page.reload();
    await expect.poll(async () => titles.allTextContents()).toEqual(moved);
  });

  test("드래그 중 이동 항목의 크기가 변하지 않는다", async ({ page }) => {
    await gotoExport(page);

    const items = page
      .getByRole("region", { name: "내보내기 설정" })
      .getByRole("listitem");
    await expect(items.first()).toBeVisible();
    test.skip(
      (await items.count()) < 3,
      "프로젝트가 3개 미만이면 드래그 검증이 어렵다",
    );

    // 두 번째 항목을 체크 해제해 영역 토글 줄이 사라지게 한다(항목마다 높이가 달라진다).
    await items.nth(1).getByRole("checkbox").first().click();
    const draggedHeight = (await items.nth(0).boundingBox())!.height;
    const shortHeight = (await items.nth(1).boundingBox())!.height;
    expect(shortHeight).toBeLessThan(draggedHeight);

    const handles = page.getByRole("button", { name: /순서 끌어서 변경$/ });
    const from = (await handles.nth(0).boundingBox())!;
    const to = (await handles.nth(2).boundingBox())!;

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + 5, from.y + 20, { steps: 5 });

    // 더 낮은 항목 위를 지나는 동안에도 이동 항목의 높이가 그대로여야 한다.
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(
        from.x + 5,
        from.y + 20 + ((to.y - from.y) * i) / steps,
        { steps: 2 },
      );
      const height = await page.evaluate(() => {
        const dragging = document.querySelector(
          'section[aria-label="내보내기 설정"] li.z-10',
        );
        return dragging?.getBoundingClientRect().height ?? null;
      });
      expect(height).not.toBeNull();
      expect(Math.abs(height! - draggedHeight)).toBeLessThan(1);
    }

    await page.mouse.up();
  });

  test("키보드로도 핸들에서 순서를 바꿀 수 있다", async ({ page }) => {
    await gotoExport(page);

    const titles = page.locator('[data-testid="export-project"] h2');
    await expect(titles.first()).toBeVisible();
    const before = await titles.allTextContents();
    test.skip(before.length < 2, "프로젝트가 2개 미만이면 순서를 바꿀 수 없다");

    // 마지막 항목을 스페이스로 집어 위로 한 칸 옮긴다. dnd-kit이 위치를 재는 동안 다음 키가
    // 들어가면 어긋나므로, 단계마다 상태가 반영되길 기다린다.
    const lastHandle = page
      .getByRole("button", { name: /순서 끌어서 변경$/ })
      .last();
    const dragging = page.locator(
      'section[aria-label="내보내기 설정"] li.z-10',
    );
    await lastHandle.focus();
    await page.keyboard.press("Space");
    await expect(dragging).toBeVisible();

    await page.keyboard.press("ArrowUp");
    await expect
      .poll(async () =>
        dragging.evaluate((el) => (el as HTMLElement).style.transform),
      )
      .toMatch(/translate3d\(0px, -\d+px, 0px\)/);

    await page.keyboard.press("Space");
    await expect(dragging).toHaveCount(0);

    const n = before.length;
    await expect
      .poll(async () => titles.allTextContents())
      .toEqual([...before.slice(0, n - 2), before[n - 1], before[n - 2]]);
  });

  test("체크를 해제한 프로젝트와 끈 섹션은 미리보기에서 사라진다", async ({
    page,
  }) => {
    await page.goto("/export");

    const projects = page.locator('[data-testid="export-project"]');
    await expect(projects.first()).toBeVisible();
    const total = await projects.count();

    const settings = page.getByRole("region", { name: "내보내기 설정" });
    const firstItem = settings.getByRole("listitem").first();

    // 요약 섹션 끄기: 첫 프로젝트 미리보기의 요약 문구가 사라진다.
    const firstProject = projects.first();
    // 요약은 article의 직계 <p>다(기간 <p>는 제목 div 안에 있다).
    const summaryText = firstProject.locator(":scope > p").first();
    const summary =
      (await summaryText.count()) > 0
        ? (await summaryText.textContent())?.trim()
        : undefined;
    await firstItem
      .locator("label", { hasText: /^요약$/ })
      .getByRole("checkbox")
      .click();
    if (summary) {
      await expect(
        firstProject.getByText(summary, { exact: true }),
      ).toHaveCount(0);
    }

    // 첫 프로젝트 선택 해제: 미리보기 개수가 하나 줄어든다.
    await firstItem.getByRole("checkbox").first().click();
    await expect(projects).toHaveCount(total - 1);
  });

  test("새로고침해도 순서와 선택이 복원된다", async ({ page }) => {
    await page.goto("/export");

    const titles = page.locator('[data-testid="export-project"] h2');
    await expect(titles.first()).toBeVisible();
    const initial = await titles.allTextContents();
    test.skip(
      initial.length < 2,
      "프로젝트가 2개 미만이면 순서를 바꿀 수 없다",
    );

    await page
      .getByRole("button", { name: /아래로 이동$/ })
      .first()
      .click();
    const moved = [initial[1], initial[0], ...initial.slice(2)];
    await expect.poll(async () => titles.allTextContents()).toEqual(moved);

    await page.reload();

    await expect.poll(async () => titles.allTextContents()).toEqual(moved);
  });

  test("인쇄 미디어에서는 설정 패널과 하단 독이 숨겨지고 배경이 흰색이다", async ({
    page,
  }) => {
    await page.goto("/export");
    await expect(
      page.locator('[data-testid="export-project"]').first(),
    ).toBeVisible();

    await page.emulateMedia({ media: "print" });

    await expect(
      page.getByRole("region", { name: "내보내기 설정" }),
    ).toBeHidden();
    await expect(
      page.getByRole("navigation", { name: "주요 메뉴" }),
    ).toBeHidden();
    await expect(
      page.locator('[data-testid="export-project"]').first(),
    ).toBeVisible();
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      /^(rgb\(255, 255, 255\)|lab\(100 0 0\))$/,
    );
  });
});
