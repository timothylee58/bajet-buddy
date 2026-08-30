"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Receipt,
  Landmark,
  Wallet,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  Database,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { scanReceiptFile, awardPetXP } from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { WALLET_PROVIDER_LABEL } from "@/lib/constants";
import type { OCRScanResponse, OCRTransaction } from "@/types";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍜",
  groceries: "🛒",
  shopping: "🛍️",
  transport: "🚗",
  utilities: "⚡",
  health: "💊",
  entertainment: "🎬",
  income: "💰",
  other: "📦",
};

function TxnRow({ txn, idx }: { txn: OCRTransaction; idx: number }) {
  const isCredit = txn.transaction_type === "credit";
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-lg">
        {CATEGORY_EMOJI[txn.category] ?? "📦"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {txn.merchant || "Unknown"}
        </p>
        <p className="text-xs capitalize text-zinc-400">
          {txn.category}
          {txn.date ? ` · ${txn.date}` : ""}
        </p>
      </div>
      <span
        className={`shrink-0 text-sm font-bold ${
          isCredit ? "text-emerald-600" : "text-zinc-900"
        }`}
      >
        {isCredit ? "+" : "-"}RM{txn.amount.toFixed(2)}
      </span>
    </motion.div>
  );
}

export function ReceiptScanner() {
  const [file, setFile] = useState<File | null>(null);
  // preview is a data URL used only for <img> display
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<OCRScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  function handleFile(selected: File) {
    setFile(selected);
    setResult(null);
    setError(null);
    setShowAll(false);
    // Generate a data URL only for preview display (not sent to API)
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const selected = e.dataTransfer.files?.[0];
    if (selected) handleFile(selected);
  }

  async function onScan() {
    if (!file) return;
    setScanning(true);
    setError(null);
    try {
      // Use FormData multipart upload — correct MIME type, supports PDF
      const response = await scanReceiptFile(file);
      if (response.status === "ok" && response.scan_result) {
        setResult(response);
        const inserted = response.total_inserted;
        awardPetXP({ event: "receipt_scan", amount_rm: response.scan_result.total_amount }).catch(() => {});
        success(
          inserted > 0
            ? `${inserted} transaction${inserted !== 1 ? "s" : ""} saved! +${response.xp_earned} XP 🎉`
            : "Receipt scanned — no new transactions to save."
        );
      } else {
        throw new Error(response.error ?? "OCR scan failed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toastError(msg, "SCAN_FAILED");
    } finally {
      setScanning(false);
    }
  }

  function onReset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setShowAll(false);
  }

  const scanResult = result?.scan_result;
  const summary = result?.spending_summary;
  const visibleTxns = showAll
    ? (scanResult?.transactions ?? [])
    : (scanResult?.transactions ?? []).slice(0, 4);

  return (
    <div className="flex flex-col gap-5 p-4 pb-8 max-w-md mx-auto">
      {/* Header */}
      <div className="pt-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#BA6200]/10 px-4 py-1.5 text-sm font-semibold text-[#BA6200] mb-3">
          <ScanLine className="h-4 w-4" />
          Agent 4 — Receipt Scanner
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Scan Receipt</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload any receipt or bank statement — AI will extract & categorise every transaction.
        </p>
      </div>

      {/* Upload area */}
      {!result && (
        <>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all ${
              preview
                ? "border-[#BA6200]/40 bg-[#BA6200]/5"
                : "border-zinc-200 bg-zinc-50 hover:border-[#BA6200]/40 hover:bg-[#BA6200]/5"
            }`}
          >
            {preview ? (
              <div className="relative aspect-[4/3] w-full">
                {file?.type === "application/pdf" ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3">
                    <FileText className="h-16 w-16 text-[#BA6200]" />
                    <p className="text-sm font-semibold text-zinc-700">{file.name}</p>
                    <p className="text-xs text-zinc-400">PDF · first page will be scanned</p>
                  </div>
                ) : (
                  <Image
                    src={preview}
                    alt="Receipt preview"
                    fill
                    className="object-contain p-3"
                  />
                )}
                {/* Scanning overlay */}
                <AnimatePresence>
                  {scanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm"
                    >
                      <div className="relative h-24 w-24">
                        {[0, 0.5, 1].map((delay) => (
                          <motion.div
                            key={delay}
                            className="absolute inset-0 rounded-full border-2 border-[#BA6200]/60"
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
                        <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-white">
                          <ScanLine className="h-5 w-5 text-[#BA6200]" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-zinc-800">
                          ChatGPT is reading your receipt…
                        </p>
                        <motion.p
                          className="text-sm text-zinc-500"
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          DeepSeek will summarise your spending
                        </motion.p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-14">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#BA6200]/10">
                  <Receipt className="h-8 w-8 text-[#BA6200]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-zinc-700">
                    Drag & drop or tap to upload
                  </p>
                  <p className="text-sm text-zinc-400">
                    Receipt · Bank statement · Screenshot
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={onFileChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex gap-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-3.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <Camera className="h-4 w-4" />
              Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-3.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </div>

          {file && !scanning && (
            <button
              onClick={onScan}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#BA6200] py-4 text-base font-bold text-white shadow-lg shadow-[#BA6200]/30 transition hover:bg-[#A05500] active:scale-[0.98]"
            >
              <Sparkles className="h-5 w-5" />
              Scan with AI
            </button>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}
        </>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Doc type + store header */}
            <div className="flex items-center gap-3 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#BA6200]/10 text-2xl">
                {scanResult.document_type === "receipt" ? (
                  <Receipt className="h-6 w-6 text-[#BA6200]" />
                ) : scanResult.document_type === "ewallet_screenshot" ? (
                  <Wallet className="h-6 w-6 text-[#BA6200]" />
                ) : (
                  <Landmark className="h-6 w-6 text-[#BA6200]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-lg font-bold text-zinc-900">
                  {scanResult.document_type === "receipt"
                    ? scanResult.store_name || "Receipt"
                    : scanResult.document_type === "ewallet_screenshot"
                      ? scanResult.counterparty || WALLET_PROVIDER_LABEL[scanResult.wallet_provider || "other"]
                      : "Bank Statement"}
                </p>
                <p className="text-sm text-zinc-500">
                  {scanResult.transactions.length} transactions · RM{scanResult.total_amount.toFixed(2)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                Scanned
              </span>
            </div>

            {/* AI Summary card (DeepSeek) */}
            {summary && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-[#BA6200]/20 bg-gradient-to-br from-[#BA6200]/8 to-[#BA6200]/3 p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#BA6200]" />
                  <p className="text-xs font-bold uppercase tracking-widest text-[#BA6200]">
                    DeepSeek AI Summary
                  </p>
                </div>
                <p className="mb-2 font-bold text-zinc-900">{summary.headline}</p>
                <p className="mb-4 text-sm leading-relaxed text-zinc-600">{summary.insight}</p>
                <div className="flex gap-3">
                  <div className="flex flex-1 flex-col items-center rounded-xl bg-white/80 py-3">
                    <TrendingDown className="mb-1 h-4 w-4 text-red-500" />
                    <p className="text-xs text-zinc-500">Spent</p>
                    <p className="font-bold text-zinc-900">RM{summary.total_debits.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-1 flex-col items-center rounded-xl bg-white/80 py-3">
                    <TrendingUp className="mb-1 h-4 w-4 text-emerald-500" />
                    <p className="text-xs text-zinc-500">Received</p>
                    <p className="font-bold text-zinc-900">RM{summary.total_credits.toFixed(2)}</p>
                  </div>
                </div>
                {summary.savings_tip && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-800">{summary.savings_tip}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* DB save status */}
            <div
              className={`flex items-center gap-3 rounded-2xl border p-4 ${
                result.total_failed === 0
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <Database className={`h-5 w-5 ${result.total_failed === 0 ? "text-emerald-600" : "text-amber-600"}`} />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-zinc-800">
                  {result.total_inserted} saved · {result.total_failed} failed
                </p>
                <p className="text-zinc-500">
                  {result.processing_time_ms.toFixed(0)}ms ·{" "}
                  <Zap className="inline h-3 w-3 text-yellow-500" />
                  {" "}+{result.xp_earned} XP
                </p>
              </div>
            </div>

            {/* Transactions list */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                Transactions Extracted
              </p>
              <div className="flex flex-col gap-2">
                {visibleTxns.map((txn, i) => (
                  <TxnRow key={i} txn={txn} idx={i} />
                ))}
              </div>
              {(scanResult.transactions.length ?? 0) > 4 && (
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className="mt-3 flex w-full items-center justify-center gap-2 text-sm font-semibold text-[#BA6200]"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show all {scanResult.transactions.length} transactions
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={onReset}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <RefreshCw className="h-4 w-4" />
              Scan Another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
