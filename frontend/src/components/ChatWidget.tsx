import { useEffect, useRef, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { fetchQuickActions, sendChat, type ChatMessage } from "../lib/api";

const COLORS = {
  brand: "#1d5394",
  brandDark: "#13263b",
  user: "#1d5394",
  assistant: "#f7f9fc",
  border: "#e3eaf3",
  muted: "#60758a",
};

type Status = "idle" | "loading" | "error";

function renderMarkdown(text: string): string {
  // ultra-light markdown: bold, line breaks, list bullets
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul style='margin:6px 0 6px 16px;padding:0'>$1</ul>")
    .replace(/\n/g, "<br />");
}

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchQuickActions().then(setQuickActions).catch(() => setQuickActions([]));
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  if (!user) return null;

  const send = async (text: string) => {
    if (!text.trim() || status === "loading") return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setStatus("loading");
    setError(null);
    try {
      const resp = await sendChat(text, messages);
      setMessages([...newHistory, { role: "assistant", content: resp.reply }]);
      setStatus("idle");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  const titleByRole: Record<string, string> = {
    ucar_admin: "UCAR Insight AI",
    institution_admin: "Institution AI Assistant",
    student: "My Study Coach",
  };
  const subtitle: Record<string, string> = {
    ucar_admin: `Grounded on live UCAR data · ${user.universityShortName ?? "UCAR"}`,
    institution_admin: `Grounded on ${user.institutionShortName ?? "your institution"} KPIs`,
    student: "Personal academic guidance",
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI chat"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: COLORS.brand,
            color: "white",
            border: "none",
            boxShadow: "0 8px 20px rgba(29,83,148,0.35)",
            cursor: "pointer",
            fontSize: 24,
            zIndex: 1000,
          }}
        >
          💬
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 400,
            maxWidth: "calc(100vw - 32px)",
            height: 560,
            maxHeight: "calc(100vh - 48px)",
            background: "#fff",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            boxShadow: "0 16px 40px rgba(19,38,59,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: COLORS.brand,
              color: "white",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{titleByRole[user.role] ?? "AI Assistant"}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{subtitle[user.role] ?? ""}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: 20,
                cursor: "pointer",
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              padding: 14,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "#fcfdfe",
            }}
          >
            {messages.length === 0 && (
              <div style={{ color: COLORS.muted, fontSize: 13 }}>
                <p style={{ margin: "0 0 8px" }}>
                  Ask me anything about your KPIs, risk score, or anomalies. Answers are grounded
                  in live UCAR data.
                </p>
                {quickActions.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12, marginBottom: 6 }}>
                      Try asking:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {quickActions.map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          style={{
                            border: `1px solid ${COLORS.border}`,
                            background: "white",
                            color: COLORS.brandDark,
                            padding: "6px 10px",
                            borderRadius: 16,
                            fontSize: 12,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: m.role === "user" ? COLORS.user : COLORS.assistant,
                  color: m.role === "user" ? "white" : COLORS.brandDark,
                  padding: "9px 12px",
                  borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  fontSize: 13.5,
                  lineHeight: 1.45,
                  border: m.role === "user" ? "none" : `1px solid ${COLORS.border}`,
                }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
              />
            ))}

            {status === "loading" && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: COLORS.assistant,
                  border: `1px solid ${COLORS.border}`,
                  padding: "9px 12px",
                  borderRadius: "12px 12px 12px 2px",
                  fontSize: 12.5,
                  color: COLORS.muted,
                }}
              >
                <span className="dot-flash">●</span>
                <span className="dot-flash" style={{ animationDelay: "0.15s" }}>●</span>
                <span className="dot-flash" style={{ animationDelay: "0.3s" }}>●</span>
                {" "}thinking…
              </div>
            )}

            {error && (
              <div style={{ color: "#e85d6c", fontSize: 12 }}>Error: {error}</div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            style={{
              borderTop: `1px solid ${COLORS.border}`,
              padding: 10,
              display: "flex",
              gap: 8,
              background: "white",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={status === "loading"}
              style={{
                flex: 1,
                padding: "10px 12px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                fontSize: 13.5,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={status === "loading" || !input.trim()}
              style={{
                background: COLORS.brand,
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "0 14px",
                cursor: status === "loading" ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: 13,
                opacity: status === "loading" || !input.trim() ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Inline keyframes for the typing indicator */}
      <style>{`
        @keyframes flash { 0%,80%,100% { opacity: 0.25 } 40% { opacity: 1 } }
        .dot-flash { animation: flash 1s infinite; display: inline-block; margin: 0 1px; }
      `}</style>
    </>
  );
}
