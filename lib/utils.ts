import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatRelativeDays(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 1) return "hoje";
  if (diff === 1) return "1 dia";
  if (diff < 30) return `${diff} dias`;
  if (diff < 365) return `${Math.floor(diff / 30)} meses`;
  const years = Math.floor(diff / 365);
  const months = Math.floor((diff % 365) / 30);
  return months > 0 ? `${years}a ${months}m` : `${years} anos`;
}

export function deltaPercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}
