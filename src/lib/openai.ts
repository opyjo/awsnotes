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
