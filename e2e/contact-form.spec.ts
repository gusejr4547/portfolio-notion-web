import { expect, test } from "@playwright/test";

// Toaster가 app/layout.tsx에만 마운트되어 있어 실제 토스트 표시는 유닛 테스트로
// 검증할 수 없다 (src/app/contact/page.test.tsx는 toast.success 호출만 mock으로 검증).
// 여기서는 실제 화면에 토스트가 보이는지까지 확인한다.
test("유효한 값을 제출하면 토스트가 표시되고 폼이 초기화된다", async ({
  page,
}) => {
  await page.goto("/contact");

  const nameInput = page.getByRole("textbox", { name: "이름" });
  await nameInput.fill("홍길동");
  await page.getByRole("textbox", { name: "이메일" }).fill("test@example.com");
  await page
    .getByRole("textbox", { name: "메시지" })
    .fill("안녕하세요 테스트 메시지입니다.");

  await page.getByRole("button", { name: "보내기" }).click();

  await expect(page.getByText("메시지가 전송되었습니다.")).toBeVisible();
  await expect(page.getByText("홍길동님, 곧 답변드리겠습니다.")).toBeVisible();
  await expect(nameInput).toHaveValue("");
});

test("빈 값으로 제출하면 각 필드에 에러 메시지를 보여준다", async ({
  page,
}) => {
  await page.goto("/contact");

  await page.getByRole("button", { name: "보내기" }).click();

  await expect(page.getByText("이름은 2자 이상 입력해주세요.")).toBeVisible();
  await expect(
    page.getByText("올바른 이메일 주소를 입력해주세요."),
  ).toBeVisible();
  await expect(
    page.getByText("메시지는 10자 이상 입력해주세요."),
  ).toBeVisible();
});
