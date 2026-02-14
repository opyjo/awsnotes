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

  const prompt = `Given this AWS study note content, generate exactly ${flashcardCount} flashcards in Q&A format specifically tailored for the AWS Certified Solutions Architect - Associate (SAA-C03) exam.

Focus on:
- Key concepts, services, and design patterns frequently tested in SAA-C03
- Real exam scenarios and use cases
- Service comparisons (e.g., EFS vs EBS vs S3)
- Cost optimization and performance considerations
- Security and compliance best practices
- High availability and fault tolerance patterns

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
            "You are an expert AWS Solutions Architect Associate (SAA-C03) exam tutor. Generate concise, exam-focused flashcards from study notes that help students pass the SAA-C03 certification. Always return valid JSON only.",
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
