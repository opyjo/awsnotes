import type { CreateKeyConceptInput } from "@/types/key-concept";

interface ParsedResponse {
  topic: string;
  rule: string;
}

export function parseExamCoachResponse(markdown: string): ParsedResponse | null {
  const extract = (pattern: RegExp): string => {
    const match = markdown.match(pattern);
    return match?.[1]?.trim() ?? "";
  };

  // Topic: capture until the next field header (**Rule: or **The rule:)
  const topic = extract(/\*\*\s*(?:🏷️\s*)?Topic\s*:?\s*\*\*[:\s]*([\s\S]*?)(?=\*\*\s*(?:📏\s*)?(?:The\s+)?[Rr]ule\s*:?\s*\*\*|$)/i);
  // Rule: last field, capture everything to end of string
  const rule = extract(/\*\*\s*(?:📏\s*)?(?:The\s+)?[Rr]ule\s*:?\s*\*\*[:\s]*([\s\S]*?)$/i);

  if (!topic && !rule) {
    return null;
  }

  return {
    topic: topic || "Unknown topic",
    rule: rule || "Not parsed",
  };
}

export function toKeyConceptInput(
  parsed: ParsedResponse,
): CreateKeyConceptInput {
  return {
    topic: parsed.topic,
    rule: parsed.rule,
  };
}
