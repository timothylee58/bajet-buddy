import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatRM(amount: number) {
  return `RM${amount.toLocaleString("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatSignedRM(amount: number) {
  const abs = Math.abs(amount);
  if (amount < 0) {
    return `-${formatRM(abs)}`;
  }
  return formatRM(abs);
}

export function formatLifeHours(hours: number): string {
  if (hours >= 8) return `${(hours / 8).toFixed(1)} working days`;
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  return `${hours.toFixed(1)} hours`;
}
