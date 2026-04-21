"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, AtSign } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface ChatUser {
  id:     string;
  name:   string;
  avatar: string | null;
  role:   string;
}

interface Mention {
  userId: string;
  read:   boolean;
}

interface Message {
  id:          string;
  content:     string;
  authorId:    string;
  authorName:  string;
  authorColor: string;
  createdAt:   string;
  mentions:    Mention[];
}

const USER_COLORS = [
  "#7c3aed","#3b82f6","#10b981","#f59e0b",
  "#ef4444","#ec4899","#06b6d4","#84cc16",
];

function colorForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return USER_COLORS[h % USER_COLORS.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d   = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function renderContent(content: string, currentUserId: string) {
  // Replace @[Name](userId) with styled spans
  const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = /^@\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (m) {
      const isSelf = m[2] === currentUserId;
      return (
        <span
          key={i}
          className="font-semibold rounded px-0.5"
          style={{
            background: isSelf ? "rgba(124,58,237,0.18)" : "rgba(124,58,237,0.08)",
            color: "var(--c-accent-text)",
          }}
        >
          @{m[1]}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatClient({ currentUserId }: { currentUserId: string }) {
  const { data: session } = useSession();
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [users,      setUsers]      = useState<ChatUser[]>([]);
  const [input,      setInput]      = useState("");
  const [mentionQ,   setMentionQ]   = useState<string | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const [sending,    setSending]    = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const lastIdRef    = useRef<string | null>(null);
  const notifGranted = useRef(false);

  // ── request notification permission once ──
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        notifGranted.current = p === "granted";
      });
    } else {
      notifGranted.current = Notification?.permission === "granted";
    }
  }, []);

  // ── load users ──
  useEffect(() => {
    fetch("/api/chat/users").then((r) => r.json()).then(setUsers).catch(() => {});
  }, []);

  // ── initial load + mark read ──
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((msgs: Message[]) => {
        setMessages(msgs);
        if (msgs.length) lastIdRef.current = msgs[msgs.length - 1].id;
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
      })
      .catch(() => {});

    fetch("/api/chat/read", { method: "POST" }).catch(() => {});
  }, []);

  // ── poll every 4 s ──
  const poll = useCallback(async () => {
    try {
      const res  = await fetch("/api/chat");
      const msgs: Message[] = await res.json();
      if (!Array.isArray(msgs)) return;

      const lastKnown = lastIdRef.current;
      const newMsgs   = lastKnown
        ? msgs.filter((m) => m.createdAt > (messages.find((x) => x.id === lastKnown)?.createdAt ?? ""))
        : [];

      setMessages(msgs);
      if (msgs.length) lastIdRef.current = msgs[msgs.length - 1].id;

      // Notify if tab hidden and we are mentioned in new messages
      if (document.hidden && newMsgs.length) {
        const myMentions = newMsgs.filter((m) =>
          m.mentions.some((mn) => mn.userId === currentUserId) && m.authorId !== currentUserId
        );
        if (myMentions.length && notifGranted.current) {
          myMentions.forEach((m) => {
            new Notification(`${m.authorName} mentioned you`, {
              body: m.content.replace(/@\[[^\]]+\]\([^)]+\)/g, (s) => {
                const n = /^@\[([^\]]+)\]/.exec(s);
                return n ? `@${n[1]}` : s;
              }),
              icon: "/favicon.ico",
            });
          });
        }
        // auto-mark read when tab is visible
        document.addEventListener("visibilitychange", function once() {
          if (!document.hidden) {
            fetch("/api/chat/read", { method: "POST" }).catch(() => {});
            document.removeEventListener("visibilitychange", once);
          }
        });
      }
    } catch {}
  }, [currentUserId, messages]);

  useEffect(() => {
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, [poll]);

  // ── scroll to bottom on new messages ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── mention autocomplete ──
  const mentionFilter = mentionQ !== null
    ? users.filter(
        (u) => u.id !== currentUserId && u.name.toLowerCase().includes(mentionQ.toLowerCase())
      )
    : [];

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val    = e.target.value;
    const cursor = e.target.selectionStart ?? val.length;
    setInput(val);

    // Check if currently typing a @mention (from last @ before cursor with no space after)
    const before = val.slice(0, cursor);
    const atIdx  = before.lastIndexOf("@");
    if (atIdx !== -1 && !before.slice(atIdx + 1).includes(" ") && !before.slice(atIdx + 1).includes("\n")) {
      setMentionQ(before.slice(atIdx + 1));
      setMentionIdx(0);
    } else {
      setMentionQ(null);
    }
  }

  function insertMention(user: ChatUser) {
    const cursor  = inputRef.current?.selectionStart ?? input.length;
    const before  = input.slice(0, cursor);
    const atIdx   = before.lastIndexOf("@");
    const after   = input.slice(cursor);
    const mention = `@[${user.name}](${user.id})`;
    const next    = before.slice(0, atIdx) + mention + " " + after;
    setInput(next);
    setMentionQ(null);
    setTimeout(() => {
      inputRef.current?.focus();
      const pos = atIdx + mention.length + 1;
      inputRef.current?.setSelectionRange(pos, pos);
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQ !== null && mentionFilter.length > 0) {
      if (e.key === "ArrowDown")  { e.preventDefault(); setMentionIdx((i) => (i + 1) % mentionFilter.length); return; }
      if (e.key === "ArrowUp")    { e.preventDefault(); setMentionIdx((i) => (i - 1 + mentionFilter.length) % mentionFilter.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionFilter[mentionIdx]); return; }
      if (e.key === "Escape")     { setMentionQ(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    setMentionQ(null);
    try {
      const color = colorForId(currentUserId);
      const res   = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: text, color }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          return exists ? prev : [...prev, msg];
        });
        lastIdRef.current = msg.id;
      }
    } catch {}
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // ── group messages by date ──
  type DateGroup = { date: string; msgs: Message[] };
  const grouped: DateGroup[] = [];
  for (const msg of messages) {
    const d = formatDate(msg.createdAt);
    if (!grouped.length || grouped[grouped.length - 1].date !== d) {
      grouped.push({ date: d, msgs: [msg] });
    } else {
      grouped[grouped.length - 1].msgs.push(msg);
    }
  }

  const myColor = colorForId(currentUserId);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--c-bg)" }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid var(--c-border)", flexShrink: 0 }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--c-accent-glow)" }}
        >
          <AtSign size={15} style={{ color: "var(--c-accent-text)" }} />
        </div>
        <div>
          <h1 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Team Chat</h1>
          <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>
            {users.length} member{users.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ overflowAnchor: "none" }}>
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <AtSign size={32} style={{ color: "var(--c-text-faint)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No messages yet. Say hello!</p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
              <span className="text-[10px] font-medium px-2" style={{ color: "var(--c-text-faint)" }}>{group.date}</span>
              <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
            </div>

            <div className="space-y-1">
              {group.msgs.map((msg, idx) => {
                const isMine     = msg.authorId === currentUserId;
                const prevSame   = idx > 0 && group.msgs[idx - 1].authorId === msg.authorId;
                const isMentioned = msg.mentions.some((mn) => mn.userId === currentUserId);

                return (
                  <div
                    key={msg.id}
                    className="flex gap-2.5"
                    style={{
                      flexDirection:  isMine ? "row-reverse" : "row",
                      marginTop:      prevSame ? 2 : 12,
                      alignItems:     "flex-end",
                    }}
                  >
                    {/* Avatar */}
                    {!isMine && !prevSame ? (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: colorForId(msg.authorId), marginBottom: 2 }}
                      >
                        {getInitials(msg.authorName)}
                      </div>
                    ) : !isMine ? (
                      <div className="w-7 flex-shrink-0" />
                    ) : null}

                    <div style={{ maxWidth: "72%", minWidth: 60 }}>
                      {/* Name + time */}
                      {!isMine && !prevSame && (
                        <div className="flex items-baseline gap-2 mb-1 pl-1">
                          <span className="text-[11px] font-semibold" style={{ color: colorForId(msg.authorId) }}>
                            {msg.authorName}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--c-text-faint)" }}>
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      )}

                      <div
                        className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                        style={{
                          background:   isMine
                            ? "var(--c-accent)"
                            : isMentioned
                            ? "rgba(124,58,237,0.10)"
                            : "var(--c-elevated)",
                          color:        isMine ? "#fff" : "var(--c-text)",
                          borderRadius: isMine
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                          border: isMentioned && !isMine
                            ? "1px solid rgba(124,58,237,0.25)"
                            : "1px solid transparent",
                          wordBreak: "break-word",
                        }}
                      >
                        {renderContent(msg.content, currentUserId)}
                      </div>

                      {isMine && (
                        <div className="text-right pr-1 mt-0.5">
                          <span className="text-[10px]" style={{ color: "var(--c-text-faint)" }}>
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Mention autocomplete */}
      {mentionQ !== null && mentionFilter.length > 0 && (
        <div
          className="mx-4 mb-1 rounded-xl overflow-hidden shadow-lg"
          style={{
            border:     "1px solid var(--c-border)",
            background: "var(--c-surface)",
            maxHeight:  200,
            overflowY:  "auto",
          }}
        >
          {mentionFilter.map((u, i) => (
            <button
              key={u.id}
              onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-all"
              style={{
                background: i === mentionIdx ? "var(--c-accent-glow)" : "transparent",
                color:      "var(--c-text)",
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                style={{ background: colorForId(u.id) }}
              >
                {getInitials(u.name)}
              </div>
              <span className="font-medium">{u.name}</span>
              <span className="text-[10px] ml-auto" style={{ color: "var(--c-text-faint)" }}>
                {u.role.replace(/_/g, " ").toLowerCase()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="px-4 pb-4 pt-2"
        style={{ borderTop: "1px solid var(--c-border)", flexShrink: 0 }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mb-0.5"
            style={{ background: myColor }}
          >
            {getInitials((session?.user?.name) ?? "?")}
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message team… use @ to mention"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed py-0.5"
            style={{
              color:       "var(--c-text)",
              maxHeight:   120,
              overflowY:   "auto",
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all mb-0.5"
            style={{
              background: input.trim() ? "var(--c-accent)" : "var(--c-border)",
              color:      input.trim() ? "#fff" : "var(--c-text-faint)",
            }}
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-[10px] mt-1.5 px-1" style={{ color: "var(--c-text-faint)" }}>
          Enter to send · Shift+Enter for newline · @ to mention
        </p>
      </div>
    </div>
  );
}
