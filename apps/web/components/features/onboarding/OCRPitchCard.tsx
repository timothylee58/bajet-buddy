"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ArrowRight, SkipForward, FileUp } from "lucide-react";
import { motion } from "framer-motion";

interface OCRPitchCardProps {
  onScan: () => void;
  onSkipToQuestions: () => void;
  onSkipToApp: () => void;
}

export function OCRPitchCard({
  onScan,
  onSkipToQuestions,
  onSkipToApp,
}: OCRPitchCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onScan();
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.2),_transparent_28rem),radial-gradient(circle_at_bottom_right,_rgba(79,195,247,0.18),_transparent_24rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)] text-foreground selection:bg-primary/25">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] h-[60%] w-[60%] rounded-full bg-primary/20 blur-[130px]" />
        <div className="absolute bottom-[10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-secondary/20 blur-[120px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md space-y-10">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center space-y-6"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-brand/30 blur-2xl rounded-full" />
              <div className="relative mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-[0_24px_60px_-28px_rgba(124,92,255,0.35)]">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-50" />
                <FileUp size={48} className="text-primary drop-shadow-[0_0_15px_rgba(124,92,255,0.35)]" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-primary to-tertiary">
                Snap, Upload, Drop PDFs
              </h2>
              <p className="mx-auto max-w-sm text-lg leading-relaxed text-muted">
                BajetBuddy reads your receipts and bank statements so you don't have to type.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="space-y-8"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,application/pdf" 
              capture="environment"
              onChange={handleFileChange}
            />
            
            <div className="relative group">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-secondary to-tertiary blur opacity-40 transition duration-500 group-hover:opacity-70"></div>
              <Button 
                onClick={handleFileClick}
                className="relative w-full rounded-2xl border border-white/80 bg-white/90 py-8 text-xl font-bold text-foreground shadow-[0_24px_60px_-24px_rgba(124,92,255,0.35)] transition-all active:scale-[0.98]"
              >
                <Camera className="mr-3 text-primary" size={28} />
                Try with a file now
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/80" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold">
                <span className="bg-background px-4 text-muted">or</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button 
                variant="outline" 
                onClick={onSkipToQuestions}
                className="w-full justify-between rounded-2xl py-7 backdrop-blur-md transition-colors shadow-lg"
              >
                <span className="text-base font-medium">Skip → answer a few fun questions</span>
                <ArrowRight size={18} className="text-muted" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={onSkipToApp}
                className="w-full justify-center rounded-2xl py-6 text-muted transition-colors hover:bg-primary-light/60 hover:text-primary-dark"
              >
                <SkipForward size={18} className="mr-2 opacity-70" />
                <span className="font-medium">Skip → go straight to the app</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
