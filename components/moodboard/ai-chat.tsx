"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Loader2, FileText, Image, FilePlus, FolderOpen, Trash2 } from "lucide-react";
import type { MbItem } from "./moodboard-logic";

/* ─── Types ─────────────────────────────────────────────────────── */

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface FilePayload {
  name:     string;
  mimeType: string;
  content:  string;   // raw text OR base64
  isBase64: boolean;
  size:     number;
}

/* ─── File reading helpers ──────────────────────────────────────── */

const TEXT_MIMES = new Set([
  "text/plain", "text/html", "text/css", "text/javascript",
  "application/json", "application/xml",
]);
const TEXT_EXTS  = /\.(ts|tsx|js|jsx|json|md|txt|css|scss|html|yaml|yml|prisma|sql|py|rb|go|rs|java|cs|php|sh|env)$/i;
const MAX_TEXT   = 80_000;   // chars
const MAX_BINARY = 8_000_000; // bytes (~6MB base64)

function isTextFile(file: File) {
  return TEXT_MIMES.has(file.type) || TEXT_EXTS.test(file.name) || file.type.startsWith("text/");
}

function readAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = rej;
    r.readAsText(file);
  });
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => {
      const dataUrl = r.result as string;
      res(dataUrl.split(",")[1]); // strip "data:...;base64,"
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function processFile(file: File): Promise<FilePayload | null> {
  if (isTextFile(file)) {
    if (file.size > MAX_TEXT) return null; // too large
    const content = await readAsText(file);
    return { name: file.name, mimeType: file.type || "text/plain", content: content.slice(0, MAX_TEXT), isBase64: false, size: file.size };
  }
  if (file.type.startsWith("image/") || file.type === "application/pdf") {
    if (file.size > MAX_BINARY) return null;
    const content = await readAsBase64(file);
    return { name: file.name, mimeType: file.type, content, isBase64: true, size: file.size };
  }
  return null; // unsupported type
}

function fileIcon(f: FilePayload) {
  if (f.mimeType.startsWith("image/"))        return <Image   size={10} />;
  if (f.mimeType === "application/pdf")       return <FileText size={10} />;
  return <FileText size={10} />;
}

function fmtSize(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ─── Component ─────────────────────────────────────────────────── */

export function AiChat({
  onClose,
  moodboardItems,
}: {
  onClose:        () => void;
  moodboardItems: MbItem[];
}) {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [files,     setFiles]     = useState<FilePayload[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [reading,   setReading]   = useState(false);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── pick files ── */
  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    setReading(true);
    const results = await Promise.all(picked.map(processFile));
    const valid   = results.filter(Boolean) as FilePayload[];
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
    setReading(false);
  }

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  /* ── send ── */
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
        body:    JSON.stringify({
          message:        text,
          history:        historySnapshot,
          files,
          moodboardItems,
        }),
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
    } finally {
      setLoading(false);
    }
  }

  const noteCount  = moodboardItems.filter(i => i.type === "NOTE").length;
  const imageCount = moodboardItems.filter(i => i.type === "IMAGE").length;

  return (
    <div className="flex flex-col h-full w-80 flex-shrink-0" style={{ borderLeft: "1px solid var(--c-border)", background: "var(--c-bg)" }}>

      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-2">
          <Bot size={14} style={{ color: "var(--c-accent-text)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>AI Assistant</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--c-accent-glow)", color: "var(--c-accent-text)" }}>
            Gemini
          </span>
        </div>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity" style={{ color: "var(--c-text-faint)" }}>
          <X size={14} />
        </button>
      </div>

      {/* moodboard context badge */}
      {moodboardItems.length > 0 && (
        <div className="px-4 py-2 flex-shrink-0 flex items-center gap-2" style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}>
          <span className="text-[10px]" style={{ color: "var(--c-accent-text)" }}>
            Moodboard included:
          </span>
          <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
            {imageCount > 0 && `${imageCount} image${imageCount > 1 ? "s" : ""}`}
            {imageCount > 0 && noteCount > 0 && " · "}
            {noteCount > 0 && `${noteCount} note${noteCount > 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      {/* file picker */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <p className="text-[11px] mb-2 font-medium" style={{ color: "var(--c-text-muted)" }}>
          Add files to analyze
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={reading}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-medium transition-all"
            style={{ background: "var(--c-elevated)", color: "var(--c-text)", border: "1px solid var(--c-border)" }}
          >
            <FilePlus size={12} />
            Files
          </button>
          <button
            onClick={() => folderInputRef.current?.click()}
            disabled={reading}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-medium transition-all"
            style={{ background: "var(--c-elevated)", color: "var(--c-text)", border: "1px solid var(--c-border)" }}
          >
            <FolderOpen size={12} />
            Folder
          </button>
          {files.length > 0 && (
            <button
              onClick={() => setFiles([])}
              title="Clear all files"
              className="px-2 py-2 rounded-lg transition-opacity hover:opacity-70"
              style={{ background: "var(--c-elevated)", color: "var(--c-text-faint)", border: "1px solid var(--c-border)" }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.ts,.tsx,.js,.jsx,.json,.md,.txt,.html,.css,.scss,.py,.rb,.go,.rs,.yaml,.yml,.sql,.prisma"
          className="hidden"
          onChange={handleFileInput}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          /* @ts-expect-error webkitdirectory not in TS types */
          webkitdirectory=""
          className="hidden"
          onChange={handleFileInput}
        />

        {/* file list */}
        {reading && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px]" style={{ color: "var(--c-text-faint)" }}>
            <Loader2 size={10} className="animate-spin" /> Reading files…
          </div>
        )}
        {files.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 max-h-28 overflow-y-auto">
            {files.map(f => (
              <div key={f.name} className="flex items-center gap-1.5 group">
                <span style={{ color: "var(--c-accent-text)", flexShrink: 0 }}>{fileIcon(f)}</span>
                <span className="flex-1 text-[10px] truncate" style={{ color: "var(--c-text-muted)" }} title={f.name}>
                  {f.name}
                </span>
                <span className="text-[9px] flex-shrink-0" style={{ color: "var(--c-text-faint)" }}>
                  {fmtSize(f.size)}
                </span>
                <button onClick={() => removeFile(f.name)} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: "var(--c-text-faint)" }}>
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        )}
        {files.length === 0 && !reading && (
          <p className="text-[10px] mt-2" style={{ color: "var(--c-text-faint)" }}>
            Images, PDFs, HTML, code files, and more
          </p>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 pointer-events-none">
            <Bot size={32} style={{ color: "var(--c-text-faint)", opacity: 0.25 }} />
            <p className="text-[11px] text-center leading-relaxed" style={{ color: "var(--c-text-faint)", opacity: 0.5 }}>
              Load files or ask about the moodboard.<br />Gemini will analyze everything.
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
              {m.content === "" && loading && m.role === "assistant"
                ? <span className="flex items-center gap-1.5" style={{ color: "var(--c-text-faint)" }}><Loader2 size={10} className="animate-spin" /> thinking…</span>
                : m.content}
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
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about your files or moodboard…"
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
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
