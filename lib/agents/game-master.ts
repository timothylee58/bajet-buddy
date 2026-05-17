import { z } from 'zod';
import { tool } from 'ai';

// ============================================================================
// BajetBuddy Game Master — System Prompt & Tools
// Five AI agents act as the "Game Master / Referee" enforcing rules of the
// financial game. Each tool represents a real agent capability.
// ============================================================================

export const systemPrompt = `
You are the **Game Master** of BajetBuddy — Malaysia's AI-powered spending intervention engine.

You embody 5 specialized AI Agents. Activate the right one based on what the user needs. Always be precise with numbers, specific with advice, and grounded in real Malaysian financial reality.

---

## YOUR 5 AGENT ROLES

### Agent 1: Profile & Balance Agent (🧠 Character Assigner)
**Role:** Analyze transaction history to assign or update the user's Character Persona Class. You detect spending patterns (midnight shopping, BNPL stacking, payday splurge, food delivery spirals) and map them to a persona. You explain WHY they got this persona with specific evidence.

**Available Persona Classes:**
- Midnight Shopee Queen 🛍️ — impulsive late-night marketplace purchases
- Gaji Habis King 💸 — spending velocity spikes right after payday
- Bubble Tea Bro 🧋 — small repeated F&B purchases compound into large monthly drain
- Mamak Lepak Spender 🍛 — social late-night dining clusters drain budget
- BNPL Roller 💳 — BNPL has become a recurring bridge for lifestyle purchases
- GrabFood Spiral 🛵 — delivery convenience drives avoidable food overspend
- Bonus Burner 🎉 — windfalls trigger outsized discretionary spending
- Future Homeowner 🏠 — stable spending, visible savings intent
- Savings Starter 🌱 — early budget discipline forming

**Precision rule:** Give a confidence score (0-100). Cite exact signals (e.g. "4 Shopee purchases after 10PM in 14 days"). Suggest one specific intervention rule.

### Agent 2: Finance Planner Agent (🧠 FOMO Negotiator)
**Role:** Intervene at the exact moment of financial temptation. When a user mentions buying something (especially with BNPL), you MUST:

1. **Validate the FOMO** — acknowledge the deal/discount feels good
2. **Expose the Trap** — point out hidden costs: BNPL stacking, daily runway impact, future debt pressure
3. **Present 3-Way Trade-off:**
   - Option A (Cash): Calculate post-purchase balance → daily runway. Warn if below RM40/day.
   - Option B (BNPL): Show true cost — monthly instalment, total BNPL load, character demotion risk. Always flag BNPL as dangerous for discretionary purchases above RM200.
   - Option C (Walk Away / 48h Cooldown): Reward +20 XP, bounty jar deposit (~10% of amount), 12h cooldown. This is the RECOMMENDED option when daily runway drops below RM40.

**Precision rule:** Always compute: remaining balance = current - amount, daily runway = remaining ÷ days until salary. Use RM notation. Flag BNPL danger when: amount > RM200 AND category is discretionary.

### Agent 3: Tabung Builder (🏦 Goal Architect)
**Role:** Convert natural language savings goals into structured Tabung (Malay for "money jar"). Generate custom-named goals with gamified rules.

**Rules:**
- Parse the goal name creatively (e.g. "mechanical keyboard" → "Keyboard Tech Tabung ⌨️")
- Calculate monthly contribution needed: target ÷ months
- Attach a gamified rule tied to user behavior (e.g. "double XP if no spend after 10PM", "bonus contribution if you cook instead of GrabFood")
- Check if the monthly contribution is realistic given their income and current spending

### Agent 4: Receipt Scanner Agent (📄 Automation Engine)
**Role:** Process receipt data and calculate rewards. When receipt info is provided:
- Map the category correctly (food/transport/shopping/entertainment/utilities/health/other)
- Compare against category average (allocated budget ÷ 4 weeks)
- If under average → award +50 XP + "Budget Warrior" badge
- If over average → give gentle nudge + suggest category budget review

### Agent 5: Macro-Market Sentinel (🌍 Inflasi Watchdog)
**Role:** Connect real-world Malaysian economic shifts to the user's personal finances.
- Monitor concepts: BNM OPR changes, subsidy rationalisation (RON95, diesel, chicken/egg price controls), SST changes, ringgit fluctuation
- Map to user's actual spending categories (fuel → RON95 subsidy, groceries → food inflation, utilities → TNB tariff)
- Generate "Inflasi Warrior" survival quests: keep category under X despite price hikes → earn bonus XP + badge
- Always personalize: "Based on your RM220 monthly grocery spend, a 15% chicken price hike means roughly +RM12-18/month"

---

## MALAYSIAN FINANCIAL CONTEXT (Always use these facts)

- 73% of Malaysians can't raise RM1,000 in an emergency (BNM)
- Average credit card debt: RM8,000–12,000
- BNPL exploded 400% post-2021 among 18–35 year olds
- Common BNPL providers: Shopee PayLater, Grab PayLater, Atome, SPayLater, Hoolah
- Malaysian salary cycle: typically end-of-month (25th–31st)
- KWSP/EPF: employee 11%, employer 13% (for salary < RM5,000)
- Common Malaysian spending: mamak (RM15–25), GrabFood (RM20–40), petrol (RM80–120/tank), Shopee impulse (RM50–200)

---

## PRECISION & TONE RULES

1. **Always use exact numbers.** Calculate percentages, daily runways, monthly impacts.
2. **Use Malaysian English / Manglish naturally** — "lah", "boss", "aik", "betul ke", "jaga-jaga" — but don't overdo it.
3. **Be direct about money.** Don't sugarcoat bad decisions. Call out BNPL danger explicitly.
4. **Give actionable next steps.** Every response should end with a specific thing the user can do NOW.
5. **Context-aware.** If the user mentions an amount, automatically compute impact on their stated balance/salary cycle.
6. **Celebrate wins.** When the user walks away or saves, genuinely celebrate — this is behavioral reinforcement.
`;

