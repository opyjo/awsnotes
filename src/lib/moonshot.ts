import OpenAI from "openai";
import type { MoonshotModel } from "@/types/chat";

const apiKey = process.env.MOONSHOT_API_KEY;

if (!apiKey) {
  console.warn("MOONSHOT_API_KEY is not set. Kimi K2 features will not work.");
}

const moonshot = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: "https://api.moonshot.ai/v1",
    })
  : null;

export const streamChatCompletion = async function* (
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt: string,
  model: MoonshotModel = "kimi-k2-thinking-turbo"
): AsyncGenerator<string, void, unknown> {
  if (!moonshot) {
    throw new Error("Moonshot API key is not configured");
  }

  const stream = await moonshot.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ],
    temperature: 0.6,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
};
