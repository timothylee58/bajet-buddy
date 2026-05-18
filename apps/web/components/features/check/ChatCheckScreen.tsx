"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Calculator, Loader2, RefreshCw } from "lucide-react";
import { chatCheckSpend } from "@/lib/api";
import { VERDICT_CONFIG } from "@/lib/constants";
import { formatRM } from "@/lib/utils";
import type { ChatMessage, ChatCheckResponse, CheckResponse } from "@/types";
import { QuickCalculator } from "./QuickCalculator";
import { VoiceInput } from "./VoiceInput";

// ─── Demo / offline fallback result builder ──────────────────────────────────
function buildDemoResult(message: string, amount: number, category: string, merchant: string): ChatCheckResponse {
  const mockVerdict = amount > 150 ? "jangan_dulu" as const : amount > 80 ? "fikir_dulu" as const : "boleh" as const;

  const checkResult: CheckResponse = {
    verdict: mockVerdict,
    nudge_bm:
      mockVerdict === "jangan_dulu"
        ? "Jangan dulu. Perbelanjaan ini akan tekan baki harian anda terlalu rendah."
        : mockVerdict === "fikir_dulu"
          ? "Fikir dulu sebelum beli. Semak sama ada ini betul-betul perlu."
          : "Boleh. Belanja ini masih nampak terkawal.",
    nudge_en:
      mockVerdict === "jangan_dulu"
        ? "Hold off. This spend pushes your daily runway too low."
        : mockVerdict === "fikir_dulu"
          ? "Think first. Check if this is really necessary."
          : "Go ahead. This spend still looks manageable.",
    risk_score: amount > 150 ? 85 : amount > 80 ? 55 : 20,
    budget_impact_pct: (amount / 340) * 100,
    xp_earned: mockVerdict === "boleh" ? 10 : 0,
    reason_codes: mockVerdict === "jangan_dulu" ? ["LOW_DAILY_SURVIVAL", "HIGH_CATEGORY_USAGE"] : [],
    projected_remaining_balance: 340 - amount,
    projected_daily_survival_amount: (340 - amount) / 7,
    proactive_alert: amount > 150,
  };

  return {
    messages: [
      { role: "user" as const, content: message },
      { role: "bajetbuddy" as const, content: `OK, I parsed: Spend RM${amount.toFixed(2)} on item at ${merchant} (${category})` },
      { role: "bajetbuddy" as const, content: `${mockVerdict === "jangan_dulu" ? "❌" : mockVerdict === "fikir_dulu" ? "🤔" : "✅"} **${mockVerdict.toUpperCase().replace("_", " ")}**\n\n${mockVerdict === "jangan_dulu" ? "Jangan dulu. Your budget is tight." : mockVerdict === "fikir_dulu" ? "Fikir dulu. Think about it." : "Boleh. Looks manageable."}\n\n📊 Risk score: ${checkResult.risk_score}/100 | Budget impact: ${checkResult.budget_impact_pct.toFixed(0)}%\n\nI ada 3 options for you:\n💰 Option A — Buy with cash (but this will makan your daily runway)\n📉 Option B — Use BNPL (tapi nanti your financial health drop)\n🧘 Option C — Walk away for 48 hours (earn +200 Discipline XP!)\n\nMana satu you nak pilih?` },
    ],
    result: checkResult,
    parsed_intent: {
      amount,
      category,
      merchant,
      item_name: null,
      merchant_type: "discretionary" as const,
      essential: false,
      confidence: 0.8,
      paraphrased: `Spend RM${amount.toFixed(2)} on item at ${merchant} (${category})`,
    },
  };
}

