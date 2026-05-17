"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { PetNudge } from "@/types";
import { MOOD_EMOJI } from "./petConfig";

// ─── Rich pool of Malaysian-context fallback nudges ───────────────────────────
// Used when the API hasn't returned a nudge yet (guest mode / first load)
export const MY_FALLBACK_NUDGES: Array<{ message: string; mood: PetNudge["mood"] }> = [
  { message: "Eh jangan lupa — duit simpan sikit tiap bulan, baru boleh beli iPhone tanpa rasa bersalah! 😌", mood: "happy" },
  { message: "Shopee Flash Sale lagi? Ingat — 'sale' bukan sebab nak beli, tapi sebab dah plan nak beli! 🛍️", mood: "worried" },
  { message: "Gaji dah masuk ke? Bayar diri sendiri dulu (savings), baru bayar orang lain. Prinsip wajib tau! 💸", mood: "neutral" },
  { message: "Makan tengahari kat kedai ke tapau? Tapau jimat RM8–15 sehari, RM300+ sebulan weh! 🍱", mood: "happy" },
  { message: "BNPL bukan duit free tau. Hutang tetap hutang, even kau bayar slow-slow. Fikir dulu! ⚠️", mood: "warning" },
  { message: "Kalau rasa nak splurge, tunggu 48 jam dulu. Kalau still nak, baru consider. Most likely dah lupa! 🧘", mood: "neutral" },
  { message: "Grab tu convenience tax la bai. Sekali-sekala okay, tapi setiap hari? Tu dah lifestyle inflation tu. 🚗", mood: "worried" },
  { message: "Satu kopi RM15 sehari = RM450 sebulan = RM5,400 setahun. Bukan cakap tak boleh — tapi sedar tau! ☕", mood: "neutral" },
  { message: "Weh streak kau on fire! 🔥 Teruskan check spend tiap hari, nanti XP pun naik, habit pun terbentuk!", mood: "celebrating" },
  { message: "Ringgit lemah ke kuat, tabiat simpan duit tetap the real power move. Invest sikit-sikit pun okay! 📈", mood: "happy" },
  { message: "Bulan ni banyak dah belanja ke? Rehat sekejap — scroll less, spend less. Terbukti secara saintifik! 😪", mood: "sleepy" },
  { message: "Emergency fund tu bukan optional tau. 3–6 bulan gaji disimpan, baru rasa aman tidur malam! 🛡️", mood: "neutral" },
  { message: "Kalau kawan ajak makan mahal selalu, boleh cakap 'budget bulan ni ketat sikit'. Real friends faham! 🤝", mood: "happy" },
  { message: "TikTok Shop checkout tu cepat sangat — niat impulse + easy pay = dompet nangis. Slow down! 📱", mood: "warning" },
  { message: "Dah tengok balik transaction bulan lepas? Mesti ada benda surprising. Cuba check sekali! 🧾", mood: "neutral" },
  { message: "Harga barang naik, tapi gaji sama je? Masa untuk audit belanja dan renegotiate lifestyle sikit. 💡", mood: "worried" },
  { message: "Nak jimat? Off notifikasi Shopee, Lazada, TikTok Shop. Out of sight, out of cart! 🔕", mood: "happy" },
  { message: "Good job scan resit harini! Setiap resit = data = insights = keputusan lebih bijak. Teruskan! 🎯", mood: "celebrating" },
];

interface PetSpeechBubbleProps {
  nudge: PetNudge | null;
  visible: boolean;
  onDismiss: () => void;
  side?: "left" | "right";
}

const MOOD_GRADIENT: Record<string, string> = {
  happy:       "from-emerald-50 to-white border-emerald-200",
  celebrating: "from-amber-50 to-white border-amber-300",
  worried:     "from-orange-50 to-white border-orange-200",
  warning:     "from-red-50 to-white border-red-300",
  sleepy:      "from-slate-50 to-white border-slate-200",
  neutral:     "from-sky-50 to-white border-sky-200",
};

const MOOD_ACCENT: Record<string, string> = {
  happy:       "border-l-emerald-400",
  celebrating: "border-l-amber-400",
  worried:     "border-l-orange-400",
  warning:     "border-l-red-500",
  sleepy:      "border-l-slate-400",
  neutral:     "border-l-sky-400",
};

export function PetSpeechBubble({ nudge, visible, onDismiss, side = "left" }: PetSpeechBubbleProps) {
  if (!nudge) return null;

  const gradient = MOOD_GRADIENT[nudge.mood] ?? MOOD_GRADIENT.neutral;
  const accent   = MOOD_ACCENT[nudge.mood]   ?? MOOD_ACCENT.neutral;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 10, x: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.82, y: 10, x: 8 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className={`
            relative
            w-[220px] md:w-[260px]
            bg-gradient-to-br ${gradient}
            border border-l-4 ${accent}
            rounded-2xl px-4 py-3
            shadow-xl shadow-black/10
          `}
          role="status"
          aria-live="polite"
        >
          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2.5 w-5 h-5 flex items-center justify-center rounded-full bg-white/80 text-zinc-400 hover:text-zinc-700 hover:bg-white transition-colors text-xs font-bold leading-none shadow-sm"
            aria-label="Dismiss"
          >
            ✕
          </button>

          {/* Mood emoji + message */}
          <p className="font-sans text-xs font-semibold text-zinc-800 pr-5 leading-relaxed">
            <span className="mr-1">{MOOD_EMOJI[nudge.mood]}</span>
            {nudge.message}
          </p>

          {/* XP hint badge */}
          {nudge.xp_hint != null && nudge.xp_hint > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 font-sans text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
              ⚡ +{nudge.xp_hint} XP
            </span>
          )}

          {/* Triangle tail pointing to the pet (bottom-right) */}
          <div
            className={`absolute -bottom-2 ${side === "left" ? "right-5" : "left-5"} w-4 h-2 overflow-hidden`}
          >
            <div className="w-3 h-3 bg-white border border-inherit rotate-45 translate-y-[-50%] translate-x-0.5 shadow-sm" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
