"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { CLIENT_COLORS } from "@/lib/utils";

export function NewClientButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    color: CLIENT_COLORS[0],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setOpen(false);
        setForm({ name: "", email: "", company: "", color: CLIENT_COLORS[0] });
        router.refresh();
      }
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#13131f] border border-[#2a2a40] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#f0f0f8]">New Client</h2>
              <button onClick={() => setOpen(false)} className="text-[#6b6b85] hover:text-[#f0f0f8] transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Client name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Company</label>
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="input"
                  placeholder="Acme Corporation Ltd."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  placeholder="hello@acme.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-2">Brand color</label>
                <div className="flex gap-2">
                  {CLIENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className="w-7 h-7 rounded-lg transition-all"
                      style={{
                        background: color,
                        outline: form.color === color ? `2px solid ${color}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
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