// ============================================================================
// AGENT TOOLS — Real calculations, not mock returns
// ============================================================================

// ─── Helper: detect persona from transaction patterns ────────────────────────
function detectPersona(transactions: string[], currentBalance?: number, monthlyIncome?: number) {
  const txs = transactions.map(t => t.toLowerCase());
  const totalTxs = txs.length;

  // Count patterns
  const shopeeLateCount = txs.filter(t =>
    (t.includes('shopee') || t.includes('lazada') || t.includes('tiktok shop')) &&
    (t.includes('am') || t.includes('1:') || t.includes('2:') || t.includes('23:') || t.includes('00:'))
  ).length;

  const bnplCount = txs.filter(t =>
    t.includes('bnpl') || t.includes('paylater') || t.includes('pay later') ||
    t.includes('atome') || t.includes('ansuran') || t.includes('installment')
  ).length;

  const foodDeliveryCount = txs.filter(t =>
    t.includes('grabfood') || t.includes('foodpanda') || t.includes('food delivery') ||
    t.includes('grab food')
  ).length;

  const mamakCount = txs.filter(t =>
    t.includes('mamak') || t.includes('nasi kandar') || t.includes('roti canai') ||
    t.includes('teh tarik')
  ).length;

  const shoppingCount = txs.filter(t =>
    t.includes('shopee') || t.includes('lazada') || t.includes('mall') ||
    t.includes('uniqlo') || t.includes('padini') || t.includes('nike')
  ).length;

  const bubbleTeaCount = txs.filter(t =>
    t.includes('bubble tea') || t.includes('starbucks') || t.includes('coffee') ||
    t.includes('latte') || t.includes('kopi') || t.includes('tealive') ||
    t.includes('chatime')
  ).length;

  // Determine persona with confidence
  let persona: string;
  let emoji: string;
  let description: string;
  let confidence: number;
  let signals: string[] = [];
  let intervention: string;

  if (bnplCount >= 3 && shoppingCount >= 4) {
    persona = 'BNPL Roller';
    emoji = '💳';
    description = 'BNPL has become a recurring bridge for lifestyle purchases, increasing future month pressure.';
    confidence = Math.min(65 + bnplCount * 10, 98);
    signals = [`${bnplCount} BNPL transactions detected`, `${shoppingCount} shopping purchases in period`];
    intervention = 'Block discretionary purchases when BNPL dues are within 7 days or active BNPL count exceeds 2.';
  } else if (foodDeliveryCount >= 5) {
    persona = 'GrabFood Spiral';
    emoji = '🛵';
    description = 'Delivery convenience and repeated app usage are driving avoidable food overspend.';
    confidence = Math.min(60 + foodDeliveryCount * 7, 95);
    signals = [`${foodDeliveryCount} food delivery orders detected`];
    intervention = 'Prompt cooking/pickup alternatives after 3+ delivery orders in a week.';
  } else if (shopeeLateCount >= 3) {
    persona = 'Midnight Shopee Queen';
    emoji = '🛍️';
    description = 'Impulse buys cluster late at night around marketplace merchants.';
    confidence = Math.min(60 + shopeeLateCount * 12, 97);
    signals = [`${shopeeLateCount} late-night marketplace purchases`, 'Spending concentrated after 10PM'];
    intervention = 'Hard wishlist delay for shopping after 10PM when daily runway < RM40.';
  } else if (mamakCount >= 4 && shoppingCount < 3) {
    persona = 'Mamak Lepak Spender';
    emoji = '🍛';
    description = 'Social late-night mamak sessions and convenience spending cluster into recurring budget leakage.';
    confidence = Math.min(55 + mamakCount * 9, 93);
    signals = [`${mamakCount} mamak/dining visits`, 'Late-night social spending pattern'];
    intervention = 'Warn on post-9PM dining streaks, suggest weekly cash cap for lepak spending.';
  } else if (bubbleTeaCount >= 6) {
    persona = 'Bubble Tea Bro';
    emoji = '🧋';
    description = 'Small repeated drink purchases quietly compound into a meaningful monthly drain.';
    confidence = Math.min(55 + bubbleTeaCount * 7, 92);
    signals = [`${bubbleTeaCount} beverage purchases detected`, `Estimated monthly drink spend: RM${bubbleTeaCount * 15}`];
    intervention = 'Trigger repetition nudge after 3rd beverage merchant hit in 7 days.';
  } else if (shoppingCount >= 5) {
    persona = 'Gaji Habis King';
    emoji = '💸';
    description = 'Spending velocity spikes sharply, leaving too little room for the rest of the cycle.';
    confidence = Math.min(50 + shoppingCount * 8, 90);
    signals = [`${shoppingCount} discretionary purchases`, 'Concentrated spending pattern'];
    intervention = 'Throttle non-essential spend during first 5 salary days, surface remaining runway aggressively.';
  } else if (monthlyIncome && currentBalance && currentBalance > (monthlyIncome * 0.3)) {
    persona = 'Future Homeowner';
    emoji = '🏠';
    description = 'Spending is comparatively stable with visible savings intent.';
    confidence = 75;
    signals = ['Healthy balance-to-income ratio', 'No dangerous spending patterns detected'];
    intervention = 'Reinforce long-term savings milestones, compare discretionary spend against housing goal progress.';
  } else {
    persona = 'Savings Starter';
    emoji = '🌱';
    description = 'Early budget discipline is forming but still needs support to maintain consistency.';
    confidence = 60;
    signals = ['Moderate spending patterns', 'Room for optimisation'];
    intervention = 'Reward check-ins and small wins, escalate only when budget tightens.';
  }

  return { persona, emoji, description, confidence, signals, intervention };
}

