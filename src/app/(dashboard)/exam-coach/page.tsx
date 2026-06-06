"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getAuthToken } from "@/lib/aws/cognito";
import {
  AVAILABLE_MODELS,
  DEFAULT_CHAT_MODEL,
  type ModelId,
} from "@/types/chat";
import { markdownToHtml } from "@/lib/markdown-to-html";
import { parseExamCoachResponse, toKeyConceptInput } from "@/lib/parse-exam-coach-response";
import { useKeyConcepts } from "@/hooks/api/useKeyConcepts";
import type { KeyConceptNote } from "@/types/key-concept";

interface FollowUpMessage {
  role: "user" | "assistant";
  content: string;
  savedToNotes?: boolean;
}

const STORAGE_KEY = "exam-coach-state";

interface ExamCoachState {
  question: string;
  response: string;
  selectedModel: ModelId;
  followUpMessages: FollowUpMessage[];
  isSaved: boolean;
  savedConceptId: string | null;
  savedNotes: KeyConceptNote[];
}

const loadFromStorage = (): ExamCoachState | null => {
  if (typeof globalThis.window === "undefined") return null;
  try {
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ExamCoachState;
    }
  } catch {
    console.error("Error loading exam coach state from storage");
  }
  return null;
};

const saveToStorage = (state: ExamCoachState) => {
  if (typeof globalThis.window === "undefined") return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error("Error saving exam coach state to storage");
  }
};

const clearStorage = () => {
  if (typeof globalThis.window === "undefined") return;
  globalThis.localStorage.removeItem(STORAGE_KEY);
};

export default function ExamCoachPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_CHAT_MODEL);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedConceptId, setSavedConceptId] = useState<string | null>(null);
  const [savedNotes, setSavedNotes] = useState<KeyConceptNote[]>([]);

  // Follow-up chat state
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const followUpEndRef = useRef<HTMLDivElement | null>(null);
  const { createConcept, updateConcept, isCreating } = useKeyConcepts();

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setQuestion(stored.question);
      setResponse(stored.response);
      setSelectedModel(stored.selectedModel);
      setFollowUpMessages(stored.followUpMessages);
      setIsSaved(stored.isSaved);
      setSavedConceptId(stored.savedConceptId);
      setSavedNotes(stored.savedNotes);
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (question || response) {
      saveToStorage({
        question,
        response,
        selectedModel,
        followUpMessages,
        isSaved,
        savedConceptId,
        savedNotes,
      });
    }
  }, [question, response, selectedModel, followUpMessages, isSaved, savedConceptId, savedNotes]);

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse("");
    setIsSaved(false);
    setSaveError(null);
    setSavedConceptId(null);
    setSavedNotes([]);
    setFollowUpMessages([]);
    setFollowUpInput("");

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
    setSavedConceptId(null);
    setSavedNotes([]);
    setFollowUpMessages([]);
    setFollowUpInput("");
    setIsFollowUpLoading(false);
    clearStorage();
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
      const created = await createConcept(input);
      setIsSaved(true);
      setSavedConceptId(created.conceptId);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save concept");
    }
  }, [response, question, isSaved, isCreating, createConcept]);

  const handleFollowUpSubmit = useCallback(async () => {
    if (!followUpInput.trim() || isFollowUpLoading) return;

    const userMessage = followUpInput.trim();
    setFollowUpInput("");
    setIsFollowUpLoading(true);

    const newUserMsg: FollowUpMessage = { role: "user", content: userMessage };
    setFollowUpMessages((prev) => [...prev, newUserMsg]);

    // Build the full messages array for context
    const allMessages: Array<{ role: "user" | "assistant"; content: string }> = [
      { role: "user", content: question.trim() },
      { role: "assistant", content: response },
      ...followUpMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage },
    ];

    // Add a placeholder for the assistant response
    const assistantIndex = followUpMessages.length + 1; // +1 for the user message we just added
    setFollowUpMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
          messages: allMessages,
          model: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to get follow-up response");
      }

      if (!res.body) throw new Error("No response body");

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
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) {
                setFollowUpMessages((prev) => {
                  const updated = [...prev];
                  const idx = assistantIndex;
                  if (updated[idx]) {
                    updated[idx] = { ...updated[idx], content: updated[idx].content + parsed.content };
                  }
                  return updated;
                });
              }
            } catch (e) {
              if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                throw e;
              }
            }
          }
        }
      }

      // Scroll to bottom
      setTimeout(() => followUpEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // Remove the empty assistant message on error
      setFollowUpMessages((prev) => prev.filter((_, i) => i !== assistantIndex));
      setError(err instanceof Error ? err.message : "Failed to get follow-up response");
    } finally {
      setIsFollowUpLoading(false);
      abortControllerRef.current = null;
    }
  }, [followUpInput, isFollowUpLoading, question, response, followUpMessages, selectedModel]);

  const handleSaveNote = useCallback(async (messageIndex: number) => {
    if (!savedConceptId) return;

    // The messageIndex is for the assistant message; the user question is the previous message
    const assistantMsg = followUpMessages[messageIndex];
    const userMsg = followUpMessages[messageIndex - 1];
    if (!assistantMsg || !userMsg || assistantMsg.role !== "assistant" || userMsg.role !== "user") return;

    const newNote: KeyConceptNote = {
      question: userMsg.content,
      answer: assistantMsg.content,
      savedAt: new Date().toISOString(),
    };

    const updatedNotes = [...savedNotes, newNote];

    try {
      await updateConcept(savedConceptId, { notes: JSON.stringify(updatedNotes) });
      setSavedNotes(updatedNotes);
      setFollowUpMessages((prev) => {
        const updated = [...prev];
        updated[messageIndex] = { ...updated[messageIndex], savedToNotes: true };
        return updated;
      });
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  }, [savedConceptId, followUpMessages, savedNotes, updateConcept]);

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

      {/* Follow-up chat section */}
      {response && !isLoading && (
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30">
            <h3 className="text-sm font-medium text-foreground">Follow-up Questions</h3>
          </div>

          {followUpMessages.length > 0 && (
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {followUpMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <>
                        <div
                          className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:font-semibold [&_p]:my-1 [&_p]:leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content || "...") }}
                        />
                        {msg.content && !isFollowUpLoading && isSaved && savedConceptId && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <button
                              onClick={() => handleSaveNote(idx)}
                              disabled={msg.savedToNotes}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                msg.savedToNotes
                                  ? "text-green-600 bg-green-500/10 cursor-default"
                                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                              }`}
                            >
                              {msg.savedToNotes ? "Saved to concept" : "Save to concept"}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={followUpEndRef} />
            </div>
          )}

          <div className="p-4 border-t border-border/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFollowUpSubmit();
                  }
                }}
                disabled={isFollowUpLoading}
                placeholder="Ask a follow-up question..."
                className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 placeholder:text-muted-foreground/50"
              />
              <button
                onClick={handleFollowUpSubmit}
                disabled={isFollowUpLoading || !followUpInput.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isFollowUpLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
