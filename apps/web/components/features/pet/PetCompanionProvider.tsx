"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePetCompanion, type UsePetCompanionReturn } from "@/hooks/usePetCompanion";

const PetCompanionContext = createContext<UsePetCompanionReturn | null>(null);

export function PetCompanionProvider({ children }: { children: ReactNode }) {
  const pet = usePetCompanion();
  return (
    <PetCompanionContext.Provider value={pet}>
      {children}
    </PetCompanionContext.Provider>
  );
}

export function usePet(): UsePetCompanionReturn {
  const ctx = useContext(PetCompanionContext);
  if (!ctx) throw new Error("usePet must be used inside PetCompanionProvider");
  return ctx;
}
