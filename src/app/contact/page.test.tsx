import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test/utils";

import ContactPage from "./page";

// Toaster는 layout.tsx에만 있어 유닛 테스트에서는 실제로 토스트가 렌더되지 않는다.
// 여기서는 toast.success가 올바른 인자로 호출되는지만 검증하고, 실제 화면 표시는
// e2e/contact-form.spec.ts가 담당한다.
vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

describe("ContactPage", () => {
  it("이름이 2자 미만이면 에러 메시지를 보여준다", async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    await user.type(screen.getByRole("textbox", { name: "이름" }), "홍");
    await user.click(screen.getByRole("button", { name: "보내기" }));

    expect(
      await screen.findByText("이름은 2자 이상 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("이메일 형식이 올바르지 않으면 에러 메시지를 보여준다", async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    await user.type(
      screen.getByRole("textbox", { name: "이메일" }),
      "not-an-email",
    );
    await user.click(screen.getByRole("button", { name: "보내기" }));

    expect(
      await screen.findByText("올바른 이메일 주소를 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("메시지가 10자 미만이면 에러 메시지를 보여준다", async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    await user.type(screen.getByRole("textbox", { name: "메시지" }), "짧음");
    await user.click(screen.getByRole("button", { name: "보내기" }));

    expect(
      await screen.findByText("메시지는 10자 이상 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("메시지가 500자를 초과하면 에러 메시지를 보여준다", async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    await user.type(
      screen.getByRole("textbox", { name: "메시지" }),
      "가".repeat(501),
    );
    await user.click(screen.getByRole("button", { name: "보내기" }));

    expect(
      await screen.findByText("메시지는 500자 이하로 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("유효한 값을 제출하면 toast.success를 호출하고 폼을 초기화한다", async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    const nameInput = screen.getByRole("textbox", { name: "이름" });
    await user.type(nameInput, "홍길동");
    await user.type(
      screen.getByRole("textbox", { name: "이메일" }),
      "test@example.com",
    );
    await user.type(
      screen.getByRole("textbox", { name: "메시지" }),
      "안녕하세요 테스트 메시지입니다.",
    );
    await user.click(screen.getByRole("button", { name: "보내기" }));

    await vi.waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "메시지가 전송되었습니다.",
        expect.objectContaining({
          description: "홍길동님, 곧 답변드리겠습니다.",
        }),
      );
    });
    await vi.waitFor(() => {
      expect(nameInput).toHaveValue("");
    });
  });
});
