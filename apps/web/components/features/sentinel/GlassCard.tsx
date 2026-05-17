import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "brand" | "amber" | "rose" | "none";
}

const glowMap = {
  brand: "shadow-[0_0_40px_-12px_rgba(186,98,0,0.4)]",
  amber: "shadow-[0_0_40px_-12px_rgba(217,119,6,0.45)]",
  rose: "shadow-[0_0_40px_-12px_rgba(225,29,72,0.4)]",
  none: "",
};

export function GlassCard({ children, className, glow = "none" }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/20 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60",
        glowMap[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
