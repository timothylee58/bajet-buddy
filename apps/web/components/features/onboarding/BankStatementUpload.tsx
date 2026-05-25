"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Upload,
  SkipForward,
  CheckCircle2,
  FileUp,
  Database,
  ImagePlus,
  Sparkles,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  ScanLine,
  AlertCircle,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { scanReceiptFile } from "@/lib/api";
import type { OCRScanResponse } from "@/types";

interface BankStatementUploadProps {
  onComplete: (response: OCRScanResponse) => void;
  onSkip: () => void;
}

export function BankStatementUpload({
  onComplete,
  onSkip,
}: BankStatementUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<OCRScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setError(null);
      setFile(f);
      // Only generate preview for images (PDF shows icon instead)
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => setPreview(event.target?.result as string);
        reader.readAsDataURL(f);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsScanning(true);
    setError(null);

    try {
      const response = await scanReceiptFile(file);
      if (response.status === "ok" && response.scan_result) {
        setResult(response);
      } else {
        throw new Error(response.error ?? "OCR scan failed");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect to API";
      setError(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const summary = result?.spending_summary;

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="flex flex-1 flex-col items-center justify-center p-6 max-w-md mx-auto w-full gap-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#BA6200]/20 text-[#BA6200] border border-[#BA6200]/30">
            <ScanLine size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Let&apos;s see your spending 🔍
          </h2>
          <p className="text-sm text-zinc-400">
            Snap a photo or upload your bank statement — even a screenshot
            works. ChatGPT reads it, DeepSeek summarises it.
          </p>
        </motion.div>

        {/* Upload / Scan area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full space-y-4"
        >
          {!file && !result && (
            <button
              onClick={pickFile}
              className="flex aspect-[3/2] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 transition hover:border-[#BA6200]/50 hover:bg-[#BA6200]/5"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#BA6200]/20 text-[#BA6200]">
                <ImagePlus size={32} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white">
                  Tap to upload your statement 📄
                </p>
                <p className="text-xs text-zinc-500">
                  Receipt · Bank statement · Screenshot · PDF
                </p>
              </div>
            </button>
          )}

          {file && !result && (
            <div className="space-y-3">
              {preview ? (
                <div className="relative overflow-hidden rounded-2xl border border-white/10">
                  <Image
                    src={preview}
                    alt="Statement preview"
                    width={400}
                    height={200}
                    className="w-full max-h-[200px] object-contain bg-zinc-800"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <FileText size={32} className="text-[#BA6200]" />
                  <div>
                    <p className="font-semibold text-white truncate">{file.name}</p>
                    <p className="text-xs text-zinc-400">PDF · first page will be scanned</p>
                  </div>
                </div>
              )}
              {!isScanning && (
                <>
                  <Button
                    onClick={handleUpload}
                    className="w-full py-6 text-lg bg-[#BA6200] hover:bg-[#A05500] text-white font-bold shadow-lg shadow-[#BA6200]/30"
                  >
                    <Sparkles className="mr-2" size={20} />
                    Scan with AI
                  </Button>
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition"
                  >
                    Choose different file
                  </button>
                </>
              )}
            </div>
          )}

          {/* Scanning animation */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-5 py-10"
              >
                <div className="relative mx-auto h-24 w-24">
                  {[0, 0.6, 1.2].map((delay) => (
                    <motion.div
                      key={delay}
                      className="absolute inset-0 rounded-full border-2 border-[#BA6200]/60"
                      animate={{ scale: [1, 1.7], opacity: [0.8, 0] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <ScanLine size={32} className="text-[#BA6200]" />
                    </motion.div>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold text-white">
                    ChatGPT is reading your document…
                  </p>
                  <motion.p
                    className="text-sm text-zinc-400"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    DeepSeek will then summarise your spending
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* DB summary */}
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <CheckCircle2 className="text-emerald-400 shrink-0" size={24} />
                  <div>
                    <p className="font-bold text-white">
                      {result.total_inserted} transactions saved!
                    </p>
                    <p className="text-sm text-zinc-400">
                      {result.total_failed} failed ·{" "}
                      <Database className="inline h-3 w-3" /> Supabase ·{" "}
                      <span className="text-yellow-400">
                        +{result.xp_earned} XP
                      </span>
                    </p>
                  </div>
                </div>

                {/* DeepSeek AI summary */}
                {summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl border border-[#BA6200]/25 bg-[#BA6200]/10 p-5 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#BA6200]" />
                      <span className="text-xs font-bold uppercase tracking-widest text-[#BA6200]">
                        DeepSeek AI Summary
                      </span>
                    </div>
                    <p className="font-bold text-white">{summary.headline}</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {summary.insight}
                    </p>
                    <div className="flex gap-3">
                      <div className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-white/5 py-3">
                        <TrendingDown className="h-4 w-4 text-red-400" />
                        <p className="text-[10px] text-zinc-400">Spent</p>
                        <p className="text-sm font-bold text-white">
                          RM{summary.total_debits.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-white/5 py-3">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <p className="text-[10px] text-zinc-400">Received</p>
                        <p className="text-sm font-bold text-white">
                          RM{summary.total_credits.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {summary.savings_tip && (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                        <p className="text-xs text-amber-200">
                          {summary.savings_tip}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Transaction preview */}
                {result.scan_result?.transactions && result.scan_result.transactions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      Sample transactions
                    </p>
                    {result.scan_result.transactions.slice(0, 3).map(
                      (txn, i) => (
                        <div
                          key={i}
                          className="flex justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm"
                        >
                          <span className="truncate text-zinc-300">
                            {txn.merchant}
                          </span>
                          <span
                            className={
                              txn.transaction_type === "credit"
                                ? "text-emerald-400 font-semibold"
                                : "text-zinc-400"
                            }
                          >
                            {txn.transaction_type === "credit" ? "+" : "-"}RM
                            {txn.amount.toFixed(2)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}

                <Button
                  onClick={() => onComplete(result)}
                  className="w-full py-6 text-lg bg-[#BA6200] hover:bg-[#A05500] text-white font-bold shadow-lg shadow-[#BA6200]/30"
                >
                  Continue to Dashboard →
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-300">Scan failed</p>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
        />

        {/* Skip */}
        {!result && !isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={onSkip}
              className="flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              <SkipForward size={16} />
              I&apos;ll do this later — take me to the app
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
