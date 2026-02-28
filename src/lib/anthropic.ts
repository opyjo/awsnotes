import Anthropic from "@anthropic-ai/sdk";
import type { AnthropicModel } from "@/types/chat";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn("ANTHROPIC_API_KEY is not set. Anthropic features will not work.");
}

const anthropic = apiKey
  ? new Anthropic({
      apiKey,
    })
  : null;

export const streamChatCompletion = async function* (
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt: string,
  model: AnthropicModel = "claude-sonnet-4-6"
): AsyncGenerator<string, void, unknown> {
  if (!anthropic) {
    throw new Error("Anthropic API key is not configured");
  }

  const stream = await anthropic.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      yield chunk.delta.text;
    }
  }
};
