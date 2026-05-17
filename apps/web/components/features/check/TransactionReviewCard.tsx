"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Edit2, X, Store, CreditCard, Tag, Calendar, Database, CheckCircle2, AlertCircle, Zap, ScanLine, Receipt, Landmark } from "lucide-react";
import { motion } from "framer-motion";
import type { OCRScanResponse, OCRTransaction } from "@/types";

interface TransactionReviewCardProps {
  scanResponse: OCRScanResponse;
  onConfirm: (transactions: OCRTransaction[]) => void;
  onCancel: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(amount);
}

export function TransactionReviewCard({
  scanResponse,
  onConfirm,
  onCancel,
}: TransactionReviewCardProps) {
  const result = scanResponse.scan_result!;
  const [transactions, setTransactions] = useState<OCRTransaction[]>(
    result.transactions.length > 0
      ? result.transactions.map(t => ({ ...t }))
      : [{ merchant: result.store_name || "", amount: result.total_amount || 0, category: "other", date: "", note: "", transaction_type: "debit" as const }]
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editField, setEditField] = useState<{ key: keyof OCRTransaction; value: string } | null>(null);

  const startEdit = (index: number, field: keyof OCRTransaction, currentValue: string | number) => {
    setEditingIndex(index);
    setEditField({ key: field, value: String(currentValue) });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editField) return;
    setTransactions(prev => {
      const next = [...prev];
      const updated = { ...next[editingIndex] };
      if (editField.key === "amount") {
        (updated as any)[editField.key] = parseFloat(editField.value) || 0;
      } else {
        (updated as any)[editField.key] = editField.value;
      }
      next[editingIndex] = updated;
      return next;
    });
    setEditingIndex(null);
    setEditField(null);
  };

  const isReceipt = result.document_type === "receipt";
  const DocIcon = isReceipt ? Receipt : Landmark;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <Card className="rounded-t-3xl rounded-b-none border-none shadow-2xl overflow-hidden bg-white">
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DocIcon size={24} className="text-brand" />
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">
                    {isReceipt ? result.store_name || "Receipt" : "Bank Statement"}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} detected
                  </p>
                </div>
              </div>
              <button onClick={onCancel} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400">
                <X size={20} />
              </button>
            </div>

            {/* Document type pill */}
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              isReceipt ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
            }`}>
              <DocIcon size={14} />
              {isReceipt ? "Receipt" : "Bank Statement"}
            </div>

            {/* Transaction list */}
            <div className="space-y-3">
              {transactions.map((txn, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 space-y-3 transition-colors ${
                    editingIndex === i ? "border-brand bg-brand/5" : "border-zinc-100 bg-zinc-50"
                  }`}
                >
                  {/* Merchant row */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <Store size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Merchant</p>
                      {editingIndex === i && editField?.key === "merchant" ? (
                        <div className="flex gap-1 mt-0.5">
                          <input
                            autoFocus
                            className="flex-1 text-sm font-semibold bg-white border border-brand rounded px-2 py-1 outline-none"
                            value={editField.value}
                            onChange={e => setEditField({ key: "merchant", value: e.target.value })}
                            onKeyDown={e => e.key === "Enter" && saveEdit()}
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}>
                            <Check size={14} />
                          </Button>
                        </div>
                      ) : (
                        <p className="font-semibold text-zinc-900 truncate">{txn.merchant || "(tap to edit)"}</p>
                      )}
                    </div>
                    {editingIndex !== i && (
                      <Button variant="ghost" size="icon" className="text-zinc-400 shrink-0" onClick={() => startEdit(i, "merchant", txn.merchant)}>
                        <Edit2 size={14} />
                      </Button>
                    )}
                  </div>

                  {/* Amount + Category + Date row */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Amount */}
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Amount</p>
                      {editingIndex === i && editField?.key === "amount" ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            className="w-full text-sm font-semibold bg-white border border-brand rounded px-2 py-1 outline-none"
                            value={editField.value}
                            onChange={e => setEditField({ key: "amount", value: e.target.value })}
                            onKeyDown={e => e.key === "Enter" && saveEdit()}
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={saveEdit}>
                            <Check size={12} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-zinc-900 text-sm">{formatCurrency(txn.amount)}</p>
                          <button onClick={() => startEdit(i, "amount", txn.amount)} className="text-zinc-400 hover:text-zinc-600">
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Category */}
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Category</p>
                      {editingIndex === i && editField?.key === "category" ? (
                        <div className="flex gap-1">
                          <select
                            autoFocus
                            className="w-full text-xs font-semibold bg-white border border-brand rounded px-1 py-1 outline-none"
                            value={editField.value}
                            onChange={e => setEditField({ key: "category", value: e.target.value })}
                            onBlur={saveEdit}
                          >
                            {["food", "groceries", "shopping", "transport", "utilities", "health", "entertainment", "other"].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-zinc-900 text-sm capitalize">{txn.category}</p>
                          <button onClick={() => startEdit(i, "category", txn.category)} className="text-zinc-400 hover:text-zinc-600">
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Date</p>
                      {editingIndex === i && editField?.key === "date" ? (
                        <div className="flex gap-1">
                          <input
                            autoFocus
                            className="w-full text-xs font-semibold bg-white border border-brand rounded px-1 py-1 outline-none"
                            value={editField.value}
                            onChange={e => setEditField({ key: "date", value: e.target.value })}
                            onKeyDown={e => e.key === "Enter" && saveEdit()}
                            placeholder="YYYY-MM-DD"
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={saveEdit}>
                            <Check size={12} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-zinc-900 text-sm">{txn.date || "—"}</p>
                          <button onClick={() => startEdit(i, "date", txn.date)} className="text-zinc-400 hover:text-zinc-600">
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DB insert status for this row */}
                  {scanResponse.insert_results[i] && (
                    <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                      scanResponse.insert_results[i].db_inserted
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      <Database size={12} />
                      {scanResponse.insert_results[i].db_inserted ? "DB ✓" : "DB ✗"}
                      {scanResponse.insert_results[i].db_error && (
                        <span className="truncate text-[10px] opacity-70">{scanResponse.insert_results[i].db_error}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className={`p-4 rounded-xl border ${
              scanResponse.total_failed === 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  scanResponse.total_failed === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  <Database size={20} />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-zinc-800">
                    {scanResponse.total_inserted} saved · {scanResponse.total_failed} failed
                  </p>
                  <p className="text-zinc-500">{scanResponse.processing_time_ms.toFixed(0)}ms · +{scanResponse.xp_earned} XP</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1 py-6 border-zinc-200">
                Discard
              </Button>
              <Button onClick={() => onConfirm(transactions)} className="flex-[2] py-6 bg-brand hover:bg-brand-dark">
                <Check className="mr-2" size={20} />
                Confirm & Log All
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
