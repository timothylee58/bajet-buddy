"use client";

import { cn } from "@/lib/utils";

interface NumPadProps {
  value: string;
  onChange: (val: string) => void;
}

const KEYS = [
  "1", "2", "3",
  "4", "5", "6",
  "7", "8", "9",
  ".", "0", "⌫",
] as const;

export function NumPad({ value, onChange }: NumPadProps) {
  function handleKey(key: string) {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    // Prevent multiple dots
    if (key === "." && value.includes(".")) return;
    // Limit to 2 decimal places
    const dotIdx = value.indexOf(".");
    if (dotIdx !== -1 && value.length - dotIdx > 2) return;
    // Limit total length
    if (value.replace(".", "").length >= 7) return;

    onChange(value + key);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          onClick={() => handleKey(key)}
          aria-label={key === "⌫" ? "Backspace" : key}
          data-testid={key === "⌫" ? "numpad-backspace" : `numpad-${key}`}
          className={cn(
            "rounded-2xl py-4 text-xl font-semibold transition-colors active:scale-95",
            key === "⌫"
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          )}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
