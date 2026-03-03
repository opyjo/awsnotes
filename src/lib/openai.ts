import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OPENAI_API_KEY is not set. AI features will not work.");
}

const openai = apiKey
  ? new OpenAI({
      apiKey,
    })
  : null;

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!anthropicApiKey) {
  console.warn("ANTHROPIC_API_KEY is not set. Claude AI features will not work.");
}

const anthropic = anthropicApiKey
  ? new Anthropic({
      apiKey: anthropicApiKey,
    })
  : null;

export interface Flashcard {
  front: string;
  back: string;
}

export const generateFlashcards = async (
  noteContent: string,
  count: number = 5
): Promise<Flashcard[]> => {
  if (!anthropic) {
    throw new Error("Anthropic API key is not configured");
  }

  const flashcardCount = Math.max(1, Math.min(20, count));

  const prompt = `Given this AWS study note content, generate exactly ${flashcardCount} flashcards that mirror real AWS SAA-C03 exam questions.

QUESTION FORMAT RULES:
- Every question MUST be scenario-based (e.g., "A company needs to migrate a 50TB database with minimal downtime. Which AWS service and migration strategy should they use?")
- NEVER generate simple definition questions like "What is S3?" or "What does IAM stand for?"
- Questions should present a business scenario with specific constraints (cost, performance, availability, security, compliance) and ask which AWS service or architecture best fits

ANSWER FORMAT RULES:
- State the correct service/architecture choice first
- Explain WHY it's correct in 1-2 sentences
- Mention 1 common wrong answer and why it's wrong (exam trap)

COVER THESE SAA-C03 AREAS (when relevant to the note content):
- Service selection under constraints (cost optimization, performance, availability, security)
- Architecture trade-offs and comparisons (e.g., ALB vs NLB, RDS vs DynamoDB, EFS vs EBS)
- Well-Architected Framework pillars applied to real scenarios
- Common exam traps and misconceptions (e.g., S3 eventual consistency exceptions, encryption defaults)
- Edge cases: service limits, regional availability, default behaviors

Return ONLY a valid JSON array with this exact format:
[
  { "front": "scenario-based question", "back": "correct answer with reasoning and common trap" },
  { "front": "scenario-based question", "back": "correct answer with reasoning and common trap" }
]

Note content:
${noteContent.substring(0, 3000)}`;

  try {
    const maxTokens = Math.max(1000, flashcardCount * 300);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system: "You are an expert AWS Solutions Architect Associate (SAA-C03) exam coach. Generate flashcards that mirror the real exam format: scenario-based questions that test architectural decision-making, service selection under specific constraints, and understanding of AWS best practices. Never generate simple definition-style questions. Always return valid JSON only.",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = message.content[0];
    if (content.type !== "text" || !content.text) {
      throw new Error("No response from Claude");
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Claude");
    }

    const flashcards = JSON.parse(jsonMatch[0]) as Flashcard[];
    return flashcards;
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error(
      `Failed to generate flashcards: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

export const explainConcept = async (
  concept: string,
  context?: string
): Promise<string> => {
  if (!openai) {
    throw new Error("OpenAI API key is not configured");
  }

  const prompt = context
    ? `Explain this AWS concept: "${concept}"

Context from notes:
${context.substring(0, 1000)}

Provide a clear, concise explanation specifically for the AWS Certified Solutions Architect - Associate (SAA-C03) exam. Include:
- How this concept appears in exam questions
- Key points to remember for the exam
- Common misconceptions or traps
- Practical use cases tested in SAA-C03`
    : `Explain this AWS concept: "${concept}"

Provide a clear, concise explanation specifically for the AWS Certified Solutions Architect - Associate (SAA-C03) exam. Include:
- How this concept appears in exam questions
- Key points to remember for the exam
- Common misconceptions or traps
- Practical use cases tested in SAA-C03`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert AWS Solutions Architect Associate (SAA-C03) exam tutor. Provide clear, concise explanations of AWS concepts specifically focused on helping students pass the SAA-C03 certification exam.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const explanation = completion.choices[0]?.message?.content;
    if (!explanation) {
      throw new Error("No response from OpenAI");
    }

    return explanation;
  } catch (error) {
    console.error("Error explaining concept:", error);
    throw new Error(
      `Failed to explain concept: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

export const summarizeNote = async (noteContent: string): Promise<string> => {
  if (!openai) {
    throw new Error("OpenAI API key is not configured");
  }

  const prompt = `Summarize this AWS study note into concise bullet points specifically for AWS Certified Solutions Architect - Associate (SAA-C03) exam preparation.

Focus on:
- Key concepts most likely to appear in SAA-C03 exam questions
- Important service features and use cases
- Design patterns and best practices for the exam
- Cost optimization and performance considerations
- Security and compliance requirements

Keep it brief, actionable, and exam-focused.

Note content:
${noteContent.substring(0, 3000)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert AWS Solutions Architect Associate (SAA-C03) exam tutor. Create concise, exam-focused summaries of study notes that highlight the most important information for passing the SAA-C03 certification.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = completion.choices[0]?.message?.content;
    if (!summary) {
      throw new Error("No response from OpenAI");
    }

    return summary;
  } catch (error) {
    console.error("Error summarizing note:", error);
    throw new Error(
      `Failed to summarize note: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
