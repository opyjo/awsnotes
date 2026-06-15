"use client";

import { useState } from "react";
import Link from "next/link";
import { useKeyConcepts } from "@/hooks/api/useKeyConcepts";
import { markdownToHtml } from "@/lib/markdown-to-html";
import type { KeyConceptNote } from "@/types/key-concept";

export default function KeyConceptsPage() {
  const { concepts, isLoading, isError, error, deleteConcept, isDeleting } =
    useKeyConcepts();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleDelete = async (conceptId: string) => {
    if (!confirm("Delete this key concept?")) return;
    setDeletingId(conceptId);
    try {
      await deleteConcept(conceptId);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (conceptId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(conceptId)) {
        next.delete(conceptId);
      } else {
        next.add(conceptId);
      }
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Key Concepts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review concepts saved from Exam Coach analysis
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card/80 p-6 animate-pulse"
            >
              <div className="h-5 bg-muted rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error || "Failed to load key concepts"}
        </div>
      )}

      {!isLoading && !isError && concepts.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No key concepts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use the Exam Coach to analyze practice questions and save the key concepts here.
          </p>
          <Link
            href="/exam-coach"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Go to Exam Coach
          </Link>
        </div>
      )}

      {!isLoading && concepts.length > 0 && (
        <div className="space-y-3">
          {concepts.map((concept) => {
            const isExpanded = expandedIds.has(concept.conceptId);
            return (
              <div
                key={concept.conceptId}
                className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden"
              >
                <div
                  className="flex items-center justify-between gap-4 p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(concept.conceptId)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg
                      className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {concept.topic}
                    </h3>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(concept.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(concept.conceptId);
                    }}
                    disabled={isDeleting && deletingId === concept.conceptId}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Delete concept"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div
                  className="grid transition-all duration-200 ease-in-out"
                  style={{
                    gridTemplateRows: isExpanded ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1 border-t border-border/30">
                      <div className="grid gap-3 text-sm">
                        <p className="text-foreground leading-relaxed">{concept.rule}</p>
                        {(() => {
                          let parsedNotes: KeyConceptNote[] = [];
                          try {
                            if (concept.notes) {
                              parsedNotes = typeof concept.notes === "string"
                                ? JSON.parse(concept.notes as string)
                                : concept.notes;
                            }
                          } catch { /* ignore parse errors */ }
                          return parsedNotes.length > 0 ? (
                            <div className="mt-2 pt-3 border-t border-border/30">
                              <span className="font-medium text-muted-foreground">
                                Follow-up Notes:
                              </span>
                              <div className="mt-2 space-y-3">
                                {parsedNotes.map((note, i) => (
                                  <div key={i} className="pl-3 border-l-2 border-primary/20">
                                    <p className="text-muted-foreground">
                                      <span className="font-medium">Q:</span>{" "}
                                      <span className="text-foreground">{note.question}</span>
                                    </p>
                                    <div className="mt-1 text-muted-foreground">
                                      <span className="font-medium">A:</span>{" "}
                                      <div
                                        className="mt-1 text-foreground text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:font-semibold [&_p]:my-1 [&_p]:leading-relaxed [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:border [&_th]:border-border/50 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted/50 [&_th]:text-left [&_td]:border [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1"
                                        dangerouslySetInnerHTML={{ __html: markdownToHtml(note.answer) }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
