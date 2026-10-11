"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  HISTORY_MAX_ITEMS,
  type ChatErrorBody,
  type ChatHistoryItem,
  type ChatSuccessBody,
} from "@/lib/chat/contract";

const FALLBACK_ERROR =
  "일시적인 문제로 답하지 못했어요. 잠시 뒤에 다시 시도해 주세요.";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** 오류 안내 말풍선. 다음 요청의 대화 기록에는 넣지 않는다. */
  error?: boolean;
}

interface ChatContextValue {
  messages: ChatMessage[];
  /** 답변을 기다리는 중인지. */
  pending: boolean;
  /** 429 이후 입력이 풀릴 때까지 남은 초. */
  cooldown: number;
  /** 지금 새 질문을 보낼 수 없는지(답변 대기 중이거나 카운트다운 중). */
  disabled: boolean;
  /** 질문을 보낸다. 보냈으면 true, 빈 입력이거나 보낼 수 없는 상태면 false. */
  send: (raw: string) => boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function toHistory(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages
    .filter((message) => !message.error)
    .slice(-HISTORY_MAX_ITEMS)
    .map(({ role, content }) => ({ role, content }));
}

/**
 * 챗 대화 상태. 루트 레이아웃에 두어 다른 페이지로 이동했다 돌아와도 대화가 유지되고,
 * 새로고침하면 초기화된다. 브라우저 메모리에만 있고 서버·브라우저 저장소에는 남기지 않는다.
 * 전송 중에 페이지를 옮겨도 요청은 계속되어 돌아오면 답변이 와 있고, 카운트다운도 계속 흐른다.
 */
function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const nextId = useRef(0);
  // 같은 틱에 두 번 눌러도 요청이 두 번 나가지 않도록, 상태가 반영되기 전에 막는 용도.
  const inFlight = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const disabled = pending || cooldown > 0;

  function append(message: Omit<ChatMessage, "id">) {
    const id = nextId.current++;
    setMessages((previous) => [...previous, { ...message, id }]);
  }

  async function request(message: string, history: ChatHistoryItem[]) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const body = (await response.json().catch(() => null)) as
        ChatSuccessBody | ChatErrorBody | null;

      if (response.ok && body && "text" in body) {
        append({ role: "assistant", content: body.text });
        return;
      }

      const error = body && "type" in body ? body : null;
      append({
        role: "assistant",
        content: error?.message ?? FALLBACK_ERROR,
        error: true,
      });
      if (response.status === 429 && error?.retryAfter)
        setCooldown(error.retryAfter);
    } catch {
      append({ role: "assistant", content: FALLBACK_ERROR, error: true });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  function send(raw: string): boolean {
    const message = raw.trim();
    if (!message || inFlight.current || cooldown > 0) return false;

    inFlight.current = true;
    const history = toHistory(messages);
    append({ role: "user", content: message });
    setPending(true);
    void request(message, history);
    return true;
  }

  return (
    <ChatContext.Provider
      value={{ messages, pending, cooldown, disabled, send }}
    >
      {children}
    </ChatContext.Provider>
  );
}

function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat은 ChatProvider 안에서만 쓸 수 있어요.");
  }
  return context;
}

export { ChatProvider, useChat };
