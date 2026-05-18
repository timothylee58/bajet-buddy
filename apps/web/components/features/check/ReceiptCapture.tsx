"use client";

import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  ImagePlus,
  ScanLine,
  Sparkles,
  AlertCircle,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { scanReceiptFile } from "@/lib/api";
import { toast } from "sonner";
import type { OCRScanResponse } from "@/types";

interface ReceiptCaptureProps {
  onClose: () => void;
  onComplete: (data: OCRScanResponse) => void;
}

export function ReceiptCapture({ onClose, onComplete }: ReceiptCaptureProps) {
  const [file, setFile] = useState<File | null>(null);
  // preview is a data URL used only for <img> display
  const [preview, setPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<OCRScanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setErrorMsg(null);
      setResult(null);
      setFile(f);
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) =>
          setPreview(event.target?.result as string);
        reader.readAsDataURL(f);
      } else {
        // PDF — no image preview
        setPreview(null);
      }
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const response = await scanReceiptFile(file);

      if (response.status === "ok" && response.scan_result) {
        setResult(response);
        const inserted = response.total_inserted;
        if (inserted > 0) {
          toast.success(
            `${inserted} transaction${inserted !== 1 ? "s" : ""} saved — +${response.xp_earned} XP!`
          );
        }
      } else {
        const msg = response.error || "OCR scan failed.";
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Cannot reach API — is the backend running?";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const summary = result?.spending_summary;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden border border-zinc-800 bg-zinc-900 text-white shadow-2xl rounded-3xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center gap-2">
              <ScanLine size={18} className="text-[#BA6200]" />
              <h3 className="font-bold text-white">
                {result ? "Scan Complete" : file ? "Preview" : "Scan Receipt"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Image area */}
            {!result && (
              <div className="relative">
                {(file && (preview || file.type === "application/pdf")) ? (
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-700">
                    {file.type === "application/pdf" ? (
                      <div className="flex h-48 flex-col items-center justify-center gap-3 bg-zinc-800">
                        <FileText size={48} className="text-[#BA6200]" />
                        <div className="text-center">
                          <p className="font-semibold text-zinc-200 truncate px-4">{file.name}</p>
                          <p className="text-xs text-zinc-500">PDF · first page will be scanned</p>
                        </div>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={preview!}
                        className="w-full max-h-[260px] object-contain bg-zinc-800"
                        alt="Receipt preview"
                      />
                    )}

                    {/* Scanning overlay */}
                    <AnimatePresence>
                      {isScanning && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center bg-zinc-900/90"
                        >
                          <div className="text-center space-y-4">
                            <div className="relative mx-auto h-20 w-20">
                              {[0, 0.5, 1].map((delay) => (
                                <motion.div
                                  key={delay}
                                  className="absolute inset-0 rounded-full border-2 border-[#BA6200]/70"
                                  animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                                  transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    delay,
                                    ease: "easeOut",
                                  }}
                                />
                              ))}
                              <motion.div
                                className="absolute inset-3 rounded-full"
                                style={{
                                  background:
                                    "conic-gradient(from 0deg, transparent, #BA6200, transparent)",
                                }}
                                animate={{ rotate: [0, 360] }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              />
                              <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-zinc-900">
                                <ScanLine size={18} className="text-[#BA6200]" />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">
                                ChatGPT is reading…
                              </p>
                              <motion.p
                                className="text-xs text-zinc-400"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                DeepSeek will summarise next
                              </motion.p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Change / remove buttons */}
                    {!isScanning && (
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            pickImage();
                          }}
                        >
                          Change
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-800 bg-red-900/50 text-red-300 hover:bg-red-900 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setPreview(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={pickImage}
                    className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-800/50 transition hover:border-[#BA6200]/50 hover:bg-[#BA6200]/5"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#BA6200]/20 text-[#BA6200]">
                      <ImagePlus size={32} />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-medium text-zinc-200">
                        Tap to take photo or upload
                      </p>
                      <p className="text-xs text-zinc-500">
                        Receipt · Bank statement · Screenshot
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />

            {/* Error display */}
            {errorMsg && (
              <div className="flex items-start gap-3 rounded-xl border border-red-800 bg-red-900/30 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{errorMsg}</p>
              </div>
            )}

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Success */}
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-700/30 bg-emerald-900/20 p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">
                        {result.total_inserted} transactions saved!
                      </p>
                      <p className="text-xs text-zinc-400">
                        +{result.xp_earned} XP · {result.processing_time_ms.toFixed(0)}ms
                      </p>
                    </div>
                  </div>

                  {/* DeepSeek summary */}
                  {summary && (
                    <div className="rounded-2xl border border-[#BA6200]/25 bg-[#BA6200]/10 p-4 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-[#BA6200]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#BA6200]">
                          DeepSeek Summary
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white">
                        {summary.headline}
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {summary.insight}
                      </p>
                      <div className="flex gap-2">
                        <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-zinc-800/60 px-3 py-2">
                          <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                          <div>
                            <p className="text-[9px] text-zinc-500">Spent</p>
                            <p className="text-xs font-bold text-white">
                              RM{summary.total_debits.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-zinc-800/60 px-3 py-2">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                          <div>
                            <p className="text-[9px] text-zinc-500">In</p>
                            <p className="text-xs font-bold text-white">
                              RM{summary.total_credits.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {summary.savings_tip && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-700/30 bg-amber-900/20 p-2.5">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <p className="text-[11px] text-amber-200">
                            {summary.savings_tip}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              {!file && !result && (
                <Button
                  onClick={pickImage}
                  className="w-full py-6 text-base border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                >
                  <Upload className="mr-2" size={18} />
                  Choose Photo, Screenshot or PDF
                </Button>
              )}

              {file && !result && (
                <Button
                  disabled={isScanning}
                  onClick={handleScan}
                  className="w-full py-6 text-base bg-[#BA6200] hover:bg-[#A05500] text-white font-bold disabled:opacity-50 shadow-lg shadow-[#BA6200]/20"
                >
                  {isScanning ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <ScanLine size={20} />
                      </motion.span>
                      Scanning with AI…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles size={20} />
                      Scan with AI
                    </span>
                  )}
                </Button>
              )}

              {result && (
                <Button
                  onClick={() => onComplete(result)}
                  className="w-full py-6 text-base bg-[#BA6200] hover:bg-[#A05500] text-white font-bold"
                >
                  Review Transactions
                  <ChevronRight className="ml-2" size={18} />
                </Button>
              )}

              <p className="text-center text-[10px] uppercase tracking-widest text-zinc-600">
                ChatGPT OCR · DeepSeek Summary · Supabase DB
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
