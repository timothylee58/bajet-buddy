"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, ArrowRight } from "lucide-react";

// ── Animation helpers ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    emoji: "🛡️",
    bg: "bg-primary-light",
    color: "text-primary-dark",
    title: "Check Before You Swipe",
    desc: "Ask AI before every purchase. Get a Boleh, Fikir Dulu, or Jangan Dulu verdict with a Manglish roast.",
  },
  {
    emoji: "📷",
    bg: "bg-secondary-light",
    color: "text-secondary-dark",
    title: "Snap Receipts Instantly",
    desc: "Photo your receipt and Agent 4 extracts merchant, amount, and category automatically. No typing needed.",
  },
  {
    emoji: "📊",
    bg: "bg-tertiary-light",
    color: "text-tertiary-dark",
    title: "Budget Intelligence",
    desc: "See where every ringgit went. AI-generated spending breakdowns with category budgets tailored to you.",
  },
  {
    emoji: "⚡",
    bg: "bg-amber-100",
    color: "text-amber-800",
    title: "Level Up Your Savings",
    desc: "Earn XP, unlock badges, and grow a pet companion as you build better money habits every day.",
  },
] as const;

const STEPS = [
  {
    num: "01",
    emoji: "👋",
    title: "Answer 5 quick questions",
    desc: "Tell us about your spending style — from kopi budget to midnight Shopee habits. No boring forms.",
  },
  {
    num: "02",
    emoji: "📸",
    title: "Scan a receipt (optional)",
    desc: "Upload a bank statement or receipt photo. Our AI reads it so you don't have to type a thing.",
  },
  {
    num: "03",
    emoji: "🧠",
    title: "Meet your spending persona",
    desc: "Receive your AI-assigned persona, a personalised budget estimate, and a roast you'll actually laugh at.",
  },
] as const;

const VERDICTS = [
  { label: "Boleh ✅", desc: "Go ahead", bg: "bg-emerald-100", text: "text-emerald-800" },
  { label: "Fikir Dulu 🤔", desc: "Think twice", bg: "bg-amber-100", text: "text-amber-800" },
  { label: "Jangan Dulu 🚫", desc: "Not now", bg: "bg-red-100", text: "text-red-700" },
] as const;

const STATS = [
  { emoji: "🤖", stat: "5 AI Agents", label: "working for you" },
  { emoji: "🇲🇾", stat: "Manglish", label: "advisor tone" },
  { emoji: "⚡", stat: "3 min", label: "to set up" },
  { emoji: "🎉", stat: "Free", label: "to start" },
] as const;

const PETS = [
  { src: "/pets/squir 1 Background Removed.png", name: "Squirrel" },
  { src: "/pets/fox 1 Background Removed.png", name: "Fox" },
  { src: "/pets/rabbit 1 Background Removed.png", name: "Rabbit" },
  { src: "/pets/racoon 1 Background Removed.png", name: "Raccoon" },
] as const;

// ── Page ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <FeaturesSection />
      <HowItWorksSection />
      <PetsSection />
      <StatsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-5 sm:px-8 py-4 bg-background/85 backdrop-blur-xl border-b border-border/30">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl">🤑</span>
        <span className="font-headline text-xl font-bold text-primary">BajetBuddy</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/dashboard"
          className="hidden sm:block text-sm font-semibold text-muted hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/check"
          className="hidden sm:block text-sm font-semibold text-muted hover:text-foreground transition-colors"
        >
          Check Spend
        </Link>
        <Link
          href="/start"
          className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-primary-dark transition-colors chunky-shadow"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative px-5 sm:px-8 pt-16 pb-24 text-center overflow-hidden">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-tertiary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-secondary/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 max-w-3xl mx-auto"
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} custom={0}
          className="inline-flex items-center gap-2 bg-tertiary-light text-tertiary-dark border border-tertiary/20 px-4 py-1.5 rounded-full text-sm font-bold mb-8"
        >
          <Zap className="w-4 h-4 fill-current" />
          AI-powered spending intervention for Malaysians
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} custom={1}
          className="font-headline text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6"
        >
          Duit Smart,{" "}
          <span className="text-primary">Hidup Lega.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p variants={fadeUp} custom={2}
          className="text-lg sm:text-xl text-muted max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Before you tap that card — ask your AI budget buddy first. BajetBuddy
          roasts your spending habits and helps you actually save money. In
          Manglish, obviously.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} custom={3}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-10"
        >
          <Link
            href="/start"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-primary-dark transition-all chunky-shadow active-press"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 border-2 border-border bg-surface px-8 py-4 rounded-2xl font-bold text-base hover:bg-white transition-all"
          >
            See the Dashboard →
          </Link>
        </motion.div>

        {/* Verdict pills */}
        <motion.div variants={fadeUp} custom={4}
          className="flex flex-wrap justify-center gap-2"
        >
          {VERDICTS.map((v) => (
            <div
              key={v.label}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${v.bg} ${v.text}`}
            >
              {v.label}
              <span className="font-normal opacity-60 text-xs">— {v.desc}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section className="px-5 sm:px-8 py-20 max-w-5xl mx-auto">
      <FadeSection className="text-center mb-12">
        <h2 className="font-headline text-4xl sm:text-5xl font-bold mb-3">
          Everything you need to spend smarter
        </h2>
        <p className="text-muted text-lg max-w-xl mx-auto">
          Built for Malaysians who want to be better with money — without the
          boring spreadsheets.
        </p>
      </FadeSection>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map((f, i) => (
          <FadeSection key={f.title}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-surface rounded-3xl p-6 border border-border/30 chunky-shadow h-full flex flex-col gap-4"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${f.bg}`}
              >
                {f.emoji}
              </div>
              <div>
                <h3 className="font-headline text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          </FadeSection>
        ))}
      </div>
    </section>
  );
}

