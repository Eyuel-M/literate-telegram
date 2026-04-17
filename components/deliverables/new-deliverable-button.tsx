"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { DELIVERABLE_TYPES } from "@/lib/utils";

interface Props {
  projectId: string;
}

export function NewDeliverableButton({ projectId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "LOGO",
    dueDate: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId }),
      });
      if (res.ok) {
        setOpen(false);
        setForm({ name: "", description: "", type: "LOGO", dueDate: "" });
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary flex items-center gap-2">
        <Plus size={15} /> Add Deliverable
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#13131f] border border-[#2a2a40] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#f0f0f8]">New Deliverable</h2>
              <button onClick={() => setOpen(false)} className="text-[#6b6b85] hover:text-[#f0f0f8]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Primary Logo"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="input"
                >
                  {DELIVERABLE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input resize-none h-16"
                  placeholder="Brief description…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                  {loading ? "Creating…" : "Add Deliverable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
