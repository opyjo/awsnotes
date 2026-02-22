"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useNote } from "@/hooks/api/useNote";
import { useNotes } from "@/hooks/api/useNotes";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { AIFlashcardGenerator } from "@/components/flashcards/AIFlashcardGenerator";
import { NoteChatPanel } from "@/components/notes/NoteChatPanel";
import { GroupSelect } from "@/components/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";

// Inner form component — only mounts once note data is available
// so useState and TipTap editor initialize with real content
const EditNoteFormContent = ({ note: initialNote, noteId }: { note: Note; noteId: string }) => {
  const router = useRouter();
  const { updateNote, deleteNote } = useNotes();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [title, setTitle] = useState(initialNote.title);
  const [content, setContent] = useState(initialNote.content);
  const [category, setCategory] = useState(initialNote.category || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardGeneratorOpen, setFlashcardGeneratorOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await updateNote(noteId, {
        title,
        content,
        category: category || undefined,
      });

      addToast({
        type: "success",
        message: "Note updated successfully!",
      });
      router.push("/notes");
    } catch (error: any) {
      console.error("Error updating note:", error);
      let errorMessage = "Unknown error";
      if (error?.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((e: any) => e.message).join(", ");
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error, null, 2);
      }
      console.error("Full error details:", JSON.stringify(error, null, 2));
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to update note",
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Note",
      description:
        "Are you sure you want to delete this note? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      try {
        await deleteNote(noteId);
        addToast({
          type: "success",
          message: "Note deleted successfully",
        });
        router.push("/notes");
      } catch (error) {
        addToast({
          type: "error",
          title: "Error",
          message: "Failed to delete note. Please try again.",
        });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky Header with Save Button */}
      <div
        className={cn(
          "sticky top-0 z-50 mb-6",
          "bg-background/95 backdrop-blur-lg backdrop-saturate-150",
          "border border-border/60 rounded-lg",
          "shadow-lg shadow-black/5 dark:shadow-black/20",
          "px-5 py-4",
          "transition-all duration-200"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">
                Edit Note
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 h-9 px-3"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setChatOpen(true)}
              className="text-sm text-muted-foreground/80 hover:text-foreground hover:bg-muted/60 transition-all duration-200 h-9 px-3"
            >
              <svg
                className="w-3.5 h-3.5 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Chat
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="text-sm text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 h-9 px-3"
            >
              <svg
                className="w-3.5 h-3.5 mr-1.5"
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
              Delete
            </Button>
            <Button
              type="submit"
              form="edit-note-form"
              disabled={saving}
              variant="secondary"
              className={cn(
                "min-w-[130px] h-9 px-4 text-sm font-medium transition-all duration-200",
                "bg-muted/80 hover:bg-muted text-foreground hover:text-foreground",
                "border border-border/50 hover:border-border/70",
                "shadow-sm hover:shadow-md",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="animate-spin h-3.5 w-3.5"
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
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Changes
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <form
        id="edit-note-form"
        onSubmit={handleSubmit}
        className="space-y-8 animate-fade-in"
      >
        {/* Title Field */}
        <div
          className="space-y-3 animate-slide-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <Label
            htmlFor="title"
            className="flex items-center gap-2 text-sm font-semibold"
          >
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Title
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="AWS EC2 Instance Types"
            className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Group Field */}
        <div
          className="animate-slide-in-up relative z-20"
          style={{ animationDelay: "0.2s" }}
        >
          <GroupSelect
            value={category}
            onChange={setCategory}
            label="Group"
          />
        </div>

        {/* Content Field */}
        <div
          className="space-y-3 animate-slide-in-up relative z-10"
          style={{ animationDelay: "0.4s" }}
        >
          <Label
            htmlFor="content"
            className="flex items-center gap-2 text-sm font-semibold"
          >
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Content
          </Label>
          <div className="rounded-lg border-2 border-border/50 transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-lg focus-within:shadow-primary/5">
            <NoteEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={cn(
              "rounded-lg bg-destructive/10 border border-destructive/20 p-4",
              "animate-slide-in-up flex items-start gap-3",
            )}
            style={{ animationDelay: "0.5s" }}
          >
            <svg
              className="w-5 h-5 text-destructive shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}
      </form>

      <AIFlashcardGenerator
        open={flashcardGeneratorOpen}
        onOpenChange={setFlashcardGeneratorOpen}
        noteId={noteId}
        noteContent={content}
        deckId="default"
      />

      {/* Note Chat Panel */}
      <NoteChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        noteId={noteId}
        noteTitle={title}
        noteContent={content}
      />
    </div>
  );
};

// Outer component handles loading/error states
// Only mounts EditNoteFormContent once note data is available
const EditNoteLoader = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;
  const { note, isLoading, isError, error: queryError } = useNote(noteId);

  if (isLoading) {
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

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center space-y-4 max-w-md">
          <svg
            className="h-12 w-12 mx-auto text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Note</h2>
            <p className="text-muted-foreground mb-4">{queryError || "Failed to load note"}</p>
            <Button onClick={() => router.push("/notes")}>
              Back to Notes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center space-y-4">
          <svg
            className="h-12 w-12 mx-auto text-muted-foreground"
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
          <div>
            <h2 className="text-xl font-semibold mb-2">Note Not Found</h2>
            <p className="text-muted-foreground mb-4">The note you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push("/notes")}>
              Back to Notes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // key={noteId} ensures fresh mount when navigating between notes
  return <EditNoteFormContent note={note} noteId={noteId} key={noteId} />;
};

export default function EditNotePage() {
  return (
    <div className="animate-fade-in">
      <EditNoteLoader />
    </div>
  );
}
