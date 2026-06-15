import { NextRequest } from "next/server";
import { streamChatCompletion as streamAnthropic } from "@/lib/anthropic";
import { streamChatCompletion as streamMoonshot } from "@/lib/moonshot";
import { AVAILABLE_MODELS, type ModelId, type AnthropicModel, type MoonshotModel } from "@/types/chat";

const EXAM_COACH_SYSTEM_PROMPT = `You are an expert AWS SAA-C03 exam coach. When given a practice question, analyze it and respond in EXACTLY this format with these 2 fields:

**Topic:** [The AWS service or domain area being tested, e.g. "S3 Storage Classes", "VPC Networking", "IAM Policies"]

**Rule:** [A practical 1-2 sentence exam tip. Mention the key clue words from the question and the correct service/answer. Example: "'Cost-effective' + 'immediate access' → S3 Intelligent-Tiering, not Glacier (Glacier has retrieval delays)."]

Do NOT deviate from this format. Do NOT add extra sections. Always provide both fields. Keep the Rule short — like a flashcard, not a paragraph.`;

const EXAM_COACH_FOLLOWUP_PROMPT = `You are an expert AWS SAA-C03 exam coach. You are continuing a conversation about an AWS exam question that you previously analyzed. Answer the follow-up question helpfully and concisely. Stay focused on the exam context and help the student understand the concept better.`;

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
    const { question, messages: bodyMessages, model }: {
      question?: string;
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      model: ModelId;
    } = body;

    // Support both single question (backward compat) and multi-turn messages
    const isFollowUp = Array.isArray(bodyMessages) && bodyMessages.length > 0;

    if (!isFollowUp && (!question || typeof question !== "string")) {
      return new Response(
        JSON.stringify({ error: "question or messages is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (question && question.length > 10000) {
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

    const messages: Array<{ role: "user" | "assistant"; content: string }> = isFollowUp
      ? bodyMessages!
      : [{ role: "user", content: question! }];

    const systemPrompt = isFollowUp ? EXAM_COACH_FOLLOWUP_PROMPT : EXAM_COACH_SYSTEM_PROMPT;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let generator: AsyncGenerator<string, void, unknown>;
          if (modelConfig.provider === "moonshot") {
            generator = streamMoonshot(messages, systemPrompt, model as MoonshotModel);
          } else {
            generator = streamAnthropic(messages, systemPrompt, model as AnthropicModel);
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
