'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function TestAgentsPage() {
  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: '/api/agents',
  });

  const [simulationLoading, setSimulationLoading] = useState(false);

  const simulateMidnightShopee = async () => {
    setSimulationLoading(true);
    await append({
      role: 'user',
      content: 'I just bought something on Shopee at 1 AM. Can you check my profile?',
    });
    setSimulationLoading(false);
  };

  const simulateMarketShift = async () => {
    setSimulationLoading(true);
    await append({
      role: 'user',
      content: 'Did you hear the news about egg prices and fuel subsidies?',
    });
    setSimulationLoading(false);
  };

  const simulateTabungRequest = async () => {
    setSimulationLoading(true);
    await append({
      role: 'user',
      content: 'I want to save up RM400 for a new mechanical keyboard.',
    });
    setSimulationLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">BajetBuddy Agent Playground</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Test the &quot;Game Master&quot; AI agents and simulations.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Simulation Controls */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Simulations</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={simulateMidnightShopee}
                disabled={isLoading || simulationLoading}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                🌙 Midnight Shopee Event
              </button>
              <button
                onClick={simulateMarketShift}
                disabled={isLoading || simulationLoading}
                className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                🚨 Market/Inflation Alert
              </button>
              <button
                onClick={simulateTabungRequest}
                disabled={isLoading || simulationLoading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                ⌨️ New Tabung Request
              </button>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm space-y-2">
              <p className="font-medium">Active Roles:</p>
              <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>Profile Assigner</li>
                <li>Finance Planner</li>
                <li>Tabung Builder</li>
                <li>Receipt Scanner</li>
                <li>Market Sentinel</li>
              </ul>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="md:col-span-2 flex flex-col h-[600px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-2xl">🤖</div>
                  <p>The Game Master is waiting for your move.</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    m.role === 'user' 
                      ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    {m.toolInvocations?.map((toolInvocation: any) => {
                      const { toolName, toolCallId, state } = toolInvocation;

                      if (state === 'result') {
                        const { result } = toolInvocation;
                        return (
                          <div key={toolCallId} className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10 text-xs font-mono">
                            <div className="font-bold opacity-50 mb-1">{toolName} Result:</div>
                            <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                          </div>
                        );
                      } else {
                        return (
                          <div key={toolCallId} className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded italic text-xs">
                            Running {toolName}...
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <input
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-all text-sm"
                value={input}
                placeholder="Talk to the Game Master..."
                onChange={handleInputChange}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