// ─── Helper: financial calculations ──────────────────────────────────────────
function calculateRunway(amount: number, currentBalance: number, daysUntilSalary: number) {
  const remaining = currentBalance - amount;
  const dailyRunway = remaining / Math.max(daysUntilSalary, 1);
  const safeThreshold = 40; // RM40/day is the safety floor
  const impactPct = Math.min((amount / Math.max(currentBalance, 1)) * 100, 100);

  return {
    remaining,
    dailyRunway,
    safeThreshold,
    isDanger: dailyRunway < safeThreshold,
    isTight: dailyRunway < safeThreshold * 1.5,
    impactPct: Math.round(impactPct * 10) / 10,
  };
}

function calculateBnplCost(amount: number, months: number = 3) {
  const monthly = amount / months;
  const estimatedInterest = amount * 0.015 * months; // rough 1.5%/month BNPL hidden cost
  return {
    monthlyInstalment: Math.round(monthly * 100) / 100,
    totalWithFees: Math.round((amount + estimatedInterest) * 100) / 100,
    warning: amount > 500 ? 'High BNPL commitment — this will stress future months' : 'Manageable if no other BNPL active',
  };
}

// ============================================================================
// EXPORTED TOOLS
// ============================================================================

export const tools = {
  // ─── Agent 1: Profile & Balance ────────────────────────────────────────────
  assignProfile: tool({
    description: 'Analyzes transaction history and assigns or updates the user\'s character persona class. Returns detailed profile with evidence, confidence, and intervention rules.',
    parameters: z.object({
      transactions: z.array(z.string()).describe('List of recent transaction descriptions with dates and amounts'),
      currentClass: z.string().optional().describe('Current persona class if known'),
      currentBalance: z.number().optional().describe('User current balance in RM'),
      monthlyIncome: z.number().optional().describe('User monthly income in RM'),
    }),
    execute: async ({ transactions, currentClass, currentBalance, monthlyIncome }) => {
      const result = detectPersona(transactions, currentBalance, monthlyIncome);

      const xpBonus = result.confidence > 85 ? 100 : result.confidence > 70 ? 50 : 25;

      return {
        previousClass: currentClass || 'None',
        newClass: result.persona,
        emoji: result.emoji,
        level: result.confidence > 85 ? 3 : result.confidence > 70 ? 2 : 1,
        description: result.description,
        confidence: result.confidence,
        signals: result.signals,
        suggestedIntervention: result.intervention,
        xpBonus,
        message: currentClass && currentClass !== result.persona
          ? `Profile evolved: ${currentClass} → ${result.persona} [Level ${result.confidence > 85 ? 3 : 2}]. ${result.signals.join('. ')}.`
          : `Profile: ${result.persona} [Level ${result.confidence > 85 ? 3 : 2}] (${result.confidence}% confidence). ${result.signals.join('. ')}.`,
        evolutionNote: currentClass && currentClass !== result.persona
          ? `Your spending habits shifted from ${currentClass} to ${result.persona}. ${result.intervention}`
          : undefined,
      };
    },
  }),

  // ─── Agent 2: Finance Planner / FOMO Negotiator ────────────────────────────
  negotiateFOMO: tool({
    description: 'Intervenes when a user is considering an impulse purchase. Provides financial runway calculations, BNPL cost analysis, and a 3-way trade-off. Always precise with numbers.',
    parameters: z.object({
      item: z.string().describe('The item the user wants to buy'),
      price: z.number().describe('Price in RM'),
      category: z.string().optional().describe('Spending category (food, shopping, transport, etc.)'),
      currentBalance: z.number().optional().describe('User current balance in RM'),
      daysUntilSalary: z.number().optional().describe('Days until next salary'),
      isBNPL: z.boolean().optional().describe('Whether user is considering Buy Now Pay Later'),
      existingBnplLoad: z.number().optional().describe('Existing BNPL due this month in RM'),
    }),
    execute: async ({ item, price, category = 'shopping', currentBalance = 340, daysUntilSalary = 7, isBNPL = false, existingBnplLoad = 0 }) => {
      const runway = calculateRunway(price, currentBalance, daysUntilSalary);
      const bnplCost = isBNPL ? calculateBnplCost(price) : null;

      const isDiscretionary = ['shopping', 'entertainment', 'food_delivery'].includes(category);
      const bnplDanger = isBNPL && isDiscretionary && price >= 200;

      return {
        item,
        priceRM: price,
        category,
        currentBalanceRM: currentBalance,
        daysUntilSalary,

        runwayAnalysis: {
          afterPurchaseBalance: runway.remaining,
          dailyRunwayAfter: runway.dailyRunway,
          safetyThreshold: runway.safeThreshold,
          isBelowSafe: runway.isDanger,
          isTight: runway.isTight,
          budgetImpactPct: runway.impactPct,
          verdict: runway.isDanger ? 'JANGAN_DULU' : runway.isTight ? 'FIKIR_DULU' : 'BOLEH',
        },

        bnplAnalysis: bnplCost ? {
          monthlyInstalment: bnplCost.monthlyInstalment,
          totalWithFees: bnplCost.totalWithFees,
          existingBnplLoad,
          newTotalBnpl: Math.round((existingBnplLoad + bnplCost.monthlyInstalment) * 100) / 100,
          warning: bnplCost.warning,
          dangerLevel: bnplDanger ? 'HIGH' : price >= 500 ? 'MEDIUM' : 'LOW',
        } : null,

        options: [
          {
            choice: 'cash',
            label: 'Option A — Buy with Cash 💵',
            impact: `Balance drops to RM${runway.remaining.toFixed(2)} → RM${runway.dailyRunway.toFixed(2)}/day for ${daysUntilSalary} days.`,
            warning: runway.isDanger ? `Only RM${runway.dailyRunway.toFixed(2)}/day — makan pun susah lah.` : runway.isTight ? 'Budget will be tight. Fikir dulu.' : undefined,
            xpDelta: 0,
            recommended: !runway.isDanger && !runway.isTight,
          },
          {
            choice: 'bnpl',
            label: 'Option B — Use BNPL 💳',
            impact: isBNPL
              ? `≈RM${bnplCost!.monthlyInstalment.toFixed(2)}/month × 3. Total BNPL load: RM${bnplCost!.totalWithFees.toFixed(2)}.`
              : 'BNPL splits cost into monthly payments but hides real price.',
            warning: bnplDanger
              ? `BNPL danger zone! RM${price} discretionary + existing RM${existingBnplLoad} BNPL = debt spiral risk.`
              : isBNPL ? 'BNPL is convenient but future you pays the price.' : undefined,
            xpDelta: -5,
            recommended: false,
          },
          {
            choice: 'walk_away',
            label: 'Option C — Walk Away 🚶',
            impact: `12h cooldown. +RM${(price * 0.1).toFixed(2)} to Bounty Jar. +20 XP.`,
            warning: undefined,
            xpDelta: 20,
            bountyRM: Math.round(price * 0.1 * 100) / 100,
            recommended: runway.isDanger || bnplDanger,
          },
        ],

        recommendation: bnplDanger
          ? 'STRONG WARNING: BNPL for discretionary purchase above RM200. Walk away. Future you will thank present you.'
          : runway.isDanger
          ? 'Daily runway below RM40 — this purchase will make the rest of the month very tight.'
          : runway.isTight
          ? 'You can proceed but your budget will be squeezed. Consider waiting.'
          : 'Your finances can handle this. Just track it and stay mindful.',
      };
    },
  }),

  // ─── Agent 3: Tabung Builder ───────────────────────────────────────────────
  buildTabung: tool({
    description: 'Creates a custom savings goal (Tabung) from natural language. Calculates monthly contribution needed and attaches gamified rules.',
    parameters: z.object({
      goal: z.string().describe('What the user wants to save for'),
      targetAmount: z.number().optional().describe('Target amount in RM'),
      durationMonths: z.number().optional().describe('Desired timeframe in months'),
      monthlyIncome: z.number().optional().describe('User monthly income for feasibility check'),
      currentSavings: z.number().optional().describe('Current savings in RM'),
    }),
    execute: async ({ goal, targetAmount = 500, durationMonths = 3, monthlyIncome = 3200, currentSavings = 0 }) => {
      const monthlyNeeded = Math.round((targetAmount - currentSavings) / durationMonths * 100) / 100;
      const incomePct = Math.round((monthlyNeeded / monthlyIncome) * 1000) / 10;
      const isRealistic = incomePct <= 20;

      // Creative tabung name
      const goalWords = goal.split(' ');
      const mainWord = goalWords[goalWords.length - 1] || goal;
      const tabungName = `${mainWord.charAt(0).toUpperCase() + mainWord.slice(1)} Tabung 🏦`;

      // Gamified rules
      const rules = [
        `Double XP multiplier on days you don't spend after 10 PM`,
        `Bonus RM5 contribution every time you cook instead of GrabFood`,
        `+50 XP if you hit the monthly target`,
        `Streak badge if you contribute ${durationMonths} months straight`,
      ];

      return {
        tabungName,
        goal,
        targetAmountRM: targetAmount,
        currentSavingsRM: currentSavings,
        monthsToTarget: durationMonths,
        monthlyContribution: monthlyNeeded,
        incomePercentage: incomePct,
        isRealistic,
        rules: rules.slice(0, 3),
        badge: durationMonths >= 6 ? 'Long-Term Saver 🏅' : 'Goal Getter ⭐',
        feasibilityNote: isRealistic
          ? `RM${monthlyNeeded}/month is ${incomePct}% of your income — very achievable!`
          : `RM${monthlyNeeded}/month is ${incomePct}% of income — ambitious but doable with discipline.`,
        message: `Tabung locked in: **${tabungName}**! Save RM${monthlyNeeded}/month for ${durationMonths} months to hit RM${targetAmount}. Let's go! 🚀`,
      };
    },
  }),

  // ─── Agent 4: Receipt Scanner ──────────────────────────────────────────────
  scanReceipt: tool({
    description: 'Processes scanned receipt data and calculates rewards. Maps categories, compares against averages, and awards XP.',
    parameters: z.object({
      storeName: z.string().describe('Merchant/store name'),
      totalAmount: z.number().describe('Total amount in RM'),
      category: z.string().optional().describe('Spending category hint'),
      purchaseItems: z.string().optional().describe('Brief description of items purchased'),
    }),
    execute: async ({ storeName, totalAmount, category = 'other', purchaseItems = '' }) => {
      // Category mapping
      const categoryMap: Record<string, string> = {
        mydin: 'groceries', lotus: 'groceries', aeon: 'groceries', giant: 'groceries', nsk: 'groceries', jaya: 'groceries', tesco: 'groceries', pasar: 'groceries',
        petronas: 'fuel', shell: 'fuel', caltex: 'fuel', bhp: 'fuel',
        grabfood: 'food_delivery', foodpanda: 'food_delivery', 'grab food': 'food_delivery',
        mamak: 'food', kfc: 'food', mcdonald: 'food', starbucks: 'food', tealive: 'food',
        shopee: 'shopping', lazada: 'shopping', uniqlo: 'shopping', padini: 'shopping', zalora: 'shopping',
        guardian: 'health', watsons: 'health', caring: 'health',
        tnb: 'utilities', syabas: 'utilities', maxis: 'utilities', celcom: 'utilities', digi: 'utilities',
        tgv: 'entertainment', gsc: 'entertainment', netflix: 'entertainment',
      };

      const storeLower = storeName.toLowerCase();
      const mappedCategory = categoryMap[storeLower] || category;

      // Category average estimates (per week)
      const averages: Record<string, number> = {
        groceries: 220, fuel: 80, food: 100, food_delivery: 75,
        shopping: 150, health: 60, utilities: 200, entertainment: 80, other: 100,
      };
      const categoryAverage = averages[mappedCategory] || 100;
      const underAverage = totalAmount < categoryAverage;

      return {
        storeName,
        totalAmountRM: totalAmount,
        category: mappedCategory,
        categoryAverageRM: categoryAverage,
        underCategoryAverage: underAverage,
        purchaseItems: purchaseItems || `${storeName} purchase`,
        xpAwarded: underAverage ? 50 : 10,
        badge: underAverage ? 'Budget Warrior 🏆' : null,
        message: underAverage
          ? `Nice! RM${totalAmount.toFixed(2)} is under your ${mappedCategory} average of RM${categoryAverage}. +50 XP! Budget Warrior streak! 🏆`
          : `RM${totalAmount.toFixed(2)} logged. Your ${mappedCategory} average is RM${categoryAverage}. Keep tracking!`,
        tip: underAverage
          ? 'You\'re spending below average in this category — keep it up!'
          : `Try to keep ${mappedCategory} under RM${Math.round(categoryAverage * 0.9)} next time for a Budget Warrior bonus.`,
      };
    },
  }),

  // ─── Agent 5: Macro-Market Sentinel ────────────────────────────────────────
  triggerMarketAlert: tool({
    description: 'Generates a localized Malaysian market alert. Maps macro events (subsidy changes, inflation, OPR) to user\'s personal spending categories with specific RM impact estimates.',
    parameters: z.object({
      event: z.string().describe('The macroeconomic event (e.g., subsidy rationalisation, inflation spike, BNM OPR change)'),
      impactedCategory: z.string().describe('User spending category impacted (groceries, fuel, utilities, food, transport)'),
      userMonthlySpend: z.number().optional().describe('User\'s typical monthly spend in this category (RM)'),
    }),
    execute: async ({ event, impactedCategory, userMonthlySpend = 200 }) => {
      // Estimate impact based on event type and category
      const impactMap: Record<string, { pctIncrease: number; fixedIncrease: number }> = {
        groceries: { pctIncrease: 12, fixedIncrease: 18 },
        fuel: { pctIncrease: 0, fixedIncrease: 25 },
        utilities: { pctIncrease: 8, fixedIncrease: 12 },
        food: { pctIncrease: 10, fixedIncrease: 8 },
        transport: { pctIncrease: 0, fixedIncrease: 20 },
      };

      const impact = impactMap[impactedCategory] || { pctIncrease: 10, fixedIncrease: 15 };
      const estimatedIncrease = Math.round(
        Math.max(userMonthlySpend * (impact.pctIncrease / 100), impact.fixedIncrease)
      );

      const questTarget = Math.round(userMonthlySpend * 1.05); // keep within 5% of current despite hike

      return {
        event,
        impactedCategory,
        userCurrentSpendRM: userMonthlySpend,
        estimatedIncreaseRM: estimatedIncrease,
        newEstimatedSpendRM: userMonthlySpend + estimatedIncrease,
        percentageIncrease: Math.round((estimatedIncrease / userMonthlySpend) * 100),

        quest: {
          title: 'Inflasi Warrior 🛡️',
          description: `Keep your ${impactedCategory} spending under RM${questTarget} this week despite the ${event.toLowerCase()}.`,
          reward: '+300 XP + Harga Tetap Badge',
          difficulty: estimatedIncrease > userMonthlySpend * 0.15 ? 'HARD' : 'MEDIUM',
        },

        personalizedAlert: `Heads up! 🚨 ${event}. Based on your RM${userMonthlySpend}/month ${impactedCategory} spend, this could mean roughly +RM${estimatedIncrease} more per month. That's RM${Math.round(estimatedIncrease * 12)}/year!`,

        survivalTips: [
          `Switch to house brands or pasar for ${impactedCategory} — save 15-20%`,
          `Buy in bulk during sales/promotions`,
          `Track ${impactedCategory} spending daily this week`,
          `Use cash instead of card/e-wallet for ${impactedCategory} — the physical pain helps`,
        ],
      };
    },
  }),

  // ─── NEW: Daily Financial Check-In ─────────────────────────────────────────
  dailyCheckIn: tool({
    description: 'Provides a daily financial health check. Reviews current balance, spending pace, upcoming bills, and gives a personalised tip.',
    parameters: z.object({
      currentBalance: z.number().describe('Current balance in RM'),
      daysUntilSalary: z.number().describe('Days until next salary'),
      spentToday: z.number().optional().describe('Amount spent today in RM'),
      spentThisWeek: z.number().optional().describe('Amount spent this week in RM'),
      upcomingBnpl: z.number().optional().describe('BNPL due within 7 days in RM'),
      streak: z.number().optional().describe('Current daily check-in streak'),
    }),
    execute: async ({ currentBalance, daysUntilSalary, spentToday = 0, spentThisWeek = 0, upcomingBnpl = 0, streak = 0 }) => {
      const dailyBudget = currentBalance / Math.max(daysUntilSalary, 1);
      const weekTotal = spentThisWeek + spentToday;
      const weeklyBudget = dailyBudget * 7;

      const healthScore = dailyBudget >= 40
        ? 'HEALTHY'
        : dailyBudget >= 25
        ? 'TIGHT'
        : 'CRITICAL';

      const tips = [
        healthScore === 'CRITICAL'
          ? '🔴 Your daily runway is below RM25. Pause all non-essential spending immediately.'
          : healthScore === 'TIGHT'
          ? '🟡 Budget is tight. Cook at home, avoid GrabFood, and delay any shopping.'
          : '🟢 Your budget looks good. Stay consistent and keep tracking!',
        upcomingBnpl > 0
          ? `⚠️ RM${upcomingBnpl.toFixed(2)} BNPL due within 7 days — make sure your balance covers it.`
          : '✅ No BNPL due this week — great position.',
        streak > 0
          ? `🔥 ${streak}-day check-in streak! Keep it going for a streak bonus.`
          : 'Start a daily check-in streak for bonus XP!',
      ];

      return {
        date: new Date().toISOString().split('T')[0],
        currentBalanceRM: currentBalance,
        daysToSalary: daysUntilSalary,
        dailyBudgetRM: Math.round(dailyBudget * 100) / 100,
        spentTodayRM: spentToday,
        spentThisWeekRM: weekTotal,
        weeklyBudgetRM: Math.round(weeklyBudget * 100) / 100,
        healthScore,
        upcomingBnplRM: upcomingBnpl,
        streak,
        tips: tips.filter(Boolean),
        xpEarned: streak >= 7 ? 15 : 5,
        message: `Daily check-in complete! Health: ${healthScore}. RM${dailyBudget.toFixed(2)}/day for ${daysUntilSalary} days. +${streak >= 7 ? 15 : 5} XP.`,
      };
    },
  }),

  // ─── NEW: Spending Review ──────────────────────────────────────────────────
  spendingReview: tool({
    description: 'Reviews spending by category and identifies optimisation opportunities. Provides specific, actionable advice.',
    parameters: z.object({
      transactions: z.array(z.object({
        category: z.string(),
        amount: z.number(),
        date: z.string().optional(),
      })).describe('Recent transactions with category and amount'),
      monthlyIncome: z.number().optional().describe('Monthly income in RM'),
    }),
    execute: async ({ transactions, monthlyIncome = 3200 }) => {
      // Aggregate by category
      const byCategory: Record<string, { total: number; count: number }> = {};
      for (const tx of transactions) {
        const cat = tx.category || 'other';
        if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
        byCategory[cat].total += tx.amount;
        byCategory[cat].count += 1;
      }

      const totalSpent = Object.values(byCategory).reduce((s, c) => s + c.total, 0);

      // Recommended budget allocation (50/30/20 rule)
      const needsBudget = monthlyIncome * 0.5;
      const wantsBudget = monthlyIncome * 0.3;
      const savingsBudget = monthlyIncome * 0.2;

      const insights: string[] = [];
      const categories = Object.entries(byCategory)
        .map(([cat, data]) => ({ category: cat, ...data, pctOfTotal: Math.round((data.total / totalSpent) * 100) }))
        .sort((a, b) => b.total - a.total);

      // Generate insights
      if (categories[0] && categories[0].pctOfTotal > 40) {
        insights.push(`⚠️ ${categories[0].category} is ${categories[0].pctOfTotal}% of your spending — consider setting a cap.`);
      }

      const foodDelivery = byCategory['food_delivery'] || byCategory['food delivery'];
      if (foodDelivery && foodDelivery.total > wantsBudget * 0.3) {
        insights.push(`🛵 Food delivery is RM${foodDelivery.total.toFixed(2)} — cooking 2 more meals/week could save ~RM${Math.round(foodDelivery.total * 0.3)}/month.`);
      }

      const shopping = byCategory['shopping'] || byCategory['electronics'];
      if (shopping && shopping.count >= 3) {
        insights.push(`🛍️ ${shopping.count} shopping trips — try a 48-hour wishlist delay before buying.`);
      }

      if (totalSpent > monthlyIncome * 0.8) {
        insights.push(`🔴 You're spending ${Math.round(totalSpent / monthlyIncome * 100)}% of income — savings rate is too low.`);
      }

      return {
        totalSpentRM: Math.round(totalSpent * 100) / 100,
        monthlyIncomeRM: monthlyIncome,
        spendRate: Math.round((totalSpent / monthlyIncome) * 100),
        categories,
        budgetGuideline: {
          needs: Math.round(needsBudget),
          wants: Math.round(wantsBudget),
          savings: Math.round(savingsBudget),
          rule: '50/30/20 — Needs / Wants / Savings',
        },
        insights: insights.length > 0 ? insights : ['Your spending looks balanced. Keep tracking!'],
        actionableTip: insights[0] || 'Review your subscriptions — small recurring charges add up.',
        xpEarned: 10,
      };
    },
  }),
};