// ─── Chat Bubble ─────────────────────────────────────────────────────────────
function ChatBubble({ msg, result }: { msg: ChatMessage; result?: CheckResponse }) {
  const isUser = msg.role === "user";
  const isVerdictMessage = !isUser && result && msg.content.includes("Risk score:");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] ${isUser ? "order-1" : "order-1"}`}>
        {isUser ? (
          <div className="rounded-2xl rounded-br-md bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm">
            {msg.content}
          </div>
        ) : isVerdictMessage ? (
          <VerdictChatCard msg={msg} result={result!} />
        ) : (
          <div className="rounded-2xl rounded-bl-md bg-zinc-100 dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200 shadow-sm">
            {msg.content}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Verdict Card inside chat ────────────────────────────────────────────────
function VerdictChatCard({ msg, result }: { msg: ChatMessage; result: CheckResponse }) {
  const cfg = VERDICT_CONFIG[result.verdict];

  // Parse the AI content to extract sections
  const lines = msg.content.split("\n");
  const headline = lines[0] || "";
  const nudgeText = lines.slice(2).join("\n").split("📊")[0]?.trim() || "";

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-4 shadow-sm`}>
      {/* Verdict headline */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl">{cfg.emoji}</span>
        <span className={`text-lg font-bold ${cfg.color}`}>
          {result.verdict === "boleh" ? "Boleh!" : result.verdict === "fikir_dulu" ? "Fikir Dulu" : "Jangan Dulu"}
        </span>
      </div>

      {/* Nudge */}
      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
        {result.nudge_en}
      </p>

      {/* Stats */}
      <div className="flex gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-zinc-400">Risk:</span>
          <span className={`font-bold ${cfg.color}`}>{result.risk_score}/100</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-zinc-400">Impact:</span>
          <span className={`font-bold ${cfg.color}`}>{result.budget_impact_pct.toFixed(0)}%</span>
        </div>
        {result.projected_daily_survival_amount != null && (
          <div className="flex items-center gap-1">
            <span className="text-zinc-400">Daily left:</span>
            <span className="font-bold text-zinc-700">{formatRM(result.projected_daily_survival_amount)}</span>
          </div>
        )}
      </div>

      {/* Agent 2: 3-way trade-off options */}
      <div className="space-y-2 mb-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Finance Planner Negotiation</p>

        <div className="rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">💰</span>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Option A — Buy with Cash</p>
              <p className="text-[11px] text-zinc-500">Spend now, tighter runway ahead.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950 p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">📉</span>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Option B — Use BNPL</p>
              <p className="text-[11px] text-zinc-500">Character demotion + XP penalty.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950 p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">🧘</span>
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Option C — Walk Away (48h)</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">+200 Discipline XP · FOMO Slayer badge.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reason codes */}
      {result.reason_codes && result.reason_codes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {result.reason_codes.map((code) => (
            <span key={code} className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-600 dark:text-zinc-400">
              {code}
            </span>
          ))}
        </div>
      )}

      {/* CTA buttons */}
      {result.cta_buttons && result.cta_buttons.length > 0 && (
        <div className="flex gap-2">
          {result.cta_buttons.map((btn) => (
            <button
              key={btn}
              className="rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
            >
              {btn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Budget Summary Mini Card ────────────────────────────────────────────────
function BudgetMiniCard() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">Remaining Budget</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{formatRM(340)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">Days Left</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">7</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">Daily Safe</p>
          <p className="text-xl font-bold text-emerald-600">{formatRM(48.57)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function ChatCheckScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CheckResponse | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function onVoiceParsed(parsed: { amount: string; merchant: string; category: string }) {
    const text = `I want to spend RM${parsed.amount} at ${parsed.merchant} for ${parsed.category}`;
    setInput(text);
    setVoiceActive(false);
    inputRef.current?.focus();
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    // Add user message
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatCheckSpend({ message: text, language_preference: "manglish" });

      // Find the parsed intent message and the verdict message
      const parsedMsg = res.messages.find((m) => m.role === "bajetbuddy" && m.content.startsWith("OK, I parsed:"));
      const verdictMsg = res.messages.find((m) => m.role === "bajetbuddy" && m.content.includes("Risk score:"));

      const newMessages: ChatMessage[] = [];
      if (parsedMsg) newMessages.push(parsedMsg);
      if (verdictMsg) newMessages.push(verdictMsg);

      setMessages((prev) => [...prev, ...newMessages]);
      setLastResult(res.result);
    } catch {
      // Fallback: try regex parsing on the client side
      const amountMatch = text.match(/rm\s*(\d+(?:\.\d{1,2})?)/i);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 50;
      const category = text.match(/food|transport|shopping|entertainment|health|utilities|education/i)?.[0] || "shopping";
      const merchant = text.match(/(?:at|from|di)\s+([A-Za-z\s]+?)(?:\s|$)/i)?.[1]?.trim() || "Unknown";

      const demo = buildDemoResult(text, amount, category, merchant);
      const parsedMsg = demo.messages.find((m) => m.role === "bajetbuddy" && m.content.startsWith("OK, I parsed:"));
      const verdictMsg = demo.messages.find((m) => m.role === "bajetbuddy" && m.content.includes("Risk score:"));

      const newMessages: ChatMessage[] = [];
      if (parsedMsg) newMessages.push(parsedMsg);
      if (verdictMsg) newMessages.push(verdictMsg);

      setMessages((prev) => [...prev, ...newMessages]);
      setLastResult(demo.result);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function reset() {
    setMessages([]);
    setLastResult(null);
    setInput("");
    inputRef.current?.focus();
  }

  // Determine which message has the verdict (the last one with "Risk score:")
  const verdictMsgIndex = [...messages].reverse().findIndex(
    (m) => m.role === "bajetbuddy" && m.content.includes("Risk score:")
  );
  const lastVerdictIdx = verdictMsgIndex >= 0 ? messages.length - 1 - verdictMsgIndex : -1;

  return (
    <div className="flex flex-col h-full">
      {/* Budget summary */}
      <div className="px-4 pt-4 pb-2">
        <BudgetMiniCard />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-4xl mb-4">🤖</p>
              <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Your Finance Planner is ready
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                Type or speak what you&apos;re thinking of buying.
                I&apos;ll check your budget and help you decide.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  "Should I buy a RM189 dress from Shopee?",
                  "Nak beli Nike Air Max RM450",
                  "Is RM35 for lunch okay today?",
                ].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setInput(hint)}
                    className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <ChatBubble
              key={idx}
              msg={msg}
              result={idx === lastVerdictIdx ? lastResult ?? undefined : undefined}
            />
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-zinc-400">BajetBuddy is analyzing your spend...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick calculator */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-zinc-200 dark:border-zinc-700"
          >
            <QuickCalculator
              onResult={(checkResult) => {
                setLastResult(checkResult);

                const aiMsg: ChatMessage = {
                  role: "bajetbuddy",
                  content: `${checkResult.verdict === "jangan_dulu" ? "❌" : checkResult.verdict === "fikir_dulu" ? "🤔" : "✅"} **${checkResult.verdict.toUpperCase().replace("_", " ")}**\n\n${checkResult.nudge_en}\n\n📊 Risk score: ${checkResult.risk_score}/100 | Budget impact: ${checkResult.budget_impact_pct.toFixed(0)}%\n\nI ada 3 options for you:\n💰 Option A — Buy with cash\n📉 Option B — Use BNPL\n🧘 Option C — Walk away (48h, +200 XP)\n\nMana satu you nak pilih?`,
                };
                setMessages((prev) => [...prev, aiMsg]);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice input overlay */}
      {voiceActive && (
        <div className="px-4 pb-2">
          <VoiceInput
            onParsed={(parsed) => {
              onVoiceParsed(parsed);
            }}
          />
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Voice button */}
          <button
            type="button"
            onClick={() => setVoiceActive(!voiceActive)}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              voiceActive
                ? "bg-red-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
            }`}
            aria-label="Voice input"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g. Should I buy a RM189 dress from Shopee?"
            className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-400"
            disabled={loading}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-emerald-700 transition-colors"
            aria-label="Send"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>

          {/* Calculator toggle */}
          <button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              showCalculator
                ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-600"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
            }`}
            aria-label="Toggle calculator"
          >
            <Calculator className="w-5 h-5" />
          </button>
        </div>

        {/* Reset button — only when there are messages */}
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="mt-2 w-full text-center text-xs text-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Start new check
          </button>
        )}
      </div>
    </div>
  );
}
