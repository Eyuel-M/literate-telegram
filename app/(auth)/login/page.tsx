"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("alex@forma.studio");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c14] px-4">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 bg-violet-700 rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9L9 3L15 9L9 15L3 9Z" fill="white" />
              <path d="M9 6L12 9L9 12L6 9L9 6Z" fill="rgba(255,255,255,0.4)" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight text-[#f0f0f8]">Forma</span>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-[#f0f0f8] mb-1">Welcome back</h1>
          <p className="text-[#6b6b85] text-sm mb-7">Sign in to your creative workspace</p>

          {/* Demo hint */}
          <div className="bg-violet-700/10 border border-violet-700/20 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-violet-300 font-medium mb-1">Demo credentials pre-filled</p>
            <p className="text-xs text-[#6b6b85]">Run <code className="text-violet-300">npm run db:seed</code> to populate sample data</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@studio.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6b6b85] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#3a3a50] mt-6">
          Forma — Creative Workflow OS v0.1
        </p>
      </div>
    </div>
  );
}
