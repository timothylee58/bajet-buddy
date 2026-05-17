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
    <div className="flex flex-col min-h-[100dvh] bg-zinc-950 text-white selection:bg-brand/30 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand/20 blur-[130px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
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
              <div className="relative flex h-28 w-28 mx-auto items-center justify-center rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-brand/20 to-transparent opacity-50" />
                <FileUp size={48} className="text-brand-light drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-400">
                Snap, Upload, Drop PDFs
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-sm mx-auto">
                BajetBuddy reads your receipts and bank statements so you don&apos;t have to type.
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
              <div className="absolute -inset-[1px] bg-gradient-to-r from-brand to-emerald-400 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
              <Button 
                onClick={handleFileClick}
                className="relative w-full py-8 text-xl font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 rounded-2xl transition-all active:scale-[0.98] text-white shadow-2xl"
              >
                <Camera className="mr-3 text-brand" size={28} />
                Try with a file now
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold">
                <span className="bg-zinc-950 px-4 text-zinc-600">or</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button 
                variant="outline" 
                onClick={onSkipToQuestions}
                className="w-full justify-between py-7 rounded-2xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-md text-zinc-300 transition-colors shadow-lg"
              >
                <span className="text-base font-medium">Skip → answer a few fun questions</span>
                <ArrowRight size={18} className="text-zinc-500" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={onSkipToApp}
                className="w-full justify-center py-6 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-2xl transition-colors"
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
