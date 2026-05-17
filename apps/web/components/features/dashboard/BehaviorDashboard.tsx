"use client";

import { useState } from "react";
import { Zap, Utensils, ShoppingBag, Car, PartyPopper, Sparkles } from "lucide-react";

// Using the same mock data concept
const sarahDemo = {
  salary: 3200,
  currentBalance: 340,
  monthlySpending: 2100,
  bnplDueThisMonth: 240,
  saved: 189,
  daysUntilSalary: 7,
  dailySurvival: 48,
};

export function BehaviorDashboard() {
  const [pulse] = useState(false); // Just a simple state for some interaction

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-32 pt-6 sm:px-6 lg:max-w-2xl">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-2xl font-bold text-primary">Hi Sarah 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-tertiary text-white px-3 py-1 rounded-full flex items-center gap-1 font-sans text-sm font-bold chunky-shadow">
            <Zap className="w-4 h-4 fill-current" /> 12 days
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-light border-2 border-primary overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              alt="Avatar" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuASuamrguWbqDk0M8zyzvndOiUqW3dzZT9zhbRTusrRhgpIGBAeuG8-bvRBe6JQbDET7UoIeUEnRp5KqrHZmn0GuMVtdHC6ODelBf0P1aqEZuFLrHX-MQMe5J8b_bgB9bvu1UFjzm9nvDleMxGPDq9vLqMjnxMXgNiRbFLl7BuXe1yqQsSoL2HZ_Gu0MwrN20n_o5N-pUeis4H3oiK7FFHCZsKxw-3aYU0FUn-9SndgPvBm2gEhLFkrts5qd51VgTZvxZDbCl1vMbYR"
            />
          </div>
        </div>
      </div>

      {/* Financial Heartbeat Card */}
      <section className="relative bg-gradient-to-br from-primary-light to-primary p-6 rounded-[24px] text-primary-dark border-b-4 border-primary chunky-shadow mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
        <div className="relative z-10 flex justify-between items-start mb-4">
          <div>
            <span className="font-sans text-sm font-bold opacity-90 uppercase tracking-wider text-primary-dark/80">Kaching! Heartbeat</span>
            <h2 className="font-headline text-5xl font-bold mt-1 leading-tight text-white drop-shadow-md">RM{sarahDemo.currentBalance}</h2>
          </div>
          <div className="bg-tertiary-light text-tertiary-dark px-3 py-1 rounded-full flex items-center gap-2 font-sans text-sm font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary pulse-dot"></span>
            Watch your bajet
          </div>
        </div>
        <p className="relative z-10 font-sans text-base mb-6 text-white/90">left for {sarahDemo.daysUntilSalary} days · RM{sarahDemo.dailySurvival}/day</p>
        
        <div className="relative z-10 space-y-2">
          <div className="flex justify-between font-sans text-sm font-bold text-white">
            <span>{sarahDemo.daysUntilSalary} days to gaji</span>
            <span>75% used</span>
          </div>
          <div className="h-4 w-full bg-black/20 rounded-full relative overflow-hidden liquid-progress">
            <div className="h-full bg-secondary-dark w-3/4 rounded-full transition-all duration-500"></div>
          </div>
        </div>
      </section>

      {/* Quick Stats Row */}
      <section className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-muted p-4 rounded-2xl border-b-4 border-border/30 flex flex-col items-center shadow-sm">
          <span className="font-sans text-xs font-bold text-muted uppercase">Spent</span>
          <span className="font-headline text-2xl font-semibold text-primary mt-1">RM2.1k</span>
        </div>
        <div className="bg-surface-muted p-4 rounded-2xl border-b-4 border-border/30 flex flex-col items-center shadow-sm">
          <span className="font-sans text-xs font-bold text-muted uppercase">BNPL due</span>
          <span className="font-headline text-2xl font-semibold text-red-600 mt-1">RM{sarahDemo.bnplDueThisMonth}</span>
        </div>
        <div className="bg-secondary-light p-4 rounded-2xl border-b-4 border-secondary/40 flex flex-col items-center shadow-sm">
          <span className="font-sans text-xs font-bold text-secondary-dark uppercase">Saved</span>
          <span className="font-headline text-2xl font-semibold text-secondary-dark mt-1">RM{sarahDemo.saved}</span>
        </div>
      </section>

      {/* Mascot Companion Card */}
      <section className="bg-white p-5 rounded-2xl border-2 border-primary-light flex gap-4 items-center chunky-shadow mb-8">
        <div className="w-24 h-24 flex-shrink-0 bg-primary-light rounded-2xl border-b-4 border-primary/20 flex items-center justify-center relative group">
          <img 
            className="w-20 h-20 object-contain" 
            alt="Young Bajet Squirrel" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtpT2laJMMS-JVTJYIW9EM708z-AFaBZ13hMkXA2HH-D3PButDiJc4km5fRTs2F6PobV16Pl7xoKg21G99dBGkUevNAgb-q1RZGJM4jbqhwwSwg98y4S6Z5Kl1c7LEFMVkaszS2QQ1dNMLTTdJTzl5gQAFjgDUOZO0L2HVcbgfJtCYXDgOZbBMUJ9xkj4jPPV2Ar5JdFeE3_YzrnKITFmFcqlGC9hyVml9TxxoYrYdVtob2IqK-b2pdP0wQRJenkt5adsbLtTItRZq" 
          />
          <div className="absolute -bottom-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">LV.10</div>
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-headline text-2xl text-foreground">Young Bajet</h3>
            <p className="font-sans text-sm font-bold text-primary italic">"Energetic and playful. Always curious!"</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-sans font-bold text-muted uppercase">
              <span>12-day streak</span>
              <span>18 days to LV.30</span>
            </div>
            <div className="h-2 w-full bg-border/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/5 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Badge */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-headline text-2xl">Latest Collection</h3>
          <button className="text-primary font-sans text-sm font-bold active-press">See all</button>
        </div>
        <div className="bg-white p-4 rounded-2xl border-2 border-border/30 flex items-center gap-4 relative overflow-hidden group active-press cursor-pointer">
          <div className="w-14 h-14 bg-gradient-to-tr from-yellow-100 to-yellow-300 rounded-full flex items-center justify-center text-2xl chunky-shadow border-2 border-yellow-400">
            🌙
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
          <div>
            <h4 className="font-headline text-2xl flex items-center gap-2">
              Tidur Awal 
              <Sparkles className="text-yellow-500 animate-bounce w-5 h-5 fill-current" />
            </h4>
            <p className="font-sans text-base text-muted">Slept before 11PM for 3 days! Steady.</p>
          </div>
        </div>
      </section>

      {/* Budget by Category */}
      <section className="mb-8">
        <h3 className="font-headline text-2xl mb-4 px-1">Bajet by Category</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
          {/* Food */}
          <div className="min-w-[160px] bg-white p-4 rounded-2xl border-b-4 border-border/30 chunky-shadow">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-3">
              <Utensils className="w-5 h-5" />
            </div>
            <h4 className="font-sans text-sm font-bold mb-1">Food</h4>
            <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-orange-400 w-[84%]"></div>
            </div>
            <p className="text-[12px] font-sans font-bold"><span className="text-foreground">RM420</span><span className="text-muted">/500</span></p>
          </div>
          {/* Shopping */}
          <div className="min-w-[160px] bg-white p-4 rounded-2xl border-b-4 border-border/30 chunky-shadow">
            <div className="w-10 h-10 bg-primary-light text-primary-dark rounded-xl flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="font-sans text-sm font-bold mb-1">Shopping</h4>
            <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary w-[47%]"></div>
            </div>
            <p className="text-[12px] font-sans font-bold"><span className="text-foreground">RM189</span><span className="text-muted">/400</span></p>
          </div>
          {/* Transport */}
          <div className="min-w-[160px] bg-white p-4 rounded-2xl border-b-4 border-border/30 chunky-shadow">
            <div className="w-10 h-10 bg-secondary-light text-secondary-dark rounded-xl flex items-center justify-center mb-3">
              <Car className="w-5 h-5" />
            </div>
            <h4 className="font-sans text-sm font-bold mb-1">Transport</h4>
            <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden mb-2">
              <div className="h-full bg-secondary w-[60%]"></div>
            </div>
            <p className="text-[12px] font-sans font-bold"><span className="text-foreground">RM120</span><span className="text-muted">/200</span></p>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="pb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-headline text-2xl">Recent Perbelanjaan</h3>
          <button className="text-primary font-sans text-sm font-bold active-press">See all</button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border-b-4 border-border/30 active-press transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-muted rounded-xl flex items-center justify-center">
                <Utensils className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-sans text-base font-semibold">Village Park Nasi Lemak</p>
                <p className="font-sans text-[14px] text-muted">Food · Today, 1:30 PM</p>
              </div>
            </div>
            <p className="font-headline text-lg font-bold text-red-600">-RM15.50</p>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border-b-4 border-border/30 active-press transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-muted rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-secondary-dark" />
              </div>
              <div>
                <p className="font-sans text-base font-semibold">Grab Ride</p>
                <p className="font-sans text-[14px] text-muted">Transport · Yesterday</p>
              </div>
            </div>
            <p className="font-headline text-lg font-bold text-red-600">-RM22.00</p>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border-b-4 border-border/30 active-press transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-muted rounded-xl flex items-center justify-center">
                <PartyPopper className="w-6 h-6 text-tertiary" />
              </div>
              <div>
                <p className="font-sans text-base font-semibold">Tealive Lepak</p>
                <p className="font-sans text-[14px] text-muted">Lepak · 2 days ago</p>
              </div>
            </div>
            <p className="font-headline text-lg font-bold text-red-600">-RM8.00</p>
          </div>
        </div>
      </section>
    </div>
  );
}
