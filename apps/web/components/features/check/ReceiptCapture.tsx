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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden border-none bg-white text-foreground shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/70 p-4">
            <h3 className="font-bold flex items-center gap-2">
              <Camera size={20} className="text-primary" />
              {image ? "Preview Receipt" : "Scan Receipt / Statement"}
            </h3>
            <button onClick={onClose} className="text-muted hover:text-foreground">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Image area */}
            <div className="relative">
              {image ? (
                <div className="relative overflow-hidden rounded-2xl border-2 border-white/70">
                  <img src={image} className="w-full max-h-[300px] object-contain bg-white/70" alt="Receipt preview" />
                  
                  {isScanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-white/80"
                    >
                      <div className="text-center space-y-4">
                        {/* Animated scanning rings */}
                        <div className="relative mx-auto w-24 h-24">
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary/60"
                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-secondary/40"
                            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: "easeOut" }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-tertiary/20"
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
                          <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-white">
                            <Camera size={20} className="text-primary" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-foreground">Agent 4 scanning your receipt...</p>
                        <p className="text-xs text-muted">Reading amounts, merchant, and categories</p>
                      </div>
                    </motion.div>
                  )}

                  {!isScanning && (
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/80 bg-white/90 text-foreground hover:bg-white"
                        onClick={(e) => { e.stopPropagation(); pickImage(); }}
                      >
                        Change
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
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
                  className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-primary/25 bg-white/75 transition-colors hover:border-primary/45 hover:bg-white"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <ImagePlus size={32} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium text-foreground">Tap to take photo or upload</p>
                    <p className="text-xs text-muted">Receipt · Bank statement · Screenshot</p>
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
