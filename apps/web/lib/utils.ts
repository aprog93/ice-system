import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("es-CU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: string | Date): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("es-CU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatCurrency(amount: number | string, currency: string = "USD"): string {
  if (!amount) return "N/A";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-CU", {
    style: "currency",
    currency,
  }).format(num);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function isDateExpired(date: string | Date): boolean {
  const expiry = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry < today;
}

export function getDaysUntilExpiry(date: string | Date): number {
  const expiry = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(date: string | Date): "expired" | "warning" | "ok" {
  const days = getDaysUntilExpiry(date);
  if (days < 0) return "expired";
  if (days <= 30) return "warning";
  return "ok";
}
