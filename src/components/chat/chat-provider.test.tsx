import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EXAMPLE_QUESTIONS } from "@/lib/chat/contract";
import { act, render, renderHook, screen, waitFor } from "@/test/utils";

import { ChatPanel } from "./chat-panel";
import { ChatProvider, useChat } from "./chat-provider";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** 챗 페이지를 벗어났다 돌아오는 상황(라우트 이동으로 ChatPanel이 사라졌다 다시 생김)을 흉내 낸다. */
function Harness() {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setVisible((value) => !value)}>
        페이지 이동
      </button>
      {visible ? <ChatPanel ownerName="홍길동" /> : <p>다른 페이지</p>}
    </>
  );
}

function getInput() {
  return screen.getByRole("textbox", { name: "질문" });
}

async function leaveAndReturn(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "페이지 이동" }));
  expect(screen.getByText("다른 페이지")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "페이지 이동" }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("ChatProvider", () => {
  it("다른 페이지로 이동했다 돌아와도 질문과 답변이 그대로 남는다", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      jsonResponse({ text: "세 개의 프로젝트를 했어요." }),
    );
    render(<Harness />);

    await user.type(getInput(), "어떤 프로젝트 했나요?{Enter}");
    expect(
      await screen.findByText("세 개의 프로젝트를 했어요."),
    ).toBeInTheDocument();

    await leaveAndReturn(user);

    expect(screen.getByText("어떤 프로젝트 했나요?")).toBeInTheDocument();
    expect(screen.getByText("세 개의 프로젝트를 했어요.")).toBeInTheDocument();
    // 대화가 있으면 예시 질문은 다시 나타나지 않는다
    expect(
      screen.queryByRole("button", { name: EXAMPLE_QUESTIONS[0] }),
    ).not.toBeInTheDocument();
  });

  it("이동한 뒤에 보낸 다음 질문에도 이전 대화가 history로 함께 간다", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ text: "첫 답변" }))
      .mockResolvedValueOnce(jsonResponse({ text: "두 번째 답변" }));
    render(<Harness />);

    await user.type(getInput(), "첫 질문{Enter}");
    await screen.findByText("첫 답변");
    await leaveAndReturn(user);
    await user.type(getInput(), "이어서 질문{Enter}");
    await screen.findByText("두 번째 답변");

    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      message: "이어서 질문",
      history: [
        { role: "user", content: "첫 질문" },
        { role: "assistant", content: "첫 답변" },
      ],
    });
  });

  it("답변을 기다리는 중에 이동해도 요청이 이어져 돌아오면 답변이 와 있다", async () => {
    const user = userEvent.setup();
    let resolve!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    render(<Harness />);

    await user.type(getInput(), "느린 질문{Enter}");
    expect(
      screen.getByRole("status", { name: "답변을 작성하는 중" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "페이지 이동" }));
    await act(async () => resolve(jsonResponse({ text: "늦게 온 답변" })));
    await user.click(screen.getByRole("button", { name: "페이지 이동" }));

    expect(screen.getByText("늦게 온 답변")).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "답변을 작성하는 중" }),
    ).not.toBeInTheDocument();
  });

  it("이동 중에도 429 카운트다운이 계속 흘러 돌아오면 남은 시간이 줄어 있다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    fetchMock.mockResolvedValue(
      jsonResponse(
        { type: "rate_limit", message: "너무 빨라요.", retryAfter: 5 },
        429,
      ),
    );
    render(<Harness />);

    await user.type(getInput(), "안녕{Enter}");
    await screen.findByRole("alert");
    expect(getInput()).toHaveAttribute(
      "placeholder",
      "5초 뒤에 다시 물어볼 수 있어요",
    );

    await user.click(screen.getByRole("button", { name: "페이지 이동" }));
    // 카운트다운은 렌더마다 1초 타이머를 다시 걸기 때문에 1초씩 진행한다.
    for (let second = 0; second < 2; second++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    await user.click(screen.getByRole("button", { name: "페이지 이동" }));

    expect(getInput()).toBeDisabled();
    expect(getInput()).toHaveAttribute(
      "placeholder",
      "3초 뒤에 다시 물어볼 수 있어요",
    );
    for (let second = 0; second < 3; second++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    await waitFor(() => expect(getInput()).toBeEnabled());
  });

  it("같은 틱에 두 번 보내도 요청은 한 번만 나간다", async () => {
    let resolve!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });

    let first = false;
    let second = false;
    act(() => {
      first = result.current.send("질문");
      second = result.current.send("질문");
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => resolve(jsonResponse({ text: "답변" })));
  });

  it("빈 입력은 보내지 않는다", () => {
    const { result } = renderHook(() => useChat(), { wrapper: ChatProvider });

    let accepted = true;
    act(() => {
      accepted = result.current.send("   ");
    });

    expect(accepted).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("useChat", () => {
  it("ChatProvider 밖에서 쓰면 오류를 던진다", () => {
    // renderHook은 wrapper를 지정하지 않으면 provider 없이 렌더한다.
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      renderHook(() => useChat(), {
        wrapper: ({ children }) => <>{children}</>,
      }),
    ).toThrow("ChatProvider");
    vi.restoreAllMocks();
  });
});
