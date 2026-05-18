"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGuestMode } from "@/hooks/useGuestMode";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const { enableGuestMode } = useGuestMode();

  const handleGuestMode = () => {
    enableGuestMode();
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background p-6 selection:bg-primary/25">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-secondary/20 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] h-[30%] w-[30%] rounded-full bg-tertiary/15 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="mb-2 inline-flex items-center justify-center rounded-3xl border border-white/80 bg-white/80 p-2 shadow-xl backdrop-blur-md">
            <div className="rounded-2xl bg-primary/15 p-2 text-primary">
              <Sparkles size={24} className="animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-foreground drop-shadow-sm">
            BajetBuddy
          </h1>
          <p className="text-lg font-medium tracking-wide text-muted">
            Duit smart, hidup lega.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="relative group"
        >
          <div className="absolute -inset-[1px] rounded-3xl border border-primary/20"></div>
          
          <div className="relative space-y-6 rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-[0_24px_80px_-32px_rgba(124,92,255,0.35)] backdrop-blur-xl">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Try Guest Mode</h2>
              <p className="text-sm leading-relaxed text-muted">
                No sign-up. Jump straight in. Your data is saved securely on this device.
              </p>
            </div>
            
            <Button
              onClick={handleGuestMode}
              className="relative h-14 w-full overflow-hidden rounded-2xl bg-primary text-lg font-bold text-white shadow-sm transition-all active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                Accept & Continue
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </span>
            </Button>
          </div>
        </motion.div>


      </div>
    </div>
  );
}
