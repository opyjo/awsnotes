import type { CreateKeyConceptInput } from "@/types/key-concept";

interface ParsedResponse {
  topic: string;
  whatItsTesting: string;
  distractorPattern: string;
  theRule: string;
}

export function parseExamCoachResponse(markdown: string): ParsedResponse | null {
  const extract = (pattern: RegExp): string => {
    const match = markdown.match(pattern);
    return match?.[1]?.trim() ?? "";
  };

  // Match bold-prefixed fields: **Topic:** ... (up to next ** or end)
  const topic = extract(/\*\*\s*(?:🏷️\s*)?Topic\s*:?\s*\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
  const whatItsTesting = extract(/\*\*\s*(?:🎯\s*)?What\s+it(?:'|')s\s+testing\s*:?\s*\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
  const distractorPattern = extract(/\*\*\s*(?:🚫\s*)?Distractor\s+pattern\s*:?\s*\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
  const theRule = extract(/\*\*\s*(?:📏\s*)?The\s+rule\s*:?\s*\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);

  if (!topic && !whatItsTesting && !distractorPattern && !theRule) {
    return null;
  }

  return {
    topic: topic || "Unknown topic",
    whatItsTesting: whatItsTesting || "Not parsed",
    distractorPattern: distractorPattern || "Not parsed",
    theRule: theRule || "Not parsed",
  };
}

export function toKeyConceptInput(
  parsed: ParsedResponse,
  sourceQuestion?: string,
): CreateKeyConceptInput {
  return {
    topic: parsed.topic,
    whatItsTesting: parsed.whatItsTesting,
    distractorPattern: parsed.distractorPattern,
    theRule: parsed.theRule,
    sourceQuestion,
  };
}
