"use client";

import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, CheckCircle2, ImagePlus } from "lucide-react";
import { motion } from "framer-motion";
import { scanReceipt } from "@/lib/api";
import { toast } from "sonner";
import type { OCRScanResponse } from "@/types";

interface ReceiptCaptureProps {
  onClose: () => void;
  onComplete: (data: OCRScanResponse) => void;
}

export function ReceiptCapture({ onClose, onComplete }: ReceiptCaptureProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickImage = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMsg(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const response = await scanReceipt(image);

      if (response.status === "ok" && response.scan_result) {
        setIsScanning(false);
        setIsDone(true);

        alert(`[OCR DEBUG] Response received:\n\n${JSON.stringify(response, null, 2)}`);

        setTimeout(() => {
          onComplete(response);
        }, 800);
      } else {
        setIsScanning(false);
        const msg = response.error || "OCR scan failed.";
        setErrorMsg(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      setIsScanning(false);
      const msg = err?.message || "Cannot reach API — is the backend running?";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden border-none bg-zinc-900 text-white shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <Camera size={20} className="text-brand" />
              {image ? "Preview Receipt" : "Scan Receipt / Statement"}
            </h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Image area */}
            <div className="relative">
              {image ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-white/20">
                  <img src={image} className="w-full max-h-[300px] object-contain bg-black/40" alt="Receipt preview" />
                  
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center"
                    >
                      <div className="text-center space-y-4">
                        {/* Animated scanning rings */}
                        <div className="relative mx-auto w-24 h-24">
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-brand/60"
                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-brand/40"
                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-brand/20"
                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 1, ease: "easeOut" }}
                          />
                          <motion.div
                            className="absolute inset-3 rounded-full"
                            style={{
                              background: "conic-gradient(from 0deg, transparent, #16a34a, transparent)",
                            }}
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <div className="absolute inset-[10px] rounded-full bg-zinc-900 flex items-center justify-center">
                            <Camera size={20} className="text-brand" />
                          </div>
                        </div>
                        <p className="text-sm text-white/80 font-medium">Agent 4 scanning your receipt...</p>
                        <p className="text-xs text-zinc-400">Reading amounts, merchant, and categories</p>
                      </div>
                    </motion.div>
                  )}

                  {!isScanning && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/30 text-white bg-black/50 hover:bg-black/70"
                        onClick={(e) => { e.stopPropagation(); pickImage(); }}
                      >
                        Change
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400/30 text-red-300 bg-black/50 hover:bg-black/70"
                        onClick={(e) => { e.stopPropagation(); setImage(null); }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={pickImage}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-4 hover:border-brand/50 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="h-16 w-16 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                    <ImagePlus size={32} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium text-white">Tap to take photo or upload</p>
                    <p className="text-xs text-zinc-400">Receipt · Bank statement · Screenshot</p>
                  </div>
                </button>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange}
            />

            {/* Error display */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                {errorMsg}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {!image && (
                <Button
                  onClick={pickImage}
                  className="w-full py-6 text-base border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-brand/50"
                >
                  <Upload className="mr-2" size={20} />
                  Choose Photo
                </Button>
              )}

              {image && (
                <Button 
                  disabled={isScanning || isDone}
                  onClick={handleScan}
                  className="w-full py-7 text-lg bg-brand hover:bg-brand-dark disabled:bg-zinc-700"
                >
                  {isScanning ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Camera size={22} />
                      </motion.span>
                      Scanning...
                    </span>
                  ) : isDone ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={22} />
                      Scanned!
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Camera size={22} />
                      Scan Receipt
                    </span>
                  )}
                </Button>
              )}
              
              <p className="text-[10px] text-center text-zinc-500 uppercase tracking-widest">
                Agent 4 — OCR vision · saves locally even if DB fails
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
