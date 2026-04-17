"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, X } from "lucide-react";

interface Props {
  projectId: string;
  deliverableId?: string;
}

export function TimeLogButton({ projectId, deliverableId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    hours: "",
    minutes: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const duration = (parseInt(form.hours || "0") * 60) + parseInt(form.minutes || "0");
    if (duration <= 0) return;

    setLoading(true);
    try {
      await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration,
          description: form.description,
          date: form.date,
          projectId,
          deliverableId,
        }),
      });
      setOpen(false);
      setForm({ hours: "", minutes: "", description: "", date: new Date().toISOString().split("T")[0] });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary flex items-center gap-2">
        <Clock size={14} /> Log Time
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#13131f] border border-[#2a2a40] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#f0f0f8]">Log Time</h2>
              <button onClick={() => setOpen(false)} className="text-[#6b6b85] hover:text-[#f0f0f8]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={form.hours}
                      onChange={(e) => setForm({ ...form, hours: e.target.value })}
                      className="input pr-10"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3a3a50]">hrs</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={form.minutes}
                      onChange={(e) => setForm({ ...form, minutes: e.target.value })}
                      className="input pr-10"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#3a3a50]">min</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  placeholder="What did you work on?"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
                  {loading ? "Saving…" : "Log Time"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
