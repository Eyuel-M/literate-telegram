"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Layers, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState("eyuel@studio.os");
  const [password, setPassword] = useState("admin2024");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--c-bg)" }}
    >
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
            style={{ background: "var(--c-accent)" }}
          >
            <Layers size={22} className="text-white" />
          </div>
          <p className="text-xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
            Eyuel Mulat
          </p>
          <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>Creative Studio OS</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--c-text)" }}>
            Welcome back
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--c-text-muted)" }}>
            Sign in to your workspace
          </p>

          {/* Admin hint */}
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6"
            style={{ background: "var(--c-accent-glow)", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <ShieldCheck size={15} style={{ color: "var(--c-accent-text)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--c-accent-text)" }}>
                Admin credentials pre-filled
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                Run <code style={{ color: "var(--c-accent-text)" }}>npm run db:reset</code> to (re)seed demo data
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="you@studio.com" required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="••••••••" required
              />
            </div>

            {error && <p className="text-sm" style={{ color: "var(--c-danger)" }}>{error}</p>}

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--c-text-faint)" }}>
          Eyuel Mulat — Creative Studio OS v0.2
        </p>
      </div>
    </div>
  );
}