// ── How It Works ───────────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section className="px-5 sm:px-8 py-20 bg-surface-muted/60">
      <div className="max-w-3xl mx-auto">
        <FadeSection className="text-center mb-12">
          <h2 className="font-headline text-4xl sm:text-5xl font-bold mb-3">
            Ready in 3 minutes
          </h2>
          <p className="text-muted text-lg">
            No sign-up required. Just answer a few questions and meet your AI
            financial twin.
          </p>
        </FadeSection>

        <div className="space-y-5">
          {STEPS.map((s, i) => (
            <FadeSection key={s.num}>
              <div className="flex items-start gap-5 bg-surface rounded-3xl p-6 border border-border/30 chunky-shadow">
                <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-headline text-lg font-bold">
                  {s.num}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-2xl">{s.emoji}</span>
                    <h3 className="font-headline text-xl font-bold">{s.title}</h3>
                  </div>
                  <p className="text-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </FadeSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pet companions ─────────────────────────────────────────────────────────

function PetsSection() {
  return (
    <section className="px-5 sm:px-8 py-20 max-w-4xl mx-auto text-center">
      <FadeSection>
        <h2 className="font-headline text-4xl sm:text-5xl font-bold mb-3">
          Meet your savings companion 🐾
        </h2>
        <p className="text-muted text-lg max-w-xl mx-auto mb-12">
          Your pet grows and levels up as you build better money habits. The more
          you save, the more it evolves.
        </p>
      </FadeSection>

      <div className="grid grid-cols-4 gap-4 sm:gap-8">
        {PETS.map((pet, i) => (
          <FadeSection key={pet.name}>
            <motion.div
              whileHover={{ scale: 1.06, y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="relative w-full aspect-square bg-primary-light rounded-3xl border-2 border-primary/20 overflow-hidden flex items-center justify-center">
                <Image
                  src={pet.src}
                  alt={pet.name}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
              <span className="text-xs font-bold text-muted">{pet.name}</span>
            </motion.div>
          </FadeSection>
        ))}
      </div>
    </section>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────

function StatsSection() {
  return (
    <section className="px-5 sm:px-8 py-16 bg-surface-muted/60">
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5 text-center">
        {STATS.map((s, i) => (
          <FadeSection key={s.stat}>
            <div className="bg-surface rounded-3xl p-5 border border-border/30 chunky-shadow">
              <div className="text-3xl mb-2">{s.emoji}</div>
              <div className="font-headline text-3xl font-bold text-primary">{s.stat}</div>
              <div className="text-xs text-muted mt-1 font-semibold">{s.label}</div>
            </div>
          </FadeSection>
        ))}
      </div>
    </section>
  );
}

// ── CTA ────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="px-5 sm:px-8 py-24 text-center">
      <FadeSection className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-primary via-primary to-primary-dark rounded-[2rem] p-12 text-white relative overflow-hidden">
          {/* Glow overlay */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
          </div>

          <div className="relative z-10">
            <div className="text-5xl mb-5">🤑</div>
            <h2 className="font-headline text-4xl sm:text-5xl font-bold mb-4">
              Ready to spend smarter?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Join BajetBuddy and let AI help you make better money decisions. No
              credit card, no sign-up fees.
            </p>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary-light transition-all chunky-shadow active-press"
            >
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </FadeSection>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="px-5 sm:px-8 py-10 border-t border-border/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🤑</span>
            <span className="font-headline text-xl font-bold text-primary">BajetBuddy</span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-muted">
            <Link href="/start" className="hover:text-foreground transition-colors">Get Started</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/check" className="hover:text-foreground transition-colors">Check Spend</Link>
            <Link href="/receipts" className="hover:text-foreground transition-colors">Scan Receipt</Link>
            <Link href="/sentinel" className="hover:text-foreground transition-colors">Watchdog</Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border/20 text-center text-xs text-muted">
          Built with ❤️ for Malaysians who want to be financially responsible — but make it fun.
        </div>
      </div>
    </footer>
  );
}
