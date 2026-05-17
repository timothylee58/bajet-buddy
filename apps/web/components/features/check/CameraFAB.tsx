"use client";

import React, { useState } from "react";
import { Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReceiptCapture } from "@/components/features/check/ReceiptCapture";
import { TransactionReviewCard } from "@/components/features/check/TransactionReviewCard";
import { useGuestMode } from "@/hooks/useGuestMode";
import { toast } from "sonner";
import type { OCRScanResponse, OCRTransaction } from "@/types";

export function CameraFAB() {
  const [showCapture, setShowCapture] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [scanResponse, setScanResponse] = useState<OCRScanResponse | null>(null);
  const { updateGuestData } = useGuestMode();

  const handleScanComplete = (response: OCRScanResponse) => {
    setScanResponse(response);
    setShowCapture(false);
    setShowReview(true);
  };

  const handleConfirm = (transactions: OCRTransaction[]) => {
    // DEV: dump what's being saved
    const debugPayload = {
      transactions,
      insert_results: scanResponse?.insert_results,
      total_inserted: scanResponse?.total_inserted,
      total_failed: scanResponse?.total_failed,
      xp_earned: scanResponse?.xp_earned,
      processing_time_ms: scanResponse?.processing_time_ms,
    };
    alert(`[SAVE DEBUG] Writing to guest state:\n\n${JSON.stringify(debugPayload, null, 2)}`);

    // Add all transactions to guest state
    updateGuestData(prev => ({
      ...prev,
      transactions: [
        ...transactions.map((txn, i) => ({
          id: scanResponse?.insert_results[i]?.transaction_id || Math.random().toString(36).substring(7),
          amount: txn.amount,
          category: txn.category,
          merchant: txn.merchant,
          note: txn.note || `OCR — ${txn.merchant}`,
          source: "ocr",
          db_inserted: scanResponse?.insert_results[i]?.db_inserted || false,
        })),
        ...prev.transactions
      ]
    }));

    setShowReview(false);

    const inserted = scanResponse?.total_inserted || 0;
    const failed = scanResponse?.total_failed || 0;
    const xp = scanResponse?.xp_earned || 0;

    if (failed === 0) {
      toast.success(`${inserted} transaction${inserted !== 1 ? "s" : ""} saved! +${xp} XP`);
    } else {
      toast.warning(`${inserted} saved, ${failed} failed. +${xp} XP`);
    }
  };

  return (
    <>
      <div className="fixed bottom-28 right-6 z-40 flex flex-col gap-4 items-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCapture(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 ring-4 ring-white"
        >
          <Camera size={28} />
        </motion.button>
      </div>

      <AnimatePresence>
        {showCapture && (
          <ReceiptCapture 
            onClose={() => setShowCapture(false)} 
            onComplete={handleScanComplete} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReview && scanResponse && (
          <TransactionReviewCard 
            scanResponse={scanResponse}
            onConfirm={handleConfirm}
            onCancel={() => setShowReview(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
