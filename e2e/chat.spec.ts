import { expect, test, type Page } from "@playwright/test";

// 실제 Gemini를 호출하지 않도록 /api/chat 응답은 모두 스텁한다(비용·불안정성 방지).
// 실제 모델 답변 품질은 API 키가 있을 때 수동(Playwright MCP)으로 확인한다.
async function stubChat(page: Page, status: number, body: unknown) {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    }),
  );
}

function questionInput(page: Page) {
  return page.getByRole("textbox", { name: "질문" });
}

test.describe("AI 챗", () => {
  test("독의 챗 탭으로 이동하고 현재 탭으로 표시된다", async ({ page }) => {
    await page.goto("/");
    const dock = page.getByRole("navigation", { name: "주요 메뉴" });

    await dock.getByRole("link", { name: "챗", exact: true }).click();

    await expect(page).toHaveURL("/chat");
    await expect(dock.getByRole("link", { name: "챗" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "의 AI",
    );
    await expect(page.getByText(/입력한 내용은 Google Gemini로/)).toBeVisible();
  });

  test("질문을 보내면 답변을 보여준다", async ({ page }) => {
    await stubChat(page, 200, { text: "저는 **여러 프로젝트**를 했어요." });
    await page.goto("/chat");

    await questionInput(page).fill("어떤 프로젝트 했나요?");
    await questionInput(page).press("Enter");

    await expect(page.getByText("어떤 프로젝트 했나요?")).toBeVisible();
    await expect(
      page.locator("strong", { hasText: "여러 프로젝트" }),
    ).toBeVisible();
    await expect(questionInput(page)).toHaveValue("");
  });

  test("예시 질문을 누르면 바로 질문하고 예시 칩은 사라진다", async ({
    page,
  }) => {
    await stubChat(page, 200, { text: "예시 답변" });
    await page.goto("/chat");

    const chip = page.getByRole("button", {
      name: "어떤 프로젝트를 해봤나요?",
    });
    await chip.click();

    await expect(page.getByText("예시 답변")).toBeVisible();
    await expect(chip).toHaveCount(0);
  });

  test("서버 오류 안내 문구를 보여준다", async ({ page }) => {
    await stubChat(page, 500, {
      type: "server_error",
      message: "일시적인 문제로 답하지 못했어요. 잠시 뒤에 다시 시도해 주세요.",
    });
    await page.goto("/chat");

    await questionInput(page).fill("안녕하세요");
    await questionInput(page).press("Enter");

    // Next.js 라우트 안내(__next-route-announcer__)도 role="alert"라 문구로 좁힌다.
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "일시적인 문제로 답하지 못했어요" }),
    ).toBeVisible();
    await expect(questionInput(page)).toBeEnabled();
  });

  test("요청 제한(429)이면 남은 시간 동안 입력을 막는다", async ({ page }) => {
    await stubChat(page, 429, {
      type: "rate_limit",
      message: "질문이 너무 빨라요. 잠시 뒤에 다시 물어봐 주세요.",
      retryAfter: 2,
    });
    await page.goto("/chat");

    await questionInput(page).fill("안녕하세요");
    await questionInput(page).press("Enter");

    await expect(
      page.getByRole("alert").filter({ hasText: "질문이 너무 빨라요" }),
    ).toBeVisible();
    await expect(questionInput(page)).toBeDisabled();
    await expect(questionInput(page)).toHaveAttribute(
      "placeholder",
      /초 뒤에 다시/,
    );
    await expect(questionInput(page)).toBeEnabled({ timeout: 5_000 });
  });

  test("모바일에서 가로 스크롤이 없고 입력창이 독을 가리지 않는다", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/chat");

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(390);

    const dock = page.getByRole("navigation", { name: "주요 메뉴" });
    const dockBox = await dock.getByRole("link", { name: "챗" }).boundingBox();
    const dockLinks = dock.getByRole("link");
    const firstTab = await dockLinks.first().boundingBox();
    const lastTab = await dockLinks.last().boundingBox();
    const formBox = await page
      .getByRole("form", { name: "질문 입력" })
      .boundingBox();

    expect(dockBox).not.toBeNull();
    expect(firstTab).not.toBeNull();
    expect(lastTab).not.toBeNull();
    expect(formBox).not.toBeNull();
    // 독의 탭 3개가 화면 안에 들어오고, 입력창은 독보다 위에 있다.
    expect(firstTab!.x).toBeGreaterThanOrEqual(0);
    expect(lastTab!.x + lastTab!.width).toBeLessThanOrEqual(390);
    expect(formBox!.y + formBox!.height).toBeLessThanOrEqual(dockBox!.y);
  });
});
