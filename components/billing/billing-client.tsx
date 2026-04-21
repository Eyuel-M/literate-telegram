"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, Users, Folder, Zap, Mail, ArrowRight, Clock } from "lucide-react";
import { PLANS, getPlan, trialDaysLeft, type PlanKey } from "@/lib/plans";

interface Workspace {
  id:                    string;
  name:                  string;
  plan:                  string;
  subscriptionStatus:    string;
  subscriptionExpiresAt: Date | string | null;
  _count: { users: number; clients: number; teamMembers: number };
}

interface Props { workspace: Workspace }

const PLAN_KEYS: PlanKey[] = ["FREE", "PRO", "AGENCY"];

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  TRIAL:  ["Full Pro access for 14 days", "Up to 10 team members", "Up to 20 clients", "AI design assistant", "All templates"],
  FREE:   ["1 admin user", "Up to 3 team members", "Up to 5 clients", "No AI access", "Preset templates"],
  PRO:    ["Up to 15 team members", "Up to 100 clients", "AI design assistant", "All templates", "Priority support"],
  AGENCY: ["Unlimited team members", "Unlimited clients", "AI design assistant", "All templates", "Priority support", "Early access to new features"],
};

export function BillingClient({ workspace }: Props) {
  const plan    = getPlan(workspace.plan);
  const daysLeft = workspace.plan === "TRIAL" ? trialDaysLeft(workspace.subscriptionExpiresAt) : null;
  const isTrial  = workspace.plan === "TRIAL";
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--c-text)" }}>Billing & Plan</h1>
          <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
            Manage your workspace subscription for <strong style={{ color: "var(--c-text)" }}>{workspace.name}</strong>
          </p>
        </div>

        {/* Current plan card */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "var(--c-accent-glow)", color: "var(--c-accent-text)" }}
                >
                  {plan.label}
                </span>
                {workspace.subscriptionStatus === "ACTIVE" && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#d1fae5", color: "#065f46" }}>
                    Active
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold mt-2" style={{ color: "var(--c-text)" }}>
                {isTrial ? "Free Trial" : plan.priceEtb === 0 ? "Free" : `${plan.priceEtb?.toLocaleString()} ETB / month`}
              </h2>
              {isTrial && daysLeft !== null && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Clock size={13} style={{ color: daysLeft <= 3 ? "var(--c-danger)" : "var(--c-text-muted)" }} />
                  <p className="text-sm" style={{ color: daysLeft <= 3 ? "var(--c-danger)" : "var(--c-text-muted)" }}>
                    {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : "Trial expired"}
                  </p>
                </div>
              )}
            </div>

            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 justify-end text-sm" style={{ color: "var(--c-text-muted)" }}>
                <Users size={13} />
                <span>{workspace._count.users} / {plan.maxMembers === -1 ? "∞" : plan.maxMembers} users</span>
              </div>
              <div className="flex items-center gap-2 justify-end text-sm" style={{ color: "var(--c-text-muted)" }}>
                <Folder size={13} />
                <span>{workspace._count.clients} / {plan.maxClients === -1 ? "∞" : plan.maxClients} clients</span>
              </div>
              {plan.aiAccess && (
                <div className="flex items-center gap-2 justify-end text-sm" style={{ color: "var(--c-accent-text)" }}>
                  <Zap size={13} />
                  <span>AI access</span>
                </div>
              )}
            </div>
          </div>

          <ul className="mt-5 space-y-2">
            {PLAN_FEATURES[workspace.plan as PlanKey]?.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-muted)" }}>
                <CheckCircle size={13} style={{ color: "#10b981", flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade options */}
        {workspace.plan !== "AGENCY" && (
          <>
            <h3 className="text-base font-semibold mb-4" style={{ color: "var(--c-text)" }}>
              {isTrial ? "Choose your plan after trial" : "Upgrade your plan"}
            </h3>

            <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {PLAN_KEYS.filter((k) => k !== "FREE" || workspace.plan === "TRIAL").map((key) => {
                const p        = PLANS[key];
                const isCurrent = workspace.plan === key;
                return (
                  <div
                    key={key}
                    className="rounded-2xl p-5"
                    style={{
                      background: isCurrent ? "var(--c-accent-glow)" : "var(--c-elevated)",
                      border:     isCurrent ? "1.5px solid var(--c-accent)" : "1px solid var(--c-border)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{p.label}</p>
                      {key === "PRO" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "var(--c-accent)", color: "#fff" }}>
                          Popular
                        </span>
                      )}
                    </div>

                    <p className="text-xl font-bold mb-1" style={{ color: "var(--c-text)" }}>
                      {p.priceEtb === 0 ? "Free" : `${p.priceEtb?.toLocaleString()} ETB`}
                    </p>
                    {p.priceEtb !== 0 && (
                      <p className="text-xs mb-4" style={{ color: "var(--c-text-muted)" }}>per month</p>
                    )}

                    <ul className="space-y-1.5 mb-5">
                      {PLAN_FEATURES[key].map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: "var(--c-text-muted)" }}>
                          <CheckCircle size={11} style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {!isCurrent && (
                      <button
                        onClick={() => setContactOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                        style={{ background: key === "AGENCY" ? "var(--c-accent)" : "var(--c-bg)", color: key === "AGENCY" ? "#fff" : "var(--c-accent-text)", border: "1px solid var(--c-accent)" }}
                      >
                        Upgrade to {p.label}
                        <ArrowRight size={11} />
                      </button>
                    )}
                    {isCurrent && (
                      <p className="text-xs text-center font-medium" style={{ color: "var(--c-accent-text)" }}>Current plan</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Contact to upgrade */}
        {contactOpen && (
          <div
            className="rounded-2xl p-6 mb-8"
            style={{ background: "var(--c-elevated)", border: "1.5px solid var(--c-accent)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Mail size={16} style={{ color: "var(--c-accent-text)" }} />
              <h4 className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>Contact us to upgrade</h4>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--c-text-muted)" }}>
              To upgrade your plan, send us an email with your workspace name (<strong style={{ color: "var(--c-text)" }}>{workspace.name}</strong>) and the plan you want. We'll activate it within 24 hours.
            </p>
            <a
              href={`mailto:billing@forma.app?subject=Upgrade%20request%20—%20${encodeURIComponent(workspace.name)}&body=Workspace%3A%20${encodeURIComponent(workspace.name)}%0AWorkspace%20ID%3A%20${workspace.id}%0A%0ARequested%20plan%3A%20`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Mail size={13} />
              Send upgrade request
            </a>
          </div>
        )}

        {/* Forma branding */}
        <div className="flex items-center gap-2 mt-4">
          <Sparkles size={13} style={{ color: "var(--c-accent-text)" }} />
          <p className="text-xs" style={{ color: "var(--c-text-faint)" }}>
            Forma — Built for independent design studios. Questions? billing@forma.app
          </p>
        </div>
      </div>
    </div>
  );
}
