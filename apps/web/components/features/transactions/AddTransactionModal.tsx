"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/constants";
import { createTransaction } from "@/lib/api";
import { toast } from "sonner";

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const initialForm = {
  merchant: "",
  amount: "",
  category: "food",
  note: "",
  verdict: "boleh" as const,
};

export function AddTransactionModal({ open, onClose, onSaved }: AddTransactionModalProps) {
  const [form, setForm] = useState({ ...initialForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = form.merchant.trim() && form.amount.trim() && parseFloat(form.amount) > 0;

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSave = async () => {
    if (!isFormValid) return;
    setSaving(true);
    setError(null);

    try {
      await createTransaction({
        merchant: form.merchant.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        note: form.note.trim(),
        verdict: form.verdict,
      });
      toast.success("Transaction saved! 🎉", {
        description: `${form.merchant} · RM${parseFloat(form.amount).toFixed(2)}`,
      });
      setForm({ ...initialForm });
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      setError(msg);
      toast.error("Couldn't save transaction", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar (mobile) */}
              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mt-3 mb-1 md:hidden" />

              {/* Header */}
              <div className="px-6 pt-4 pb-3 flex items-center justify-between border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-800">Add Transaction</h2>
                    <p className="text-xs text-zinc-400">Log a spending entry</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl p-1">
                  ✕
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                {/* Merchant */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Merchant</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🏪</span>
                    <input
                      type="text"
                      value={form.merchant}
                      onChange={(e) => handleChange("merchant", e.target.value)}
                      placeholder="e.g. Mamak Sri Melur"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Amount (RM)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">RM</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleChange("category", cat.id)}
                        className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                          form.category === cat.id
                            ? "bg-primary text-white border-primary"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="text-base mb-0.5">{cat.emoji}</div>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note (optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                    Note <span className="text-zinc-300 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={(e) => handleChange("note", e.target.value)}
                    placeholder="What was this for?"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-6 mb-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="px-6 pb-6 pt-2 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isFormValid || saving}
                  className="flex-[2] rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-40 transition-all hover:brightness-105 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Transaction</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
