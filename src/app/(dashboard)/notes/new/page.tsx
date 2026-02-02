"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotesProvider, useNotes } from "@/context/NotesContext";
import { GroupsProvider } from "@/context/GroupsContext";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { GroupSelect } from "@/components/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const CreateNoteForm = () => {
  const router = useRouter();
  const { createNote } = useNotes();
  const { addToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createNote({
        title,
        content,
        category: category || undefined,
      });

      addToast({
        type: "success",
        message: "Note created successfully!",
      });
      router.push("/notes");
    } catch (err: any) {
      // Extract error message from various error formats
      let errorMessage = "Failed to create note";

      if (err?.errors && Array.isArray(err.errors)) {
        // GraphQL errors
        errorMessage = err.errors.map((e: any) => e.message).join(", ");
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      console.error("Error creating note:", JSON.stringify(err, null, 2));
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Failed to create note",
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
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

        {/* Action Buttons */}
        <div
          className="flex items-center justify-between pt-4 border-t border-border/50 animate-slide-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="transition-all duration-200 hover:bg-muted"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className={cn(
              "min-w-[140px] h-11 px-6 transition-all duration-200",
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
                Create Note
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function NewNotePage() {
  return (
    <NotesProvider>
      <GroupsProvider>
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="space-y-3 animate-slide-in-up">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Create New Note
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Document your AWS study notes with rich content
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                Rich editor enabled
              </div>
            </div>
          </div>

          <CreateNoteForm />
        </div>
      </GroupsProvider>
    </NotesProvider>
  );
}
