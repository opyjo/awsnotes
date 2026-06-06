import { NextRequest } from "next/server";
import OpenAI from "openai";
import { streamChatCompletion as streamAnthropic } from "@/lib/anthropic";
import { streamChatCompletion as streamMoonshot } from "@/lib/moonshot";
import { AVAILABLE_MODELS, type ModelId, type OpenAIModel, type AnthropicModel, type MoonshotModel } from "@/types/chat";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const EXAM_COACH_SYSTEM_PROMPT = `You are an expert AWS SAA-C03 exam coach. When given a practice question, analyze it and respond in EXACTLY this format with these 4 fields:

**Topic:** [The AWS service or domain area being tested, e.g. "S3 Storage Classes", "VPC Networking", "IAM Policies"]

**What it's testing:** [The specific knowledge or skill the question is evaluating. Be precise — e.g. "Whether you understand that S3 Intelligent-Tiering automatically moves objects between access tiers without retrieval fees"]

**Distractor pattern:** [Explain why the wrong answers look tempting. Identify the trick or common misconception the question exploits — e.g. "Option B uses S3 Glacier which sounds cost-effective but has retrieval delays that violate the requirement for immediate access"]

**The rule:** [State the key principle or rule to remember for the exam as a concise, memorable statement — e.g. "When a question says 'cost-effective' AND 'immediate access', S3 Intelligent-Tiering is almost always the answer over Glacier"]

Do NOT deviate from this format. Do NOT add extra sections. Always provide all 4 fields. Be concise but thorough in each field.`;

const isO1Model = (model: string) => model.startsWith("o1");

const streamOpenAI = async function* (
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  model: OpenAIModel,
  systemPrompt: string
): AsyncGenerator<string, void, unknown> {
  if (!openai) {
    throw new Error("OpenAI API key is not configured");
  }

  if (isO1Model(model)) {
    const modifiedMessages = messages.map((msg, index) => {
      if (index === 0 && msg.role === "user") {
        return {
          role: "user" as const,
          content: `${systemPrompt}\n\n${msg.content}`,
        };
      }
      return { role: msg.role as "user" | "assistant", content: msg.content };
    });

    const response = await openai.chat.completions.create({
      model,
      messages: modifiedMessages,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      yield content;
    }
    return;
  }

  const stream = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
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
    const { question, model }: { question: string; model: ModelId } = body;

    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ error: "question is required and must be a string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (question.length > 10000) {
      return new Response(
        JSON.stringify({ error: "question exceeds maximum allowed length" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const modelConfig = AVAILABLE_MODELS.find((m) => m.id === model);
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: "Invalid model selected" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      { role: "user", content: question },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let generator: AsyncGenerator<string, void, unknown>;
          if (modelConfig.provider === "openai") {
            generator = streamOpenAI(messages, model as OpenAIModel, EXAM_COACH_SYSTEM_PROMPT);
          } else if (modelConfig.provider === "moonshot") {
            generator = streamMoonshot(messages, EXAM_COACH_SYSTEM_PROMPT, model as MoonshotModel);
          } else {
            generator = streamAnthropic(messages, EXAM_COACH_SYSTEM_PROMPT, model as AnthropicModel);
          }

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
    console.error("Error in exam-coach API:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to process request",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
