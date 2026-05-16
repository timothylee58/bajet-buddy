import { z } from 'zod';
import { tool } from 'ai';

export const systemPrompt = `
You are the "Game Master" and Referee of BajetBuddy, a gamified financial app.
Your goal is to monitor user behavior, enforce rules, and make personal finance feel like an interactive game.

You have 5 specialized roles you can activate via tools:
1. Profile & Balance Agent: Assigns persona classes based on spending (e.g., Mamak Bro, Midnight Shopee Queen).
2. Finance Planner Agent: Intervenes in FOMO moments with a 3-way trade-off.
3. Conversational Tabung Builder: Helps users set savings goals with custom rules.
4. Receipt Scanner Agent: Extracts data from receipts to trigger rewards.
5. Macro-Market Sentinel: Maps global/local economic news to the user's personal finances.

Always respond in a helpful, slightly playful, gamified tone. Use local Malaysian slang (Mamak, RM, PMX, Shopee) where appropriate as per the user's context.
`;

export const tools = {
  assignProfile: tool({
    description: 'Analyzes transaction history and assigns or updates the user\'s character persona class.',
    parameters: z.object({
      transactions: z.array(z.string()).describe('List of recent transaction descriptions'),
      currentClass: z.string().optional().describe('The user\'s current persona class'),
    }),
    execute: async ({ transactions, currentClass }: { transactions: string[], currentClass?: string }) => {
      // Mock logic for demo
      const isMidnightShopper = transactions.some(t => t.toLowerCase().includes('shopee') || t.toLowerCase().includes('lazada'));
      if (isMidnightShopper) {
        return {
          newClass: 'Midnight Shopee Queen',
          level: 2,
          message: "That's your third Shopee order this week. Profile updated to Midnight Shopee Queen [Level 2].",
          xpBonus: 50
        };
      }
      return { newClass: currentClass || 'Mamak Bro', level: 1, message: "Keep it up, Mamak Bro!" };
    },
  }),
  negotiateFOMO: tool({
    description: 'Intervenes when a user is tempted to make an impulse purchase.',
    parameters: z.object({
      item: z.string().describe('The item the user wants to buy'),
      price: z.number().describe('The price of the item in RM'),
      isBNPL: z.boolean().describe('Whether the user is considering Buy Now Pay Later'),
    }),
    execute: async ({ item, price, isBNPL }: { item: string, price: number, isBNPL: boolean }) => {
      const bnplWarning = isBNPL ? " Using BNPL might feel easy now, but it hides the psychological cost." : "";
      return {
        analysis: `I see you're eyeing that ${item} for RM${price}.${bnplWarning} The discount feels good, but let's look at the trade-offs.`,
        options: [
          {
            label: 'Option A (Buy with Cash)',
            effect: 'Burns 1 Overspent Card and triggers Tax Mode (10% penalty to savings).',
          },
          {
            label: 'Option B (Use BNPL)',
            effect: 'Character demotion to "Gaji Habis Speedrunner" and halves daily XP multiplier.',
          },
          {
            label: 'Option C (Walk Away)',
            effect: '48-Hour Cooldown. Rewards: +200 Discipline XP and "FOMO Slayer" badge.',
          }
        ]
      };
    },
  }),
  buildTabung: tool({
    description: 'Creates a custom savings goal (Tabung) from a natural language request.',
    parameters: z.object({
      goal: z.string().describe('What the user wants to save for'),
      targetAmount: z.number().optional().describe('The target amount in RM'),
      durationMonths: z.number().optional().describe('Desired timeframe in months'),
    }),
    execute: async ({ goal, targetAmount, durationMonths }: { goal: string, targetAmount?: number, durationMonths?: number }) => {
      const name = `${goal.charAt(0).toUpperCase() + goal.slice(1)} Tech Tabung`;
      return {
        tabungName: name,
        target: targetAmount || 500,
        rule: `To hit this in ${durationMonths || 1} month(s), your daily XP multiplier doubles if you don't spend money past 10 PM.`,
        message: `Goal locked in: ${name}! Let's get that bread (or keyboard).`
      };
    },
  }),
  scanReceipt: tool({
    description: 'Extracts data from a receipt and calculates rewards.',
    parameters: z.object({
      storeName: z.string(),
      totalAmount: z.number(),
      category: z.string(),
    }),
    execute: async ({ storeName, totalAmount, category }: { storeName: string, totalAmount: number, category: string }) => {
      return {
        extracted: { storeName, totalAmount, category },
        reward: totalAmount < 50 ? '+50 XP' : '+10 XP',
        milestone: totalAmount < 50 ? 'Budget Warrior streak milestone!' : 'Transaction logged.'
      };
    },
  }),
  triggerMarketAlert: tool({
    description: 'Generates a localized inflation warning and survival quest.',
    parameters: z.object({
      newsEvent: z.string().describe('The macroeconomic news event'),
      impactCategory: z.string().describe('The category of spending impacted (e.g., groceries, fuel)'),
    }),
    execute: async ({ newsEvent, impactCategory }: { newsEvent: string, impactCategory: string }) => {
      return {
        title: "Quest Triggered: 'Inflasi Warrior'",
        warning: `Heads up! ${newsEvent}. This will likely hit your ${impactCategory} budget.`,
        quest: `Keep your ${impactCategory} bill under RM150 this week despite the hike to earn +300 XP and a 'Harga Tetap' Badge!`,
        personalizedNote: "Based on your past monthly grocery runs, your usual basket is going to cost you roughly +RM18 more."
      };
    },
  }),
};
