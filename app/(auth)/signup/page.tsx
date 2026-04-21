"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [studioName, setStudioName] = useState("");
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters"); return; }

    setLoading(true);

    const res = await fetch("/api/signup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ studioName, name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    // Auto sign-in after account creation
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    if (signInRes?.error) {
      setError("Account created. Please sign in.");
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
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
          <p className="text-xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>Forma</p>
          <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>Creative Workflow OS</p>
        </div>

        {/* Trial banner */}
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6"
          style={{ background: "var(--c-accent-glow)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <Sparkles size={15} style={{ color: "var(--c-accent-text)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--c-accent-text)" }}>14-day free trial</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
              Full Pro access. No credit card required.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--c-text)" }}>
            Create your studio
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--c-text-muted)" }}>
            Set up your workspace in seconds
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Studio / Agency name
              </label>
              <input
                type="text" value={studioName} onChange={(e) => setStudioName(e.target.value)}
                className="input" placeholder="Acme Design Studio" required autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Your name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="input" placeholder="Jane Smith" required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="jane@studio.com" required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input" placeholder="8+ characters" required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-muted)" }}>Confirm password</label>
              <input
                type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="input" placeholder="Repeat password" required
              />
            </div>

            {error && <p className="text-sm" style={{ color: "var(--c-danger)" }}>{error}</p>}

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating workspace…" : "Create workspace"}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: "var(--c-text-faint)" }}>
            Already have a workspace?{" "}
            <Link href="/login" className="font-medium" style={{ color: "var(--c-accent-text)" }}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--c-text-faint)" }}>
          Forma — Creative Workflow OS v1.0
        </p>
      </div>
    </div>
  );
}
