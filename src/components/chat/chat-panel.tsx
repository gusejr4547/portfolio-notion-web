"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HISTORY_MAX_ITEMS,
  MESSAGE_MAX_LENGTH,
  type ChatErrorBody,
  type ChatHistoryItem,
  type ChatSuccessBody,
} from "@/lib/chat/contract";
import { cn } from "@/lib/utils";

export const EXAMPLE_QUESTIONS = [
  "어떤 프로젝트를 해봤나요?",
  "가장 자신 있는 기술 스택은 뭔가요?",
  "대표 프로젝트를 소개해 주세요.",
] as const;

const FALLBACK_ERROR =
  "일시적인 문제로 답하지 못했어요. 잠시 뒤에 다시 시도해 주세요.";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** 오류 안내 말풍선. 다음 요청의 대화 기록에는 넣지 않는다. */
  error?: boolean;
}

// 원시 HTML은 react-markdown 기본값대로 렌더하지 않고, 링크는 사이트를 벗어나므로 새 탭에서 연다.
const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4"
    >
      {children}
    </a>
  ),
};

const MARKDOWN_CLASSES = [
  "space-y-2 break-words",
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1",
  "[&_strong]:font-semibold [&_code]:rounded [&_code]:bg-background/60 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em]",
].join(" ");

function toHistory(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages
    .filter((message) => !message.error)
    .slice(-HISTORY_MAX_ITEMS)
    .map(({ role, content }) => ({ role, content }));
}

function AssistantAvatar({ ownerName }: { ownerName: string }) {
  return (
    <Avatar className="mt-0.5">
      <AvatarFallback>{ownerName.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}

/**
 * 포트폴리오 AI 챗. 대화는 이 컴포넌트 메모리에만 두고(새로고침하면 초기화) 서버에 저장하지 않는다.
 * 입력창은 하단 독 바로 위에 고정되고, 메시지 목록은 페이지 스크롤을 따른다.
 */
function ChatPanel({ ownerName }: { ownerName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const nextId = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

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

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || disabled) return;

    const history = toHistory(messages);
    append({ role: "user", content: message });
    setInput("");
    setPending(true);

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
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {ownerName}의 AI
        </h1>
        <p className="text-sm text-muted-foreground">
          포트폴리오 내용을 바탕으로 답해요. 부정확할 수 있고, 입력한 내용은
          Google Gemini로 전송돼요.
        </p>
      </header>

      {/* 입력창(고정)에 가리지 않도록 아래 여백을 둔다. */}
      <div aria-live="polite" className="flex flex-col gap-4 pb-28">
        <div className="flex items-start gap-3">
          <AssistantAvatar ownerName={ownerName} />
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed">
            안녕하세요! 저는 {ownerName}의 AI예요. 프로젝트나 기술 스택에 대해
            편하게 물어봐 주세요.
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2 pl-11">
            {EXAMPLE_QUESTIONS.map((question) => (
              <Button
                key={question}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={disabled}
                onClick={() => void send(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        ) : null}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground">
                {message.content}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex items-start gap-3">
              <AssistantAvatar ownerName={ownerName} />
              <div
                role={message.error ? "alert" : undefined}
                className={cn(
                  "max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed",
                  message.error &&
                    "border border-destructive/30 text-destructive",
                )}
              >
                {message.error ? (
                  message.content
                ) : (
                  <div className={MARKDOWN_CLASSES}>
                    <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ),
        )}

        {pending ? (
          <div className="flex items-start gap-3">
            <AssistantAvatar ownerName={ownerName} />
            <div
              role="status"
              aria-label="답변을 작성하는 중"
              className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-4"
            >
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground motion-reduce:animate-none"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {/* 하단 독(높이 약 56px + 아래 24px) 바로 위에 고정한다. */}
      <form
        onSubmit={handleSubmit}
        aria-label="질문 입력"
        className="fixed inset-x-0 bottom-24 z-40 px-4"
      >
        {/* 본문 컨테이너(max-w-5xl + px-4)의 콘텐츠 폭과 맞춘다. */}
        <div className="mx-auto flex max-w-[calc(64rem-2rem)] items-center gap-2 rounded-full border border-border bg-background/80 p-1.5 pl-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <label htmlFor={inputId} className="sr-only">
            질문
          </label>
          <Input
            id={inputId}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={MESSAGE_MAX_LENGTH}
            disabled={disabled}
            autoComplete="off"
            placeholder={
              cooldown > 0
                ? `${cooldown}초 뒤에 다시 물어볼 수 있어요`
                : "포트폴리오에 대해 물어보세요"
            }
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Button
            type="submit"
            size="icon-lg"
            className="rounded-full"
            disabled={disabled || input.trim() === ""}
            aria-label="보내기"
          >
            <ArrowUp aria-hidden />
          </Button>
        </div>
      </form>
    </div>
  );
}

export { ChatPanel };
