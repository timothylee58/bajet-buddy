"use client";

import { useState } from "react";
import { ChatCheckScreen } from "@/components/features/check/ChatCheckScreen";
import { CheckScreen } from "@/components/features/check/CheckScreen";
import { ReceiptCapture } from "@/components/features/check/ReceiptCapture";
import { TransactionReviewCard } from "@/components/features/check/TransactionReviewCard";
import { MessageSquare, Keyboard, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OCRScanResponse, OCRTransaction } from "@/types";

type Tab = "ai" | "manual";

export default function CheckPage() {
  const [tab, setTab] = useState<Tab>("ai");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [scanResponse, setScanResponse] = useState<OCRScanResponse | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher */}
      <div className="flex items-center gap-2 mx-4 mt-4">
        <div className="flex flex-1 gap-1 p-1 bg-surface-muted rounded-2xl">
          <button
            onClick={() => setTab("ai")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-sm font-bold transition-all",
              tab === "ai"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Ask AI
          </button>
          <button
            onClick={() => setTab("manual")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-sm font-bold transition-all",
              tab === "manual"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            <Keyboard className="w-4 h-4" />
            Manual
          </button>
        </div>
        <button
          onClick={() => setCaptureOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-sans text-sm font-bold bg-secondary text-white shadow-sm"
        >
          <Camera className="w-4 h-4" />
          Scan
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "ai" ? <ChatCheckScreen /> : <CheckScreen />}
      </div>

      {captureOpen && (
        <ReceiptCapture
          onClose={() => setCaptureOpen(false)}
          onComplete={(data) => {
            setCaptureOpen(false);
            setScanResponse(data);
          }}
        />
      )}

      {scanResponse && (
        <TransactionReviewCard
          scanResponse={scanResponse}
          onConfirm={(_txns: OCRTransaction[]) => setScanResponse(null)}
          onCancel={() => setScanResponse(null)}
        />
      )}
    </div>
  );
}
