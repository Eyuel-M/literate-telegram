"use client";

import { useState } from "react";
import {
  Lock, Check, Eye, EyeOff,
  ChevronRight, ChevronDown, Download, Loader2, Save, ArrowLeft,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { signOut } from "next-auth/react";
import { getInitials } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────── */

interface Props {
  user:     { id: string; name: string; email: string; role: string };
  onClose?: () => void;
}

/* ─── Tiny helpers ───────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--c-text-faint)" }}>{title}</h2>
      </div>
      <div className="px-4 py-4 space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--c-text)" }}>{label}</p>
        {hint && <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text-faint)" }}>{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative inline-flex w-9 h-5 rounded-full transition-colors flex-shrink-0"
      style={{ background: on ? "var(--c-accent)" : "var(--c-border)" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--c-border)" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-3.5 text-left"
        style={{ color: "var(--c-text)" }}
      >
        <span className="text-sm font-medium">{question}</span>
        {open ? <ChevronDown size={15} style={{ color: "var(--c-text-faint)", flexShrink: 0 }} />
               : <ChevronRight size={15} style={{ color: "var(--c-text-faint)", flexShrink: 0 }} />}
      </button>
      {open && (
        <p className="text-sm pb-4 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
          {answer}
        </p>
      )}
    </div>
  );
}

const FONT_SIZES = [
  { label: "Small",   value: "13px" },
  { label: "Default", value: "14px" },
  { label: "Large",   value: "16px" },
  { label: "XL",      value: "18px" },
];

const SHORTCUTS = [
  { keys: ["Ctrl", "K"],     desc: "Quick search / command palette" },
  { keys: ["Ctrl", "Shift", "N"], desc: "New client" },
  { keys: ["Escape"],         desc: "Close modal or panel" },
  { keys: ["@"],              desc: "Mention a teammate in chat" },
  { keys: ["Enter"],          desc: "Send chat message" },
  { keys: ["Shift", "Enter"], desc: "New line in chat" },
  { keys: ["Ctrl", "Scroll"], desc: "Zoom moodboard in/out" },
];

const FAQ = [
  {
    question: "How do I invite a team member?",
    answer: "Go to Team Chat → click Add Member. Select an existing team member from the dropdown and set a temporary password. They can log in immediately with their email and that password.",
  },
  {
    question: "How do I add a project to a client?",
    answer: "Open a client, then click New Project in the Projects tab. You can set a status, due date, and budget right from the creation form.",
  },
  {
    question: "What AI providers are supported in the Moodboard AI?",
    answer: "Groq (free, cloud, recommended), Ollama (local, private, requires install), and Google Gemini. Configure them via .env.local — see the README for each provider's key name.",
  },
  {
    question: "How does moodboard sharing with clients work?",
    answer: "Each client has a unique moodboard URL. Share it directly — the client can view and leave feedback without needing a login account.",
  },
  {
    question: "Can I export my time entries?",
    answer: "Not yet in this version, but the data is stored in SQLite so you can open the database file directly with any SQLite browser to export to CSV.",
  },
  {
    question: "How do I change a team member's role?",
    answer: "Go to Delegations → select the team member. Role changes can be made from their profile card. Roles affect what they see in the sidebar.",
  },
  {
    question: "Is my data backed up?",
    answer: "Forma stores data locally in a SQLite file (prisma/forma.db). Back up that file regularly. A future version will support cloud sync.",
  },
];

/* ─── Main component ─────────────────────────────────────── */

export function SettingsClient({ user, onClose }: Props) {
  const { theme, toggle } = useTheme();

  // Account
  const [name,         setName]         = useState(user.name);
  const [email,        setEmail]        = useState(user.email);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg,   setProfileMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  // Password
  const [curPwd,    setCurPwd]    = useState("");
  const [newPwd,    setNewPwd]    = useState("");
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg,    setPwdMsg]    = useState<{ ok: boolean; text: string } | null>(null);

  // Appearance
  const [fontSize,    setFontSize]    = useState(() => {
    try { return localStorage.getItem("forma-font-size") || "14px"; } catch { return "14px"; }
  });
  const [compactMode, setCompactMode] = useState(() => {
    try { return localStorage.getItem("forma-compact") === "true"; } catch { return false; }
  });
  const [animations,  setAnimations]  = useState(() => {
    try { return localStorage.getItem("forma-animations") !== "false"; } catch { return true; }
  });

  // Notifications
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifTasks,    setNotifTasks]    = useState(true);
  const [notifSound,    setNotifSound]    = useState(false);

  function applyFontSize(size: string) {
    setFontSize(size);
    document.documentElement.style.setProperty("--font-size-base", size);
    try { localStorage.setItem("forma-font-size", size); } catch {}
  }

  function applyCompact(v: boolean) {
    setCompactMode(v);
    document.documentElement.classList.toggle("compact", v);
    try { localStorage.setItem("forma-compact", String(v)); } catch {}
  }

  function applyAnimations(v: boolean) {
    setAnimations(v);
    document.documentElement.classList.toggle("no-animations", !v);
    try { localStorage.setItem("forma-animations", String(v)); } catch {}
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res  = await fetch("/api/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "update-profile", name, email }),
      });
      const data = await res.json();
      setProfileMsg(res.ok
        ? { ok: true,  text: "Profile updated. Changes take effect on next sign-in." }
        : { ok: false, text: data.error ?? "Failed to update profile" }
      );
    } catch {
      setProfileMsg({ ok: false, text: "Network error" });
    }
    setProfileSaving(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      const res  = await fetch("/api/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "change-password", current: curPwd, next: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg({ ok: true, text: "Password changed successfully." });
        setCurPwd(""); setNewPwd("");
      } else {
        setPwdMsg({ ok: false, text: data.error ?? "Failed to change password" });
      }
    } catch {
      setPwdMsg({ ok: false, text: "Network error" });
    }
    setPwdSaving(false);
  }

  function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((p) => {
      setNotifMentions(p === "granted");
    });
  }

  const isAdmin = user.role === "ADMIN";
  const roleLabel: Record<string, string> = {
    ADMIN: "Admin", MEMBER: "Member", DESIGNER: "Designer",
    SENIOR_DESIGNER: "Senior Designer", JUNIOR_DESIGNER: "Junior Designer",
    ART_DIRECTOR: "Art Director",
  };

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--c-border)" }}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-opacity hover:opacity-70 flex-shrink-0"
            style={{ background: "var(--c-elevated)", color: "var(--c-text-muted)" }}
            title="Close settings"
          >
            <ArrowLeft size={15} />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--c-text)" }}>Settings</h1>
          <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>
            Account, appearance & preferences
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        {/* ── Account ── */}
        <Section title="Account">
          {/* Avatar + info */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--c-accent), #3b82f6)" }}
            >
              {getInitials(user.name)}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>{user.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{user.email}</p>
              <span
                className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--c-accent-glow)", color: "var(--c-accent-text)" }}
              >
                {roleLabel[user.role] ?? user.role}
              </span>
            </div>
          </div>

          {/* Edit profile form */}
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Full Name</label>
                <input className="input w-full" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Email</label>
                <input type="email" className="input w-full" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            {profileMsg && (
              <p className="text-xs" style={{ color: profileMsg.ok ? "var(--c-success)" : "var(--c-danger)" }}>
                {profileMsg.ok && <Check size={11} className="inline mr-1" />}{profileMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity"
              style={{ background: "var(--c-accent)" }}
            >
              {profileSaving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              {profileSaving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </Section>

        {/* ── Security ── */}
        <Section title="Security">
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Current Password</label>
              <div className="relative">
                <input
                  type={showCur ? "text" : "password"}
                  className="input w-full pr-9"
                  value={curPwd}
                  onChange={e => setCurPwd(e.target.value)}
                  required
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowCur(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-faint)" }}>
                  {showCur ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  className="input w-full pr-9"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-faint)" }}>
                  {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
            {pwdMsg && (
              <p className="text-xs" style={{ color: pwdMsg.ok ? "var(--c-success)" : "var(--c-danger)" }}>
                {pwdMsg.ok && <Check size={11} className="inline mr-1" />}{pwdMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwdSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: "var(--c-accent)" }}
            >
              {pwdSaving ? <Loader2 size={11} className="animate-spin" /> : <Lock size={11} />}
              {pwdSaving ? "Updating…" : "Change Password"}
            </button>
          </form>
        </Section>

        {/* ── Appearance ── */}
        <Section title="Appearance">
          <Row label="Color Theme" hint="Switches between dark and light mode">
            <button
              onClick={toggle}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all"
              style={{
                background:   "var(--c-elevated)",
                borderColor:  "var(--c-border)",
                color:        "var(--c-text)",
              }}
            >
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
          </Row>

          <div>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--c-text)" }}>Font Size</p>
            <p className="text-[11px] mb-3" style={{ color: "var(--c-text-faint)" }}>Affects text across the app</p>
            <div className="flex gap-2">
              {FONT_SIZES.map(s => (
                <button
                  key={s.value}
                  onClick={() => applyFontSize(s.value)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border transition-all"
                  style={{
                    background:  fontSize === s.value ? "var(--c-accent-glow)" : "var(--c-elevated)",
                    borderColor: fontSize === s.value ? "var(--c-accent)"      : "var(--c-border)",
                    color:       fontSize === s.value ? "var(--c-accent-text)" : "var(--c-text-muted)",
                    fontSize:    s.value,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Row label="Compact Mode" hint="Reduces spacing to show more content">
            <Toggle on={compactMode} onChange={applyCompact} />
          </Row>

          <Row label="Animations" hint="Disable if you prefer reduced motion">
            <Toggle on={animations} onChange={applyAnimations} />
          </Row>
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications">
          <Row
            label="@Mention alerts"
            hint="Browser notification when someone mentions you in chat"
          >
            <div className="flex items-center gap-2">
              {typeof Notification !== "undefined" && Notification.permission === "default" && (
                <button
                  onClick={requestNotifPermission}
                  className="text-[11px] px-2 py-1 rounded-lg"
                  style={{ background: "var(--c-accent-glow)", color: "var(--c-accent-text)" }}
                >
                  Enable
                </button>
              )}
              <Toggle on={notifMentions} onChange={setNotifMentions} />
            </div>
          </Row>
          <Row label="Task updates" hint="Notify when a delegation status changes">
            <Toggle on={notifTasks} onChange={setNotifTasks} />
          </Row>
          <Row label="Notification sound" hint="Play a sound with each notification">
            <Toggle on={notifSound} onChange={setNotifSound} />
          </Row>
        </Section>

        {/* ── Keyboard Shortcuts ── */}
        <Section title="Keyboard Shortcuts">
          <div className="space-y-2.5">
            {SHORTCUTS.map(({ keys, desc }) => (
              <div key={desc} className="flex items-center justify-between gap-4">
                <span className="text-sm" style={{ color: "var(--c-text-muted)" }}>{desc}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {keys.map((k, i) => (
                    <span key={i}>
                      <kbd
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold"
                        style={{
                          background:   "var(--c-elevated)",
                          border:       "1px solid var(--c-border)",
                          color:        "var(--c-text)",
                          boxShadow:    "0 1px 0 var(--c-border)",
                        }}
                      >
                        {k}
                      </kbd>
                      {i < keys.length - 1 && (
                        <span className="mx-0.5 text-[10px]" style={{ color: "var(--c-text-faint)" }}>+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Data & Privacy ── */}
        {isAdmin && (
          <Section title="Data & Privacy">
            <Row
              label="Export Data"
              hint="Download all your workspace data as a SQLite file"
            >
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border"
                style={{ background: "var(--c-elevated)", borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}
                onClick={() => alert("Data export is available by copying the file at:\n\nprisma/forma.db\n\nOpen it with any SQLite browser (e.g. DB Browser for SQLite).")}
              >
                <Download size={12} />
                Export DB
              </button>
            </Row>
            <Row
              label="Data Storage"
              hint="All data is stored locally on this machine — nothing is sent to external servers except AI requests."
            >
              <span className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", color: "var(--c-success)" }}>
                Local only
              </span>
            </Row>
          </Section>
        )}

        {/* ── FAQ ── */}
        <Section title="FAQ">
          <div className="-mt-2">
            {FAQ.map(item => (
              <Accordion key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </Section>

        {/* ── Terms & Conditions ── */}
        <Section title="Terms & Conditions">
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            <p>
              <strong style={{ color: "var(--c-text)" }}>Usage:</strong> Forma is a creative workflow tool for internal studio use. You are responsible for all data stored and actions taken within your workspace.
            </p>
            <p>
              <strong style={{ color: "var(--c-text)" }}>Data:</strong> All project, client, and team data is stored locally on your machine. Forma does not transmit your data to any external server except when using AI features (Groq, Gemini), where your moodboard context and messages are sent to the respective AI provider.
            </p>
            <p>
              <strong style={{ color: "var(--c-text)" }}>AI Content:</strong> AI-generated responses are for creative assistance only. Always review AI suggestions before sharing with clients.
            </p>
            <p>
              <strong style={{ color: "var(--c-text)" }}>Liability:</strong> Forma is provided as-is. The developers are not liable for data loss — maintain regular backups of your database file.
            </p>
            <p>
              <strong style={{ color: "var(--c-text)" }}>Updates:</strong> New features may change existing workflows. Breaking changes will be documented in the changelog.
            </p>
          </div>
        </Section>

        {/* ── About ── */}
        <Section title="About Forma">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--c-accent)" }}
            >
              <span className="text-white text-lg font-bold">F</span>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>Forma</p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Creative Workflow OS — Version 0.1.0</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text-faint)" }}>
                Built with Next.js 14 · Prisma · SQLite · Tailwind CSS
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Clients", icon: "👥" },
              { label: "Projects", icon: "📁" },
              { label: "Moodboards", icon: "🎨" },
              { label: "Team Chat", icon: "💬" },
              { label: "Delegations", icon: "🔀" },
              { label: "Time Tracking", icon: "⏱" },
            ].map(f => (
              <div
                key={f.label}
                className="py-3 rounded-xl text-xs"
                style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)", color: "var(--c-text-muted)" }}
              >
                <div className="text-base mb-1">{f.icon}</div>
                {f.label}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Danger zone ── */}
        <Section title="Sign Out">
          <Row label="Sign out of Forma" hint="You will be redirected to the login page">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold border"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)", color: "var(--c-danger)" }}
            >
              Sign Out
            </button>
          </Row>
        </Section>

      </div>
    </div>
  );
}
