import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OPENAI_API_KEY is not set. AI features will not work.");
}

const openai = apiKey
  ? new OpenAI({
      apiKey,
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
  if (!openai) {
    throw new Error("OpenAI API key is not configured");
  }

  // Validate count
  const flashcardCount = Math.max(1, Math.min(20, count)); // Clamp between 1 and 20

  const prompt = `Given this AWS study note content, generate exactly ${flashcardCount} flashcards in Q&A format.
Focus on key concepts, services, and exam-relevant details.
Return ONLY a valid JSON array with this exact format:
[
  { "front": "question", "back": "answer" },
  { "front": "question", "back": "answer" }
]

Note content:
${noteContent.substring(0, 3000)}`;

  try {
    // Adjust max_tokens based on count (roughly 300 tokens per flashcard)
    const maxTokens = Math.min(4000, Math.max(1000, flashcardCount * 300));

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert AWS certification tutor. Generate concise, exam-focused flashcards from study notes. Always return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Extract JSON from response (handle cases where there might be markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from OpenAI");
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

Provide a clear, concise explanation suitable for AWS certification exam preparation.`
    : `Explain this AWS concept: "${concept}"

Provide a clear, concise explanation suitable for AWS certification exam preparation.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert AWS certification tutor. Provide clear, concise explanations of AWS concepts.",
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

  const prompt = `Summarize this AWS study note into concise bullet points.
Focus on key concepts, services, and exam-relevant information.
Keep it brief and actionable.

Note content:
${noteContent.substring(0, 3000)}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert AWS certification tutor. Create concise summaries of study notes.",
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
