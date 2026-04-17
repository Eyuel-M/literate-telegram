"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, AlertCircle } from "lucide-react";
import { CLIENT_COLORS } from "@/lib/utils";

export function NewClientButton() {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    color: CLIENT_COLORS[0],
  });

  function resetAndClose() {
    setOpen(false);
    setError("");
    setForm({ name: "", email: "", company: "", color: CLIENT_COLORS[0] });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Client name is required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        resetAndClose();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Server error (${res.status}). Please try again.`);
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus size={15} /> New Client
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={resetAndClose} />
          <div
            className="relative rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-str)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: "var(--c-text)" }}>New Client</h2>
              <button
                onClick={resetAndClose}
                style={{ color: "var(--c-text-muted)" }}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                  Client name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Nova Labs"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                  Company
                </label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="input"
                  placeholder="Nova Labs Inc."
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  placeholder="hello@client.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--c-text-muted)" }}>
                  Brand color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CLIENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                      style={{
                        background: color,
                        outline: form.color === color ? `2px solid ${color}` : "2px solid transparent",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--c-danger)" }}
                >
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetAndClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.name.trim()}
                  className="btn-primary flex-1 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating…" : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
