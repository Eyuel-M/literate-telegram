"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Send, AtSign, UserPlus, X, Eye, EyeOff, Loader2 } from "lucide-react";
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
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

const ROLE_SHORT: Record<string, string> = {
  ADMIN:           "Admin",
  MEMBER:          "Member",
  SENIOR_DESIGNER: "Sr. Designer",
  JUNIOR_DESIGNER: "Jr. Designer",
  ART_DIRECTOR:    "Art Director",
  DESIGNER:        "Designer",
};

const MEMBER_ROLES = [
  { value: "MEMBER",          label: "Member"          },
  { value: "DESIGNER",        label: "Designer"        },
  { value: "JUNIOR_DESIGNER", label: "Junior Designer" },
  { value: "SENIOR_DESIGNER", label: "Senior Designer" },
  { value: "ART_DIRECTOR",    label: "Art Director"    },
];

function AddMemberModal({ onClose, onAdded }: { onClose: () => void; onAdded: (u: ChatUser) => void }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("MEMBER");
  const [showPwd,  setShowPwd]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch("/api/chat/members", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add member"); setSaving(false); return; }
      onAdded(data as ChatUser);
      onClose();
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "var(--c-accent-glow)" }}>
              <UserPlus size={13} style={{ color: "var(--c-accent-text)" }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Add Team Member</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70" style={{ color: "var(--c-text-faint)" }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-3">
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </p>
          )}

          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Full Name</label>
            <input
              className="input w-full"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Email</label>
            <input
              type="email"
              className="input w-full"
              placeholder="alex@studio.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Temporary Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                className="input w-full pr-9"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--c-text-faint)" }}
              >
                {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Role</label>
            <select className="input w-full" value={role} onChange={e => setRole(e.target.value)}>
              {MEMBER_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <p className="text-[10px]" style={{ color: "var(--c-text-faint)" }}>
            The member will be able to log in with their email and this password.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-medium"
              style={{ background: "var(--c-elevated)", color: "var(--c-text-muted)", border: "1px solid var(--c-border)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
              style={{ background: "var(--c-accent)" }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
              {saving ? "Adding…" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function renderContent(content: string, currentUserId: string) {
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
            background: isSelf ? "rgba(124,58,237,0.22)" : "rgba(124,58,237,0.10)",
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
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [users,        setUsers]        = useState<ChatUser[]>([]);
  const [input,        setInput]        = useState("");
  const [mentionQ,     setMentionQ]     = useState<string | null>(null);
  const [mentionIdx,   setMentionIdx]   = useState(0);
  const [sending,      setSending]      = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  // Use refs so poll closure never goes stale
  const messagesRef  = useRef<Message[]>([]);
  const notifGranted = useRef(false);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── notification permission ──
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => { notifGranted.current = p === "granted"; });
    } else {
      notifGranted.current = Notification.permission === "granted";
    }
  }, []);

  // ── load users ──
  useEffect(() => {
    fetch("/api/chat/users")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {});
  }, []);

  // ── initial load ──
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((msgs: Message[]) => {
        if (!Array.isArray(msgs)) return;
        setMessages(msgs);
        messagesRef.current = msgs;
        // scroll after paint
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }));
      })
      .catch(() => {});

    fetch("/api/chat/read", { method: "POST" }).catch(() => {});
  }, []);

  // ── polling — stable interval, reads from ref ──
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res  = await fetch("/api/chat");
        const msgs: Message[] = await res.json();
        if (!Array.isArray(msgs)) return;

        const prev    = messagesRef.current;
        const prevIds = new Set(prev.map((m) => m.id));
        const newMsgs = msgs.filter((m) => !prevIds.has(m.id));

        setMessages(msgs);
        messagesRef.current = msgs;

        if (newMsgs.length && document.hidden) {
          const myMentions = newMsgs.filter(
            (m) => m.authorId !== currentUserId && m.mentions.some((mn) => mn.userId === currentUserId)
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
          document.addEventListener("visibilitychange", function once() {
            if (!document.hidden) {
              fetch("/api/chat/read", { method: "POST" }).catch(() => {});
              document.removeEventListener("visibilitychange", once);
            }
          });
        }
      } catch {}
    }, 4000);

    return () => clearInterval(id);
  }, [currentUserId]); // stable — no messages dep

  // ── auto-scroll on new messages ──
  const prevLenRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      prevLenRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // ── mention autocomplete ──
  const mentionFilter = mentionQ !== null
    ? users.filter((u) => u.id !== currentUserId && u.name.toLowerCase().includes(mentionQ.toLowerCase()))
    : [];

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val    = e.target.value;
    const cursor = e.target.selectionStart ?? val.length;
    setInput(val);

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
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content: text, color: colorForId(currentUserId) }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      }
    } catch {}
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // ── group by date ──
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
    <>
    {showAddMember && (
      <AddMemberModal
        onClose={() => setShowAddMember(false)}
        onAdded={(u) => setUsers((prev) => [...prev, u].sort((a, b) => a.name.localeCompare(b.name)))}
      />
    )}

    <div
      className="flex flex-col"
      style={{ height: "100%", background: "var(--c-bg)" }}
    >
      {/* ── Header ── */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--c-border)" }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--c-accent-glow)" }}
          >
            <AtSign size={14} style={{ color: "var(--c-accent-text)" }} />
          </div>
          <h1 className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Team Chat</h1>
          <span className="text-[11px] ml-1" style={{ color: "var(--c-text-faint)" }}>
            {users.length} member{users.length !== 1 ? "s" : ""}
          </span>
          {isAdmin && (
            <button
              onClick={() => setShowAddMember(true)}
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all"
              style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-accent)"; e.currentTarget.style.color = "var(--c-accent-text)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-border)";  e.currentTarget.style.color = "var(--c-text-muted)"; }}
            >
              <UserPlus size={12} />
              Add Member
            </button>
          )}
        </div>

        {/* Member list */}
        {users.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {users.map((u) => {
              const isMe = u.id === currentUserId;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                  style={{
                    background: isMe ? "var(--c-accent-glow)" : "var(--c-elevated)",
                    border:     `1px solid ${isMe ? "rgba(124,58,237,0.3)" : "var(--c-border)"}`,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                    style={{ background: colorForId(u.id) }}
                  >
                    {getInitials(u.name)}
                  </div>
                  <div>
                    <p
                      className="text-[11px] font-semibold leading-tight"
                      style={{ color: isMe ? "var(--c-accent-text)" : "var(--c-text)" }}
                    >
                      {u.name}{isMe && <span className="font-normal ml-1 opacity-60">(you)</span>}
                    </p>
                    <p className="text-[9px] leading-tight" style={{ color: "var(--c-text-faint)" }}>
                      {ROLE_SHORT[u.role] ?? u.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ minHeight: 200 }}>
            <AtSign size={28} style={{ color: "var(--c-text-faint)" }} />
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No messages yet — say hello!</p>
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.date}>
            {/* Date divider */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
              <span className="text-[10px] font-medium px-2" style={{ color: "var(--c-text-faint)" }}>
                {group.date}
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
            </div>

            <div className="space-y-0.5">
              {group.msgs.map((msg, idx) => {
                const isMine      = msg.authorId === currentUserId;
                const prevSame    = idx > 0 && group.msgs[idx - 1].authorId === msg.authorId;
                const isMentioned = msg.mentions.some((mn) => mn.userId === currentUserId);

                return (
                  <div
                    key={msg.id}
                    className="flex gap-2.5"
                    style={{
                      flexDirection: isMine ? "row-reverse" : "row",
                      marginTop:     prevSame ? 2 : 14,
                      alignItems:    "flex-end",
                    }}
                  >
                    {/* Avatar placeholder/icon for other users */}
                    {!isMine ? (
                      !prevSame ? (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                          style={{ background: colorForId(msg.authorId), marginBottom: 2 }}
                        >
                          {getInitials(msg.authorName)}
                        </div>
                      ) : (
                        <div className="w-7 flex-shrink-0" />
                      )
                    ) : null}

                    <div style={{ maxWidth: "72%", minWidth: 60 }}>
                      {/* Name + time row (first of a run) */}
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
                        className="px-3 py-2 text-sm leading-relaxed"
                        style={{
                          background:   isMine ? "var(--c-accent)"
                            : isMentioned ? "rgba(124,58,237,0.10)"
                            : "var(--c-elevated)",
                          color:        isMine ? "#fff" : "var(--c-text)",
                          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
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

      {/* ── Mention autocomplete ── */}
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
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left"
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
                {ROLE_SHORT[u.role] ?? u.role}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div
        className="px-4 pb-4 pt-2 flex-shrink-0"
        style={{ borderTop: "1px solid var(--c-border)" }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mb-0.5"
            style={{ background: myColor }}
          >
            {getInitials(session?.user?.name ?? "?")}
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message team… use @ to mention"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed py-0.5"
            style={{ color: "var(--c-text)", maxHeight: 120, overflowY: "auto" }}
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
    </>
  );
}
