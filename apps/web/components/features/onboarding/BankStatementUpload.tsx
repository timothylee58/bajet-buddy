"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, SkipForward, Loader2, CheckCircle2, FileUp, Database, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { scanReceipt } from "@/lib/api";
import type { OCRScanResponse } from "@/types";

interface BankStatementUploadProps {
  onComplete: (response: OCRScanResponse) => void;
  onSkip: () => void;
}

export function BankStatementUpload({ onComplete, onSkip }: BankStatementUploadProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<OCRScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setIsScanning(true);
    setError(null);

    try {
      const response = await scanReceipt(image);
      setResult(response);
      setIsScanning(false);
    } catch (err: any) {
      setError(err?.message || "Failed to connect to API");
      setIsScanning(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(124,92,255,0.18),_transparent_28rem),radial-gradient(circle_at_bottom_right,_rgba(79,195,247,0.16),_transparent_24rem),linear-gradient(180deg,_#fffefc,_#f7f2ff)] text-foreground">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-md mx-auto w-full">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/80 text-primary shadow-xl backdrop-blur">
            <FileUp size={40} />
          </div>
          <h2 className="text-2xl font-bold">Let's see your spending 🔍</h2>
          <p className="text-sm text-muted">
            Snap a photo or upload your bank statement — even a screenshot works.
            The more data you share, the smarter your AI gets.
          </p>
        </motion.div>

        {/* File area */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="w-full space-y-4"
        >
          {!image && !result && (
            <button
              onClick={pickFile}
              className="flex aspect-[3/2] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-primary/25 bg-white/75 transition-colors hover:border-primary/45 hover:bg-white"
            >
              <ImagePlus size={36} className="text-primary" />
              <span className="text-sm text-muted">Tap to upload your statement 📄</span>
              <span className="text-xs text-neutral">Even a screenshot works — the more, the better ✨</span>
            </button>
          )}

          {image && !result && !isScanning && (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl border-2 border-white/70">
                <img src={image} className="w-full max-h-[200px] object-contain bg-white/60" alt="Statement preview" />
              </div>
              <Button onClick={handleUpload} className="w-full py-6 text-lg text-white">
                <Upload className="mr-2" size={20} />
                Scan Statement
              </Button>
              <button onClick={() => setImage(null)} className="w-full text-xs text-muted hover:text-primary-dark">
                Choose different file
              </button>
            </div>
          )}

          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 py-10"
            >
              <div className="relative mx-auto w-20 h-20">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-brand/50"
                  animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-brand/30"
                  animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: 0.6, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-brand/15"
                  animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: 1.2, ease: "easeOut" }}
                />
                <div className="absolute inset-0 rounded-full flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <FileUp size={28} className="text-brand" />
                  </motion.div>
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Agent 4 is analyzing your statement...</p>
                <motion.p
                  className="text-xs text-muted"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Extracting transactions from every row
                </motion.p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 rounded-2xl border border-white/80 bg-white/85 p-6 shadow-[0_24px_60px_-28px_rgba(124,92,255,0.35)]"
            >
              <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
              <div>
                <p className="text-lg font-bold text-foreground">
                  {result.total_inserted} transactions extracted
                </p>
                <p className="text-sm text-muted">
                  {result.total_inserted} saved to DB · {result.total_failed} failed
                </p>
              </div>

              {result.scan_result?.transactions.slice(0, 3).map((txn: any, i: number) => (
                <div key={i} className="flex justify-between rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground">
                  <span className="truncate">{txn.merchant}</span>
                  <span className="text-muted">RM{txn.amount.toFixed(2)}</span>
                </div>
              ))}

              <div className="flex items-center justify-center gap-2 text-sm text-primary-dark">
                <Database size={14} />
                <span>+{result.xp_earned} XP</span>
              </div>

              <Button onClick={() => onComplete(result)} className="w-full py-6 text-lg text-white">
                Continue to Dashboard
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Error */}
        {error && (
          <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,.pdf"
          onChange={handleFileChange}
        />

        {/* Skip */}
        {!result && !isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <button onClick={onSkip} className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary-dark">
              <SkipForward size={16} />
I'll do this later — take me to the app
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
