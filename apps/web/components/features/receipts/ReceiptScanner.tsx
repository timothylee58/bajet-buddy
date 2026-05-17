"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/constants";

interface ReceiptScanResult {
  store_name: string;
  item: string;
  amount: number;
  category: string;
  currency: string;
  under_category_average: boolean;
  category_average: number;
  xp_awarded: number;
  badge: string | null;
  gamification_status: Record<string, unknown>;
}

export function ReceiptScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ReceiptScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFile(selected: File) {
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
    setShowReward(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const selected = e.dataTransfer.files?.[0];
    if (selected && selected.type.startsWith("image/")) handleFile(selected);
  }

  async function onScan() {
    if (!file) return;
    setScanning(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/receipts/scan`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { detail?: string }).detail ?? `Error ${res.status}`);
      }
      const data: ReceiptScanResult = await res.json();
      setResult(data);
      if (data.under_category_average && data.badge) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setScanning(false);
    }
  }

  function onReset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setShowReward(false);
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Receipt Scanner</h1>
        <p className="text-sm text-zinc-500 mt-1">Scan a receipt to track your spending</p>
      </div>

      {!result && (
        <>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-3xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-400 transition-colors"
          >
            {preview ? (
              <img src={preview} alt="Receipt preview" className="max-h-64 rounded-2xl object-contain" />
            ) : (
              <>
                <span className="text-4xl">🧾</span>
                <p className="text-sm text-zinc-500 text-center">Drag & drop a receipt image here, or tap to select</p>
              </>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

          <button
            onClick={() => cameraInputRef.current?.click()}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-700 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            📷 Use Camera
          </button>

          {file && (
            <button
              onClick={onScan}
              disabled={scanning}
              className="rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {scanning ? "🔍 Scanning receipt..." : "Scan Receipt"}
            </button>
          )}

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </>
      )}

      <AnimatePresence>
        {showReward && result && (
          <motion.div
            key="reward"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-4 mx-6 text-center">
              <motion.p
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-bold text-emerald-500"
              >
                +50 XP
              </motion.p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">🏆 Budget Warrior</p>
              <p className="text-sm text-zinc-500">
                You spent RM {result.amount.toFixed(2)} vs RM {result.category_average.toFixed(2)} category average!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {result && !showReward && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col gap-4 rounded-3xl border border-zinc-200 dark:border-zinc-700 p-6 bg-white dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{result.store_name}</h2>
            {result.badge && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1">
                Budget Warrior 🏆
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Item</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{result.item}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Amount</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">RM {result.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Category</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{result.category}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Category Average</span>
              <span className="font-medium text-zinc-500">RM {result.category_average.toFixed(2)}</span>
            </div>
          </div>

          {result.xp_awarded > 0 && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                +{result.xp_awarded} XP earned — under category average!
              </p>
            </div>
          )}

          <button
            onClick={onReset}
            className="rounded-2xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Scan Another
          </button>
        </motion.div>
      )}
    </div>
  );
}
