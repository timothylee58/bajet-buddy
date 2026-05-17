"use client";

import { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";

const RECURRING = [
  { id: "1", name: "Shopee PayLater", amount: 89, category: "Shopping", emoji: "🛍️", frequency: "Monthly", next_due: "18 May" },
  { id: "2", name: "Grab PayLater", amount: 45, category: "Transport", emoji: "🚗", frequency: "Monthly", next_due: "22 May" },
  { id: "3", name: "Netflix", amount: 55, category: "Entertainment", emoji: "🎬", frequency: "Monthly", next_due: "25 May" },
  { id: "4", name: "Apartment Rent", amount: 950, category: "Utilities", emoji: "🏠", frequency: "Monthly", next_due: "1 Jun" },
  { id: "5", name: "Celcom Postpaid", amount: 88, category: "Utilities", emoji: "📱", frequency: "Monthly", next_due: "28 May" },
  { id: "6", name: "TNG eWallet Top-up", amount: 100, category: "Transport", emoji: "🚌", frequency: "Weekly", next_due: "19 May" },
  { id: "7", name: "Gym Membership", amount: 99, category: "Entertainment", emoji: "💪", frequency: "Monthly", next_due: "1 Jun" },
];

type Expense = typeof RECURRING[0];

function SwipeCard({
  expense,
  onSwipe,
  isTop,
  stackIndex,
}: {
  expense: Expense;
  onSwipe: (dir: "left" | "right") => void;
  isTop: boolean;
  stackIndex: number;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const confirmOpacity = useTransform(x, [0, 80], [0, 1]);
  const dismissOpacity = useTransform(x, [-80, 0], [1, 0]);

  const scale = 1 - stackIndex * 0.05;
  const translateY = stackIndex * 8;

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > 80) {
      onSwipe("right");
    } else if (info.offset.x < -80) {
      onSwipe("left");
    }
  }

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-zinc-100"
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
          zIndex: 10 - stackIndex,
        }}
      >
        <div className="h-full flex flex-col items-center justify-center p-8 opacity-30 select-none">
          <span className="text-5xl mb-4">{expense.emoji}</span>
          <p className="font-bold text-zinc-800 text-lg">{expense.name}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-zinc-100 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: 20 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 0, opacity: 0, transition: { duration: 0.1 } }}
    >
      {/* Confirm indicator */}
      <motion.div
        className="absolute top-6 right-6 bg-emerald-500 text-white font-bold text-lg px-4 py-2 rounded-2xl rotate-12 border-2 border-emerald-600"
        style={{ opacity: confirmOpacity }}
      >
        KEEP ✅
      </motion.div>

      {/* Dismiss indicator */}
      <motion.div
        className="absolute top-6 left-6 bg-red-500 text-white font-bold text-lg px-4 py-2 rounded-2xl -rotate-12 border-2 border-red-600"
        style={{ opacity: dismissOpacity }}
      >
        SKIP ❌
      </motion.div>

      <div className="h-full flex flex-col items-center justify-between p-8 select-none">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
          <span className="text-6xl">{expense.emoji}</span>
          <h2 className="text-2xl font-bold text-zinc-800 text-center">{expense.name}</h2>
          <p className="text-3xl font-bold text-emerald-600">
            RM {expense.amount.toFixed(2)}
          </p>
          <p className="text-zinc-500 text-sm">per {expense.frequency.toLowerCase()}</p>

          <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-sm font-medium">
            {expense.category}
          </span>

          <div className="flex items-center gap-2 text-zinc-500 text-sm mt-2">
            <span>📅</span>
            <span>Next due: <strong className="text-zinc-700">{expense.next_due}</strong></span>
          </div>
        </div>

        <div className="flex gap-4 w-full mt-4">
          <button
            onClick={() => onSwipe("left")}
            className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-2xl border border-red-200 transition-colors"
          >
            ❌ Dismiss
          </button>
          <button
            onClick={() => onSwipe("right")}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-semibold py-3 rounded-2xl border border-emerald-200 transition-colors"
          >
            ✅ Confirm
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function SwipeReview() {
  const [cards, setCards] = useState<Expense[]>(RECURRING);
  const [confirmed, setConfirmed] = useState<Expense[]>([]);
  const [dismissed, setDismissed] = useState<Expense[]>([]);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [budgetAdded, setBudgetAdded] = useState(false);

  const total = RECURRING.length;
  const reviewed = total - cards.length;

  function handleSwipe(dir: "left" | "right") {
    if (cards.length === 0) return;
    const top = cards[0];
    setExitDir(dir);
    setTimeout(() => {
      if (dir === "right") {
        setConfirmed((prev) => [...prev, top]);
      } else {
        setDismissed((prev) => [...prev, top]);
      }
      setCards((prev) => prev.slice(1));
      setExitDir(null);
    }, 300);
  }

  const confirmedTotal = confirmed.reduce((sum, e) => sum + e.amount, 0);

  if (cards.length === 0 && reviewed === total) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-8 max-w-md w-full text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h1 className="text-2xl font-bold text-zinc-800 mb-2">All done!</h1>
          <p className="text-zinc-500 mb-6">You&apos;ve reviewed all your recurring expenses.</p>

          <div className="bg-emerald-50 rounded-2xl p-4 mb-4 text-left">
            <p className="text-emerald-700 font-semibold mb-2">
              {confirmed.length} expense{confirmed.length !== 1 ? "s" : ""} confirmed · RM {confirmedTotal.toFixed(2)}/month
            </p>
            <ul className="space-y-1">
              {confirmed.map((e) => (
                <li key={e.id} className="flex justify-between text-sm text-emerald-800">
                  <span>{e.emoji} {e.name}</span>
                  <span>RM {e.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {dismissed.length > 0 && (
            <p className="text-zinc-400 text-sm mb-6">
              {dismissed.length} expense{dismissed.length !== 1 ? "s" : ""} dismissed
            </p>
          )}

          {budgetAdded ? (
            <div className="bg-emerald-500 text-white font-semibold py-3 px-6 rounded-2xl">
              Budget updated! ✓
            </div>
          ) : (
            <button
              onClick={() => setBudgetAdded(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-2xl transition-colors"
            >
              Add to Budget
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-800">Review Expenses</h1>
          <p className="text-sm text-zinc-500">Swipe to confirm or dismiss</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-2 text-center shadow-sm">
          <p className="text-zinc-500 text-xs">Reviewed</p>
          <p className="font-bold text-zinc-800">{reviewed} / {total}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-4">
        <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${(reviewed / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card stack */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-full max-w-sm" style={{ height: 420 }}>
          <AnimatePresence>
            {cards.slice(0, 3).map((expense, i) => {
              const isTop = i === 0;
              return (
                <AnimatePresence key={expense.id}>
                  {exitDir && isTop ? (
                    <motion.div
                      key={`exit-${expense.id}`}
                      className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-zinc-100"
                      animate={{
                        x: exitDir === "right" ? 600 : -600,
                        opacity: 0,
                        rotate: exitDir === "right" ? 20 : -20,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-8">
                        <span className="text-6xl mb-4">{expense.emoji}</span>
                        <h2 className="text-2xl font-bold text-zinc-800">{expense.name}</h2>
                      </div>
                    </motion.div>
                  ) : (
                    <SwipeCard
                      key={expense.id}
                      expense={expense}
                      onSwipe={handleSwipe}
                      isTop={isTop}
                      stackIndex={i}
                    />
                  )}
                </AnimatePresence>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Swipe hints */}
        <div className="flex justify-between w-full max-w-sm mt-6 px-2">
          <span className="text-zinc-400 text-sm">← Dismiss</span>
          <span className="text-zinc-300 text-xs self-center">drag the card</span>
          <span className="text-zinc-400 text-sm">Confirm →</span>
        </div>
      </div>
    </div>
  );
}
