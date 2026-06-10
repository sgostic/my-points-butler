"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { trackChatMessage, trackChatOpened } from "@/lib/analytics";
import "./chat.css";

type Role = "user" | "assistant";
type Message = { role: Role; content: string };

const MAX_SESSION_MESSAGES = 5;

const GREETING =
  "Hi! I'm your Points Butler. Ask me whether to **use your points now** or **save them** for a better trip — I'll help you figure out the math.";

const SUGGESTIONS = [
  { label: "Use now or save?", q: "Should I use my points now or save them for a better trip later?" },
  { label: "What's a good cpp?", q: "What's a good cents-per-point value to aim for when redeeming?" },
  { label: "Transfer or portal?", q: "When is it better to transfer points vs. book through a travel portal?" },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fmt = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br>");

export default function ValueChat() {
  const [conversationId] = useState(() => crypto.randomUUID());
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  // remaining is null until the server tells us the real count
  const [remaining, setRemaining] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSuggest, setShowSuggest] = useState(true);
  const [input, setInput] = useState("");

  const messagesRemaining = remaining ?? MAX_SESSION_MESSAGES;
  const isLimitReached = remaining !== null && remaining <= 0;

  const logRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, busy, open]);

  function openChat() {
    trackChatOpened();
    setOpen(true);
    setTimeout(() => textRef.current?.focus(), 60);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (busy || !trimmed) return;

    if (isLimitReached) return;

    const nextHistory: Message[] = [...history, { role: "user", content: trimmed }];
    trackChatMessage(conversationId, trimmed, "user");
    setHistory(nextHistory);
    setInput("");
    setShowSuggest(false);
    setBusy(true);

    if (textRef.current) textRef.current.style.height = "auto";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [{ role: "user", content: trimmed }],
        }),
      });

      const data = (await response.json()) as {
        conversationId?: string;
        message?: string;
        error?: string;
        remaining?: number;
      };

      if (response.status === 429) {
        setRemaining(0);
        trackChatMessage(
          data.conversationId ?? conversationId,
          "You've reached the **5 message** limit. Sign up for unlimited access.",
          "assistant",
        );
        setHistory((h) => [
          ...h,
          { role: "assistant", content: "You've reached the **5 message** limit. Sign up for unlimited access." },
        ]);
        return;
      }

      if (!response.ok || !data.message) throw new Error(data.error || "No response.");

      if (typeof data.remaining === "number") setRemaining(data.remaining);
      trackChatMessage(data.conversationId ?? conversationId, data.message, "assistant");
      setHistory((h) => [...h, { role: "assistant", content: data.message as string }]);
    } catch {
      trackChatMessage(
        conversationId,
        "Trouble connecting right now. Quick rule: if a transfer is worth more than **1.3¢/point** it usually beats cash and the portal — otherwise pay cash and keep your points.",
        "assistant",
      );
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content:
            "Trouble connecting right now. Quick rule: if a transfer is worth more than **1.3¢/point** it usually beats cash and the portal — otherwise pay cash and keep your points.",
        },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => textRef.current?.focus(), 0);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function handleInput() {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <>
      {!open ? (
        <button className="pb-chat-launcher" aria-label="Open the Points Butler" onClick={openChat}>
          <span className="pb-chat-lico">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
            </svg>
          </span>
          <span className="pb-chat-lt">Ask the Butler</span>
          <span className="pb-chat-pulse" />
        </button>
      ) : (
        <div className="pb-chat-panel">
          <header className="pb-chat-head">
            <span className="pb-chat-ava">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l2.2 4.8L19 9l-3.6 3.3.9 4.9L12 14.9 7.7 17.2l.9-4.9L5 9l4.8-1.2L12 3z" />
              </svg>
            </span>
            <div>
              <div className="pb-chat-name">Points Butler</div>
              <div className="pb-chat-status">
                <i /> Online · use now vs. save for later
              </div>
            </div>
            <button className="pb-chat-min" aria-label="Close chat" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
                <path d="M5 12h14" />
              </svg>
            </button>
          </header>

          <div className="pb-chat-log" ref={logRef}>
            <div className="pb-msg pb-bot" dangerouslySetInnerHTML={{ __html: fmt(GREETING) }} />
            {history.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="pb-msg pb-me">{m.content}</div>
              ) : (
                <div key={i} className="pb-msg pb-bot" dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
              ),
            )}
            {busy ? (
              <div className="pb-msg pb-bot pb-typing">
                <span /><span /><span />
              </div>
            ) : null}
          </div>

          {showSuggest ? (
            <div className="pb-chat-suggest">
              {SUGGESTIONS.map((s) => (
                <button key={s.label} onClick={() => void send(s.q)}>{s.label}</button>
              ))}
            </div>
          ) : null}

          <form className="pb-chat-input" onSubmit={handleSubmit}>
            <textarea
              ref={textRef}
              rows={1}
              placeholder={
                isLimitReached
                  ? "Message limit reached"
                  : `Ask about points (${messagesRemaining} left)...`
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              disabled={isLimitReached}
            />
            <button
              className="pb-chat-send"
              type="submit"
              aria-label="Send"
              disabled={busy || isLimitReached || input.trim().length === 0}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
