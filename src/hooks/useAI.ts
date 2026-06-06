"use client";

import { useState } from "react";
import { getAuthToken } from "@/lib/aws/cognito";

interface UseAIResult {
  explainConcept: (concept: string, context?: string) => Promise<string>;
  summarizeNote: (noteContent: string) => Promise<string>;
  loading: boolean;
  error: string | null;
}

export const useAI = (): UseAIResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explainConcept = async (
    concept: string,
    context?: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ concept, context }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to explain concept");
      }

      const data = await response.json();
      return data.explanation || "";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to explain concept";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const summarizeNote = async (noteContent: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ noteContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to summarize note");
      }

      const data = await response.json();
      return data.summary || "";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to summarize note";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    explainConcept,
    summarizeNote,
    loading,
    error,
  };
};
