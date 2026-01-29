import { NextRequest } from "next/server";
import OpenAI from "openai";
import { streamChatCompletion as streamAnthropic } from "@/lib/anthropic";
import type { ModelProvider } from "@/types/chat";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const AWS_SYSTEM_PROMPT = `You are an expert AWS Cloud Architect exam tutor. Your goal is to help students pass their AWS certification exams by:

1. Explaining concepts in simple, easy-to-understand language
2. Using real-world analogies (e.g., "Think of a VPC like your own private office building...")
3. Highlighting exam tips and common pitfalls with "EXAM TIP:" callouts
4. Breaking down complex topics into digestible bullet points
5. Providing brief summaries at the end of longer explanations

Keep responses focused and exam-relevant. When appropriate, mention which AWS certification level (Practitioner, Associate, Professional) the concept is most relevant for.`;

const streamOpenAI = async function* (
  messages: Array<{ role: "user" | "assistant"; content: string }>
): AsyncGenerator<string, void, unknown> {
  if (!openai) {
    throw new Error("OpenAI API key is not configured");
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: AWS_SYSTEM_PROMPT,
      },
      ...messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    ],
    temperature: 0.7,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages, model }: { messages: Array<{ role: "user" | "assistant"; content: string }>; model: ModelProvider } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages is required and must be an array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!model || (model !== "openai" && model !== "anthropic")) {
      return new Response(
        JSON.stringify({ error: "model must be 'openai' or 'anthropic'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator =
            model === "openai"
              ? streamOpenAI(messages)
              : streamAnthropic(messages, AWS_SYSTEM_PROMPT);

          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to stream response";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to process chat request",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
