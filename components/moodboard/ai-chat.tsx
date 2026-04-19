"use client";

import { useState, useRef, useEffect } from "react";
import { Send, FolderOpen, X, Bot, User, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChat({ onClose }: { onClose: () => void }) {
  const [directory, setDirectory] = useState("");
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [analyzed,  setAnalyzed]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    const historySnapshot  = messages;
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text, directory: directory || undefined, history: historySnapshot }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.error ?? "unknown"}` }]);
        return;
      }

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let   full   = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: full };
          return copy;
        });
      }

      setAnalyzed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full w-80 flex-shrink-0" style={{ borderLeft: "1px solid var(--c-border)", background: "var(--c-bg)" }}>

      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-2">
          <Bot size={14} style={{ color: "var(--c-accent-text)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>AI Assistant</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: "var(--c-accent-glow)", color: "var(--c-accent-text)" }}
          >Gemini</span>
        </div>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity" style={{ color: "var(--c-text-faint)" }}>
          <X size={14} />
        </button>
      </div>

      {/* directory selector */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <p className="text-[11px] mb-2 font-medium" style={{ color: "var(--c-text-muted)" }}>
          Directory to analyze
        </p>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
        >
          <FolderOpen size={12} style={{ color: "var(--c-text-faint)", flexShrink: 0 }} />
          <input
            value={directory}
            onChange={e => setDirectory(e.target.value)}
            placeholder=". (project root)"
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: "var(--c-text)" }}
            onKeyDown={e => e.key === "Enter" && send()}
          />
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: "var(--c-text-faint)" }}>
          Relative path from project root, e.g. <code className="opacity-70">src/components</code>
        </p>
        {analyzed && (
          <p className="text-[10px] mt-1" style={{ color: "var(--c-accent-text)" }}>
            ✓ Files loaded — ask anything
          </p>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 pointer-events-none">
            <Bot size={32} style={{ color: "var(--c-text-faint)", opacity: 0.3 }} />
            <p className="text-[11px] text-center leading-relaxed" style={{ color: "var(--c-text-faint)", opacity: 0.5 }}>
              Choose a directory above,<br />then ask about your files.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: m.role === "user" ? "var(--c-accent)" : "var(--c-elevated)",
                border:     m.role === "assistant" ? "1px solid var(--c-border)" : "none",
              }}
            >
              {m.role === "user"
                ? <User size={10} color="#fff" />
                : <Bot  size={10} style={{ color: "var(--c-accent-text)" }} />}
            </div>
            <div
              className="max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap"
              style={{
                background: m.role === "user" ? "var(--c-accent)" : "var(--c-elevated)",
                color:      m.role === "user" ? "#fff" : "var(--c-text)",
                border:     m.role === "assistant" ? "1px solid var(--c-border)" : "none",
              }}
            >
              {m.content === "" && loading && m.role === "assistant" ? (
                <span className="flex items-center gap-1.5" style={{ color: "var(--c-text-faint)" }}>
                  <Loader2 size={10} className="animate-spin" /> thinking…
                </span>
              ) : m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--c-border)" }}>
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about your codebase…"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-[11px] leading-relaxed"
            style={{ color: "var(--c-text)", maxHeight: 100, overflowY: "auto" }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-1.5 rounded-lg flex-shrink-0 transition-opacity"
            style={{ background: "var(--c-accent)", color: "#fff", opacity: loading || !input.trim() ? 0.35 : 1 }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
        <p className="text-[9px] mt-1.5 text-center" style={{ color: "var(--c-text-faint)" }}>
          Enter · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
