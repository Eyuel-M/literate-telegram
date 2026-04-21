export type PlanKey = "TRIAL" | "FREE" | "PRO" | "AGENCY";

export interface PlanConfig {
  label:      string;
  maxMembers: number; // -1 = unlimited
  maxClients: number; // -1 = unlimited
  aiAccess:   boolean;
  priceEtb?:  number; // monthly price in Ethiopian Birr
  priceUsd?:  number; // monthly price in USD
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  TRIAL:  { label: "Free Trial", maxMembers: 10, maxClients: 20,  aiAccess: true,  priceEtb: 0,    priceUsd: 0    },
  FREE:   { label: "Free",       maxMembers: 3,  maxClients: 5,   aiAccess: false, priceEtb: 0,    priceUsd: 0    },
  PRO:    { label: "Pro",        maxMembers: 15, maxClients: 100, aiAccess: true,  priceEtb: 1200, priceUsd: 20   },
  AGENCY: { label: "Agency",     maxMembers: -1, maxClients: -1,  aiAccess: true,  priceEtb: 3000, priceUsd: 50   },
};

export const TRIAL_DAYS = 14;

export function getPlan(plan: string): PlanConfig {
  return PLANS[(plan as PlanKey)] ?? PLANS.FREE;
}

export function isWorkspaceActive(status: string, expiresAt: Date | null | string): boolean {
  if (status === "CANCELLED") return false;
  if (status === "EXPIRED")   return false;
  if (expiresAt && new Date(expiresAt) < new Date()) return false;
  return true;
}

export function trialDaysLeft(expiresAt: Date | null | string): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
