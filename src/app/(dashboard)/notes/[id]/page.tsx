"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { NotesProvider, useNotes } from "@/context/NotesContext";
import { FlashcardsProvider } from "@/context/FlashcardsContext";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { AIFlashcardGenerator } from "@/components/flashcards/AIFlashcardGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const EditNoteForm = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;
  const { getNote, updateNote, deleteNote } = useNotes();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashcardGeneratorOpen, setFlashcardGeneratorOpen] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
      const note = await getNote(noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setCategory(note.category || "");
        setTags(note.tags?.join(", ") || "");
      }
      setLoading(false);
    };
    loadNote();
  }, [noteId, getNote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await updateNote(noteId, {
        title,
        content,
        category: category || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky Header with Save Button */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 py-4 mb-6 animate-slide-in-up shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <svg
                className="w-5 h-5 text-primary"
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Edit Note
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="transition-all duration-200 hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
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
              Delete
            </Button>
            <Button
              type="submit"
              form="edit-note-form"
              disabled={saving}
              className={cn(
                "min-w-[140px] h-10 px-6 transition-all duration-200",
                "hover:shadow-lg hover:shadow-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                <span className="flex items-center gap-2">
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

        {/* Category and Tags Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Field */}
          <div
            className="space-y-3 animate-slide-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Label
              htmlFor="category"
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Category
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="EC2"
              className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Tags Field */}
          <div
            className="space-y-3 animate-slide-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Label
              htmlFor="tags"
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Tags
              <span className="text-xs font-normal text-muted-foreground">
                (comma-separated)
              </span>
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="compute, instances, aws"
              className="h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Content Field */}
        <div
          className="space-y-3 animate-slide-in-up"
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

      <FlashcardsProvider>
        <AIFlashcardGenerator
          open={flashcardGeneratorOpen}
          onOpenChange={setFlashcardGeneratorOpen}
          noteId={noteId}
          noteContent={content}
          deckId="default"
        />
      </FlashcardsProvider>
    </div>
  );
};

export default function EditNotePage() {
  return (
    <NotesProvider>
      <div className="animate-fade-in">
        <EditNoteForm />
      </div>
    </NotesProvider>
  );
}
