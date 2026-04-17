"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

const VERSION_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent to client" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Needs revision" },
];

interface Props {
  deliverableId: string;
}

export function NewVersionButton({ deliverableId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({ notes: "", status: "DRAFT" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, deliverableId }),
      });
      if (res.ok) {
        setOpen(false);
        setForm({ notes: "", status: "DRAFT" });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus size={15} /> New Version
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#13131f] border border-[#2a2a40] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#f0f0f8]">New Version</h2>
              <button onClick={() => setOpen(false)} className="text-[#6b6b85] hover:text-[#f0f0f8]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Version notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input resize-none h-24"
                  placeholder="What changed in this version? Key decisions, client requests addressed…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input"
                >
                  {VERSION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#1a1a2e] border border-[#2a2a40] rounded-xl p-3">
                <p className="text-xs text-[#6b6b85]">
                  After creating this version, you can add assets by pasting URLs into the asset URL field. Full file upload support coming in v0.2.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                  {loading ? "Creating…" : "Create Version"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
