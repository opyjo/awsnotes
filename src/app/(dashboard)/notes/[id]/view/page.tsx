"use client";

import { useState, useEffect } from "react";
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
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
      setExplainPanelOpen(true);
    }
  };

  const group = note?.category ? getGroupByName(note.category) : undefined;

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
    <div className="max-w-4xl mx-auto">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFlashcardGeneratorOpen(true)}
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
              Generate Flashcards
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
        <header className="mb-8 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {note.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {group && (
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: group.color || "hsl(var(--muted))" }}
                />
                {group.name}
              </span>
            )}
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

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                    "bg-primary/10 text-primary border border-primary/20"
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <div
          className={cn(
            "prose prose-neutral dark:prose-invert max-w-none",
            "prose-headings:font-semibold prose-headings:tracking-tight",
            "prose-p:leading-7 prose-p:text-foreground/90",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
            "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
            "prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4",
            "prose-img:rounded-lg prose-img:shadow-md"
          )}
          onMouseUp={handleTextSelection}
          dangerouslySetInnerHTML={{ __html: note.content }}
        />

        {/* Tip for AI Explain */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <svg
              className="w-4 h-4 text-primary"
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
              <strong>Tip:</strong> Select any text to get an AI explanation
            </span>
          </p>
        </div>
      </article>

      {/* AI Explain Panel */}
      <AIExplainPanel
        open={explainPanelOpen}
        onOpenChange={setExplainPanelOpen}
        selectedText={selectedText}
        noteContext={note.title}
      />

      {/* Flashcard Generator */}
      <FlashcardsProvider>
        <AIFlashcardGenerator
          open={flashcardGeneratorOpen}
          onOpenChange={setFlashcardGeneratorOpen}
          noteId={noteId}
          noteContent={note.content}
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
