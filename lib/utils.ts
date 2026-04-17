import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatRelative(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(date);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const STATUS_LABELS: Record<string, string> = {
  DISCOVERY: "Discovery",
  IN_PROGRESS: "In Progress",
  REVIEW: "In Review",
  DELIVERED: "Delivered",
  ARCHIVED: "Archived",
  PENDING: "Pending",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DRAFT: "Draft",
  SENT: "Sent",
};

export const STATUS_COLORS: Record<string, string> = {
  DISCOVERY: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  IN_PROGRESS: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  REVIEW: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  IN_REVIEW: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  DELIVERED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  ARCHIVED: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
  PENDING: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  APPROVED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  REJECTED: "text-red-400 bg-red-400/10 border-red-400/20",
  DRAFT: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  SENT: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  ACTIVE: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  INACTIVE: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

export const DELIVERABLE_TYPES = [
  { value: "LOGO", label: "Logo" },
  { value: "BRAND_IDENTITY", label: "Brand Identity" },
  { value: "BUSINESS_CARD", label: "Business Card" },
  { value: "LETTERHEAD", label: "Letterhead" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "WEBSITE", label: "Website" },
  { value: "OTHER", label: "Other" },
];

export const PROJECT_STATUSES = [
  { value: "DISCOVERY", label: "Discovery" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "In Review" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "ARCHIVED", label: "Archived" },
];

export const DELIVERABLE_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export const CLIENT_COLORS = [
  "#7c3aed", "#3b82f6", "#f59e0b", "#10b981",
  "#ef4444", "#ec4899", "#06b6d4", "#f97316",
];
