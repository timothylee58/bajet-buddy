"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type FontSize = "sm" | "md" | "lg" | "xl";

const STORAGE_KEY = "bb-font-size";
const DEFAULT: FontSize = "lg"; // +2px feel by default as per request

interface TextSizeCtx {
  size: FontSize;
  setSize: (s: FontSize) => void;
}

const Ctx = createContext<TextSizeCtx>({ size: DEFAULT, setSize: () => {} });

export function TextSizeProvider({ children }: { children: React.ReactNode }) {
  const [size, setRaw] = useState<FontSize>(DEFAULT);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as FontSize | null;
    const initial = saved ?? DEFAULT;
    setRaw(initial);
    document.documentElement.setAttribute("data-font-size", initial);
  }, []);

  const setSize = useCallback((s: FontSize) => {
    setRaw(s);
    localStorage.setItem(STORAGE_KEY, s);
    document.documentElement.setAttribute("data-font-size", s);
  }, []);

  return <Ctx.Provider value={{ size, setSize }}>{children}</Ctx.Provider>;
}

export function useTextSize() {
  return useContext(Ctx);
}
