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
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center p-6 bg-zinc-950 overflow-hidden selection:bg-brand/30">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="inline-flex items-center justify-center p-2 mb-2 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-md shadow-2xl">
            <div className="bg-brand/20 p-2 rounded-xl text-brand-light">
              <Sparkles size={24} className="animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-sm">
            BajetBuddy
          </h1>
          <p className="text-lg text-zinc-400 font-medium tracking-wide">
            Duit smart, hidup lega.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="relative group"
        >
          {/* Animated glowing border effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-brand via-emerald-400 to-blue-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
          
          <div className="relative p-8 space-y-6 rounded-3xl bg-zinc-900/80 border border-zinc-800/50 backdrop-blur-xl shadow-2xl">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">Try Guest Mode</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                No sign-up. Jump straight in. Your data is saved securely on this device.
              </p>
            </div>
            
            <Button
              onClick={handleGuestMode}
              className="relative w-full h-14 bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-lg rounded-2xl transition-all active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] overflow-hidden group/btn"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
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
