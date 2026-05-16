import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { systemPrompt, tools } from '@/lib/agents/game-master';

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY) {
    return new Response('DeepSeek/OpenAI API key is missing. Please add DEEPSEEK_API_KEY to your .env.local file.', { status: 500 });
  }

  const { messages } = await req.json();

  const result = await streamText({
    model: deepseek('deepseek-chat'),
    messages,
    system: systemPrompt,
    tools: tools,
  });

  return result.toDataStreamResponse();
}
