import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, render, screen, waitFor } from "@/test/utils";

import { ChatPanel, EXAMPLE_QUESTIONS } from "./chat-panel";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getInput() {
  return screen.getByRole("textbox", { name: "질문" });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("ChatPanel", () => {
  it("이름이 들어간 AI 표식, 고지 문구, 환영 메시지, 예시 질문을 보여준다", () => {
    render(<ChatPanel ownerName="홍길동" />);

    expect(
      screen.getByRole("heading", { name: "홍길동의 AI" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/입력한 내용은 Google Gemini로/),
    ).toBeInTheDocument();
    expect(screen.getByText(/저는 홍길동의 AI예요/)).toBeInTheDocument();
    for (const question of EXAMPLE_QUESTIONS) {
      expect(
        screen.getByRole("button", { name: question }),
      ).toBeInTheDocument();
    }
  });

  it("질문을 보내면 응답을 마크다운으로 표시하고, 다음 요청에 대화 기록을 함께 보낸다", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ text: "**세 개**의 프로젝트를 했어요." }),
      )
      .mockResolvedValueOnce(jsonResponse({ text: "두 번째 답변" }));
    render(<ChatPanel ownerName="홍길동" />);

    await user.type(getInput(), "어떤 프로젝트 했나요?{Enter}");

    expect(await screen.findByText("세 개")).toContainHTML(
      "<strong>세 개</strong>",
    );
    expect(screen.getByText("어떤 프로젝트 했나요?")).toBeInTheDocument();
    expect(getInput()).toHaveValue("");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      message: "어떤 프로젝트 했나요?",
      history: [],
    });
    // 예시 질문은 대화가 시작되면 숨긴다.
    expect(
      screen.queryByRole("button", { name: EXAMPLE_QUESTIONS[0] }),
    ).not.toBeInTheDocument();

    await user.type(getInput(), "더 알려줘{Enter}");
    await screen.findByText("두 번째 답변");

    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      message: "더 알려줘",
      history: [
        { role: "user", content: "어떤 프로젝트 했나요?" },
        { role: "assistant", content: "**세 개**의 프로젝트를 했어요." },
      ],
    });
  });

  it("빈 입력은 보내지 않는다", async () => {
    const user = userEvent.setup();
    render(<ChatPanel ownerName="홍길동" />);

    await user.type(getInput(), "   {Enter}");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "보내기" })).toBeDisabled();
  });

  it("응답을 기다리는 동안 로딩 표시를 보여주고 입력을 막는다", async () => {
    const user = userEvent.setup();
    let resolve!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    render(<ChatPanel ownerName="홍길동" />);

    await user.type(getInput(), "안녕{Enter}");

    expect(
      screen.getByRole("status", { name: "답변을 작성하는 중" }),
    ).toBeInTheDocument();
    expect(getInput()).toBeDisabled();

    await act(async () => resolve(jsonResponse({ text: "반가워요" })));
    expect(await screen.findByText("반가워요")).toBeInTheDocument();
    expect(getInput()).toBeEnabled();
  });

  it("예시 질문을 누르면 그 질문을 바로 보낸다", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(jsonResponse({ text: "답변" }));
    render(<ChatPanel ownerName="홍길동" />);

    await user.click(
      screen.getByRole("button", { name: EXAMPLE_QUESTIONS[1] }),
    );

    await screen.findByText("답변");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).message).toBe(
      EXAMPLE_QUESTIONS[1],
    );
  });

  it("오류 응답의 안내 문구를 alert로 보여주고, 다음 요청 기록에서는 뺀다", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          { type: "server_error", message: "일시적인 문제로 답하지 못했어요." },
          500,
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ text: "이번엔 답했어요" }));
    render(<ChatPanel ownerName="홍길동" />);

    await user.type(getInput(), "첫 질문{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "일시적인 문제로 답하지 못했어요.",
    );

    await user.type(getInput(), "다시{Enter}");
    await screen.findByText("이번엔 답했어요");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).history).toEqual([
      { role: "user", content: "첫 질문" },
    ]);
  });

  it("네트워크 오류도 안내 문구로 보여준다", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<ChatPanel ownerName="홍길동" />);

    await user.type(getInput(), "안녕{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "잠시 뒤에 다시 시도해 주세요",
    );
  });

  it("429면 retryAfter초 동안 입력을 막고 남은 시간을 보여준다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    fetchMock.mockResolvedValue(
      jsonResponse(
        { type: "rate_limit", message: "질문이 너무 빨라요.", retryAfter: 2 },
        429,
      ),
    );
    render(<ChatPanel ownerName="홍길동" />);

    await user.type(getInput(), "안녕{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "질문이 너무 빨라요.",
    );
    expect(getInput()).toBeDisabled();
    expect(getInput()).toHaveAttribute(
      "placeholder",
      "2초 뒤에 다시 물어볼 수 있어요",
    );

    // 카운트다운은 렌더마다 1초 타이머를 다시 걸기 때문에 1초씩 진행한다.
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(getInput()).toHaveAttribute(
      "placeholder",
      "1초 뒤에 다시 물어볼 수 있어요",
    );
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    await waitFor(() => expect(getInput()).toBeEnabled());
  });

  it("답변 속 링크는 새 탭에서 연다", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      jsonResponse({
        text: "[GitHub](https://github.com/me)에서 볼 수 있어요.",
      }),
    );
    render(<ChatPanel ownerName="홍길동" />);

    await user.type(getInput(), "깃허브?{Enter}");

    const link = await screen.findByRole("link", { name: "GitHub" });
    expect(link).toHaveAttribute("href", "https://github.com/me");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("답변 속 원시 HTML은 렌더하지 않는다", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      jsonResponse({ text: '<img src=x onerror="alert(1)">안전' }),
    );
    const { container } = render(<ChatPanel ownerName="홍길동" />);

    await user.type(getInput(), "html{Enter}");

    await screen.findByText(/안전/);
    expect(container.querySelector("img")).toBeNull();
  });
});
