"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Calculator, Loader2, RefreshCw, AlertCircle, MessageCircle } from "lucide-react";
import { chatCheckSpend, checkSpend, getBudgetSummary } from "@/lib/api";
import { VERDICT_CONFIG, CATEGORIES } from "@/lib/constants";
import type { CategoryId } from "@/lib/constants";
import { formatRM, cn } from "@/lib/utils";
import type { BudgetSummary, ChatMessage, ChatCheckResponse, CheckResponse } from "@/types";
import { NumPad } from "./NumPad";
import { CategoryPicker } from "./CategoryPicker";
import { BudgetImpactBar } from "./BudgetImpactBar";
import { VoiceInput } from "./VoiceInput";

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
          <div className="rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-white shadow-sm">
            {msg.content}
          </div>
        ) : isVerdictMessage ? (
          <VerdictChatCard msg={msg} result={result!} />
        ) : (
          <div className="rounded-2xl rounded-bl-md bg-surface-muted px-4 py-3 text-sm text-foreground shadow-sm">
            {renderMarkdownLite(msg.content)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function renderMarkdownLite(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => {
    const parts = line.split("**");
    return (
      <span key={`line-${lineIndex}`}>
        {parts.map((part, partIndex) =>
          partIndex % 2 === 1 ? <strong key={`b-${partIndex}`}>{part}</strong> : part
        )}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
}

// ─── Verdict Card inside chat ────────────────────────────────────────────────
function VerdictChatCard({ msg, result }: { msg: ChatMessage; result: CheckResponse }) {
  const cfg = VERDICT_CONFIG[result.verdict];

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
      <p className="text-sm text-foreground leading-relaxed mb-3">
        {result.nudge_en}
      </p>

      {/* Stats */}
      <div className="flex gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted">Risk:</span>
          <span className={`font-bold ${cfg.color}`}>{result.risk_score}/100</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted">Impact:</span>
          <span className={`font-bold ${cfg.color}`}>{result.budget_impact_pct.toFixed(0)}%</span>
        </div>
        {result.xp_earned > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-muted">XP:</span>
            <span className="font-bold text-primary">+{result.xp_earned}</span>
          </div>
        )}
      </div>

      {/* Agent 2: 3-way trade-off options */}
      <div className="space-y-2 mb-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Finance Planner Negotiation</p>

        <div className="rounded-xl border border-border bg-white p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">💰</span>
            <div>
              <p className="text-xs font-semibold text-foreground">Option A — Buy with Cash</p>
              <p className="text-[11px] text-muted">Spend now, tighter runway ahead.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-tertiary/30 bg-tertiary-light p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">📉</span>
            <div>
              <p className="text-xs font-semibold text-foreground">Option B — Use BNPL</p>
              <p className="text-[11px] text-muted">Character demotion + XP penalty.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-secondary/30 bg-secondary-light p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">🧘</span>
            <div>
              <p className="text-xs font-semibold text-secondary-dark">Option C — Walk Away (48h)</p>
              <p className="text-[11px] text-secondary-dark">+200 Discipline XP · FOMO Slayer badge.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reason codes */}
      {result.reason_codes && result.reason_codes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {result.reason_codes.map((code) => (
            <span key={code} className="rounded-full bg-neutral-light px-2 py-0.5 text-[10px] text-neutral-dark">
              {code}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Budget Summary Mini Card ────────────────────────────────────────────────
function BudgetMiniCard({ budget, loading }: { budget: BudgetSummary | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
        <p className="text-xs text-amber-700 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Budget data unavailable. Some features may be limited.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">Remaining Budget</p>
          <p className="text-xl font-bold text-foreground">{formatRM(budget.remaining)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">Days Left</p>
          <p className="text-xl font-bold text-foreground">{budget.days_left}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted font-semibold">Daily Safe</p>
          <p className="text-xl font-bold text-primary">{formatRM(budget.daily_safe_amount)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
type Mode = "chat" | "manual";

export function ChatCheckScreen() {
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CheckResponse | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  // Manual entry state
  const [manualAmount, setManualAmount] = useState("");
  const [manualCategory, setManualCategory] = useState<CategoryId>("shopping");
  const [manualMerchant, setManualMerchant] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<CheckResponse | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch real budget summary on mount
  useEffect(() => {
    getBudgetSummary()
      .then((data) => {
        setBudget(data);
        setBudgetLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch budget:", err);
        setBudgetLoading(false);
        // No fallback to fake data — budget stays null and UI shows warning
      });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function onVoiceParsed(parsed: { amount: string; merchant: string; category: string }) {
    const text = `I want to spend RM${parsed.amount} on ${parsed.category} at ${parsed.merchant}`;
    setInput(text);
    setVoiceActive(false);
    inputRef.current?.focus();
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatCheckSpend({ message: text, language_preference: "manglish" });

      // Filter messages: skipping the confirmation paraphrase, show only verdict
      const verdictMsg = res.messages.find(
        (m) => m.role === "bajetbuddy" && m.content.includes("Risk score:")
      );
      if (verdictMsg) {
        setMessages((prev) => [...prev, verdictMsg]);
      } else {
        // Fallback: show all non-user, non-paraphrase messages
        const replyMsgs = res.messages.filter(
          (m) => m.role === "bajetbuddy" && !m.content.startsWith("OK, I parsed:")
        );
        setMessages((prev) => [...prev, ...replyMsgs]);
      }
      setLastResult(res.result);
    } catch (err) {
      console.error("Check failed:", err);
      setError("Could not connect to the AI. Please make sure the API server is running and try again.");
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
    setError(null);
    setManualAmount("");
    setManualMerchant("");
    setManualResult(null);
    setManualError(null);
    inputRef.current?.focus();
  }

  async function handleManualCheck() {
    if (!manualAmount || parseFloat(manualAmount) <= 0) return;
    setManualLoading(true);
    setManualError(null);
    setManualResult(null);
    try {
      const res = await checkSpend({
        amount: parseFloat(manualAmount),
        category: manualCategory,
        merchant: manualMerchant || "Unknown",
      });
      setManualResult(res);
      setLastResult(res);
    } catch (err) {
      console.error("Manual check failed:", err);
      setManualError("Could not reach the API. Make sure the backend is running.");
    } finally {
      setManualLoading(false);
    }
  }

  // Determine which message has the verdict (the last one with "Risk score:")
  const verdictMsgIndex = [...messages].reverse().findIndex(
    (m) => m.role === "bajetbuddy" && m.content.includes("Risk score:")
  );
  const lastVerdictIdx = verdictMsgIndex >= 0 ? messages.length - 1 - verdictMsgIndex : -1;

  return (
    <div className="flex flex-col h-full">
      {/* Budget summary — real data from DB via API */}
      <div className="px-4 pt-4 pb-2">
        <BudgetMiniCard budget={budget} loading={budgetLoading} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Empty state */}
        {messages.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-4xl mb-4">🤖</p>
              <p className="text-lg font-semibold text-foreground mb-2">
                Your Finance Planner is ready
              </p>
              <p className="text-sm text-muted leading-relaxed max-w-xs">
                Type or speak what you&apos;re thinking of buying.
                The AI will check your budget and spending habits to help you decide.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  "Should I buy a RM189 dress from Shopee?",
                  "Nak beli Nike Air Max RM450",
                  "Is RM35 for lunch okay today?",
                ].map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setInput(hint)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface-muted transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-1">Something went wrong</p>
              <p>{error}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-2 text-xs underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
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
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-muted">BajetBuddy is analyzing your spend...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Manual Entry Mode ──────────────────────────────────────────── */}
      {mode === "manual" && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Amount display */}
          <div className="text-center">
            <p className="text-xs text-muted mb-1">How much are you spending?</p>
            <div className="text-5xl font-bold text-foreground tracking-tight">
              RM{manualAmount || "0"}
            </div>
          </div>

          {/* Merchant input */}
          <input
            type="text"
            placeholder="Where? (e.g. Shopee, McDonald's)"
            value={manualMerchant}
            onChange={(e) => setManualMerchant(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted"
          />

          {/* Category picker */}
          <CategoryPicker selected={manualCategory} onChange={setManualCategory} />

          {/* Budget impact preview */}
          {manualAmount && parseFloat(manualAmount) > 0 && budget && (
            <BudgetImpactBar amount={parseFloat(manualAmount)} remaining={budget.remaining} />
          )}

          {/* Numpad */}
          <NumPad value={manualAmount} onChange={setManualAmount} />

          {/* Check button */}
          <button
            onClick={handleManualCheck}
            disabled={manualLoading || !manualAmount || parseFloat(manualAmount) <= 0}
            className="w-full rounded-2xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-4 text-lg transition-colors flex items-center justify-center gap-2"
          >
            {manualLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Checking…</>
            ) : (
              "Check Spend ✅"
            )}
          </button>

          {/* Manual error */}
          {manualError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{manualError}</p>
            </div>
          )}

          {/* Manual result */}
          {manualResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <VerdictChatCard
                msg={{
                  role: "bajetbuddy",
                  content: [
                    `${VERDICT_CONFIG[manualResult.verdict].emoji} **${manualResult.verdict.toUpperCase().replace("_", " ")}**`,
                    "",
                    manualResult.nudge_en || manualResult.explanation,
                    "",
                    `📊 Risk score: ${manualResult.risk_score}/100 | Budget impact: ${manualResult.budget_impact_pct.toFixed(0)}%`,
                    "",
                    manualResult.verdict === "jangan_dulu"
                      ? "I ada 3 options for you:\n💰 Option A — Buy with cash\n📉 Option B — Use BNPL\n🧘 Option C — Walk away (48h, +200 XP)\n\nMana satu you nak pilih?"
                      : manualResult.verdict === "fikir_dulu"
                        ? "You boleh proceed, tapi fikir dulu. Maybe pause before you tap?"
                        : "Your budget looks healthy. Proceed mindfully! 💪",
                  ].join("\n"),
                }}
                result={manualResult}
              />
            </motion.div>
          )}
        </div>
      )}

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

      {/* ── Bottom bar ─────────────────────────────────────────────────── */}
      <div className="border-t border-border px-4 py-3">
        {/* Chat input (only in chat mode) */}
        {mode === "chat" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceActive(!voiceActive)}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                voiceActive ? "bg-red-500 text-white" : "bg-surface-muted text-muted hover:bg-neutral-light"
              )}
              aria-label="Voice input"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g. Should I buy a RM189 dress from Shopee?"
              className="flex-1 rounded-2xl border border-border bg-white px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted"
              disabled={loading}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-dark transition-colors"
              aria-label="Send"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Mode toggle + action links */}
        <div className={cn("flex items-center justify-between", mode === "chat" ? "mt-2" : "")}>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <button
              type="button"
              onClick={() => setMode(mode === "chat" ? "manual" : "chat")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "manual"
                  ? "bg-primary-light text-primary"
                  : "bg-surface-muted text-muted hover:text-foreground"
              )}
            >
              {mode === "chat" ? (
                <><Calculator className="w-3.5 h-3.5" /> Manual Entry</>
              ) : (
                <><MessageCircle className="w-3.5 h-3.5" /> AI Chat</>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {(messages.length > 0 || manualResult) && (
              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                New
              </button>
            )}
            <a
              href="/transactions"
              className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              History
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
