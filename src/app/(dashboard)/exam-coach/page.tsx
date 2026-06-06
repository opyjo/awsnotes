"use client";

import { useState, useRef, useCallback } from "react";
import { getAuthToken } from "@/lib/aws/cognito";
import {
  AVAILABLE_MODELS,
  DEFAULT_CHAT_MODEL,
  type ModelId,
} from "@/types/chat";
import { markdownToHtml } from "@/lib/markdown-to-html";
import { parseExamCoachResponse, toKeyConceptInput } from "@/lib/parse-exam-coach-response";
import { useKeyConcepts } from "@/hooks/api/useKeyConcepts";

export default function ExamCoachPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_CHAT_MODEL);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { createConcept, isCreating } = useKeyConcepts();

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse("");
    setIsSaved(false);
    setSaveError(null);

    abortControllerRef.current = new AbortController();

    try {
      const token = await getAuthToken();
      const res = await fetch("/api/ai/exam-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          question: question.trim(),
          model: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to analyze question");
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                setResponse((prev) => prev + parsed.content);
              }
            } catch (e) {
              if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                throw e;
              }
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to analyze question");
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [question, selectedModel, isLoading]);

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQuestion("");
    setResponse("");
    setError(null);
    setIsLoading(false);
    setIsSaved(false);
    setSaveError(null);
  };

  const handleSaveConcept = useCallback(async () => {
    if (!response || isSaved || isCreating) return;
    setSaveError(null);

    const parsed = parseExamCoachResponse(response);
    if (!parsed) {
      setSaveError("Could not parse the response. Try a different question format.");
      return;
    }

    try {
      const input = toKeyConceptInput(parsed, question.trim() || undefined);
      await createConcept(input);
      setIsSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save concept");
    }
  }, [response, question, isSaved, isCreating, createConcept]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Exam Coach
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste an AWS SAA-C03 practice question and get a structured breakdown
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm p-4 space-y-4">
        <div>
          <label htmlFor="model-select" className="block text-sm font-medium text-muted-foreground mb-1.5">
            Model
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelId)}
            disabled={isLoading}
            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="question-input" className="block text-sm font-medium text-muted-foreground mb-1.5">
            Practice Question
          </label>
          <textarea
            id="question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            placeholder="Paste your AWS SAA-C03 practice question here..."
            rows={8}
            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Analyzing..." : "Analyze Question"}
          </button>
          {(response || question) && (
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-lg border border-border/50 text-sm font-medium text-muted-foreground hover:bg-accent/50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {(response || isLoading) && (
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm p-6">
          {response ? (
            <>
              <div
                className="text-foreground text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:font-semibold [&_p]:my-2 [&_p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(response) }}
              />
              {!isLoading && (
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
                  <button
                    onClick={handleSaveConcept}
                    disabled={isSaved || isCreating}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSaved
                        ? "bg-green-500/10 text-green-600 border border-green-500/30 cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                  >
                    {isCreating ? "Saving..." : isSaved ? "Saved!" : "Save Key Concept"}
                  </button>
                  {isSaved && (
                    <a
                      href="/key-concepts"
                      className="text-sm text-primary hover:underline"
                    >
                      View saved concepts
                    </a>
                  )}
                  {saveError && (
                    <span className="text-sm text-destructive">{saveError}</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Analyzing question...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
