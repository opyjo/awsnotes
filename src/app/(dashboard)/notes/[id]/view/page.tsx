"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { NotesProvider, useNotes } from "@/context/NotesContext";
import { GroupsProvider, useGroups } from "@/context/GroupsContext";
import { FlashcardsProvider } from "@/context/FlashcardsContext";
import { AIFlashcardGenerator } from "@/components/flashcards/AIFlashcardGenerator";
import { AIExplainPanel } from "@/components/notes/AIExplainPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { noteProseClasses } from "@/components/notes/noteProseClasses";

const ViewNoteContent = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;
  const { getNote, deleteNote } = useNotes();
  const { getGroupByName } = useGroups();
  const [note, setNote] = useState<Awaited<ReturnType<typeof getNote>> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [flashcardGeneratorOpen, setFlashcardGeneratorOpen] = useState(false);
  const [explainPanelOpen, setExplainPanelOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [flashcardSeed, setFlashcardSeed] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const sanitizedContent = useMemo(() => {
    if (!note?.content) return "";
    return DOMPurify.sanitize(note.content, {
      USE_PROFILES: { html: true },
    });
  }, [note?.content]);

  useEffect(() => {
    const loadNote = async () => {
      const fetchedNote = await getNote(noteId);
      setNote(fetchedNote);
      setLoading(false);
    };
    loadNote();
  }, [noteId, getNote]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(noteId);
      router.push("/notes");
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      setSelectionPosition(null);
      return;
    }

    const contentEl = contentRef.current;
    if (!contentEl || !selection.anchorNode || !contentEl.contains(selection.anchorNode)) {
      setSelectionPosition(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectedText(selection.toString().trim());
    setSelectionPosition({
      x: rect.left + rect.width / 2,
      y: Math.max(8, rect.top - 10),
    });
  };

  const group = note?.category ? getGroupByName(note.category) : undefined;

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setSelectionPosition(null);
      }
    };

    const handleScroll = () => {
      setSelectionPosition(null);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center space-y-4">
          <svg
            className="animate-spin h-8 w-8 mx-auto text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-muted-foreground">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center space-y-4">
          <svg
            className="w-16 h-16 mx-auto text-muted-foreground/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-xl font-semibold">Note not found</h2>
          <p className="text-muted-foreground">
            This note may have been deleted or doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push("/notes")}>Back to Notes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6 lg:gap-8">
        <div className="min-w-0">
          {/* Header */}
          <div
            className={cn(
              "sticky top-0 z-50 mb-6",
              "bg-background/95 backdrop-blur-lg backdrop-saturate-150",
              "border border-border/60 rounded-lg",
              "shadow-lg shadow-black/5 dark:shadow-black/20",
              "px-5 py-4"
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="h-8 w-8 shrink-0"
                  aria-label="Go back"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </Button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link href="/notes" className="hover:text-foreground">
                      Notes
                    </Link>
                    <span>/</span>
                    <span>View</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="p-1.5 rounded-lg bg-muted/60 border border-border/50 shadow-sm">
                      <svg
                        className="w-4 h-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      View Note
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFlashcardSeed(null);
                    setFlashcardGeneratorOpen(true);
                  }}
                  className="text-sm"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Flashcards
                </Button>
                <Link href={`/notes/${noteId}`}>
                  <Button variant="secondary" size="sm" className="text-sm">
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                </Button>
              </div>
            </div>
          </div>

          {/* Note Content */}
          <article className="animate-fade-in">
            {/* Title and Meta */}
            <header className="mb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl md:text-2xl font-semibold leading-snug text-foreground">
                  {note.title}
                </h1>
                {group && (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                    style={{
                      borderColor: group.color || "hsl(var(--border))",
                      color: group.color || "hsl(var(--foreground))",
                      backgroundColor: group.color ? `${group.color}1A` : "hsl(var(--muted))",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: group.color || "hsl(var(--muted))" }}
                    />
                    {group.name}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {note.category && !group && (
                  <span className="flex items-center gap-1.5">
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
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    {note.category}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Created {format(new Date(note.createdAt), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1.5">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Updated {format(new Date(note.updatedAt), "MMM d, yyyy")}
                </span>
              </div>

            </header>

            {/* Content */}
            <div
              ref={contentRef}
              className={cn(noteProseClasses, "rounded-lg border border-border/60 bg-background/40 px-4 py-3")}
              onMouseUp={handleTextSelection}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* Tip for AI Explain */}
            <div className="mt-6 p-3 rounded-md bg-muted/40 border border-border/40">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-primary/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  <strong className="font-medium">Tip:</strong> Select any text to get an AI explanation
                </span>
              </p>
            </div>
          </article>
        </div>

        {/* Context Rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-lg border border-border/60 bg-background/70 p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Context
              </h3>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Group</span>
                  <span className="font-medium">
                    {group?.name || note.category || "Ungrouped"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {format(new Date(note.createdAt), "MMM d")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-medium">
                    {format(new Date(note.updatedAt), "MMM d")}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/70 p-4 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFlashcardSeed(null);
                  setFlashcardGeneratorOpen(true);
                }}
                className="w-full justify-start"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Generate Flashcards
              </Button>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="w-full justify-start"
              >
                <Link href={`/notes/${noteId}`}>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Note
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                Delete Note
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Selection Toolbar */}
      {selectionPosition && (
        <div
          className="fixed z-50 flex items-center gap-1 rounded-full border border-border/60 bg-background/95 px-2 py-1 shadow-lg"
          style={{
            left: selectionPosition.x,
            top: selectionPosition.y,
            transform: "translate(-50%, -100%)",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setExplainPanelOpen(true)}
            className="h-7 px-2 text-xs"
          >
            Explain
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              if (selectedText) {
                setFlashcardSeed(selectedText);
                setFlashcardGeneratorOpen(true);
              }
            }}
            className="h-7 px-2 text-xs"
          >
            Flashcards
          </Button>
        </div>
      )}

      {/* AI Explain Panel */}
      <AIExplainPanel
        open={explainPanelOpen}
        onOpenChange={setExplainPanelOpen}
        initialConcept={selectedText}
        context={note.title}
        onInsertExplanation={(explanation) => {
          // In view mode, we just show a toast since we can't edit
          console.log("Explanation generated:", explanation);
        }}
      />

      {/* Flashcard Generator */}
      <FlashcardsProvider>
        <AIFlashcardGenerator
          open={flashcardGeneratorOpen}
          onOpenChange={(open) => {
            setFlashcardGeneratorOpen(open);
            if (!open) setFlashcardSeed(null);
          }}
          noteId={noteId}
          noteContent={flashcardSeed || note.content}
          deckId="default"
        />
      </FlashcardsProvider>
    </div>
  );
};

export default function ViewNotePage() {
  return (
    <NotesProvider>
      <GroupsProvider>
        <ViewNoteContent />
      </GroupsProvider>
    </NotesProvider>
  );
}
