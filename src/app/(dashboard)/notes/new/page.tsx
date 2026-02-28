"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useNotes } from "@/hooks/api/useNotes";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { GroupSelect } from "@/components/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  NotesCommandBar,
  NotesContentSurface,
  NotesPageShell,
  NotesSplitLayout,
  NotesToolsPanel,
  NotesToolsTrigger,
} from "@/components/notes/layout/NotesLayout";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const typed = error as { message?: string; errors?: Array<{ message?: string }> };
    if (typed.errors && Array.isArray(typed.errors) && typed.errors.length > 0) {
      return typed.errors.map((entry) => entry.message || "Unknown error").join(", ");
    }
    if (typed.message) {
      return typed.message;
    }
  }

  return fallback;
};

export default function NewNotePage() {
  const router = useRouter();
  const { createNote } = useNotes();
  const { addToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "Failed to create note");

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
    <NotesPageShell>
      <NotesCommandBar>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Create Lesson Note</h1>
            <p className="text-sm text-muted-foreground">
              Build a clean study note with rich formatting and AI-assisted tools.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NotesToolsTrigger onClick={() => setToolsPanelOpen(true)} label="Guide" />
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" form="new-note-form" disabled={saving}>
              {saving ? "Creating..." : "Create Note"}
            </Button>
          </div>
        </div>
      </NotesCommandBar>

      <NotesSplitLayout>
        <div className="min-w-0">
          <NotesContentSurface>
            <form id="new-note-form" onSubmit={handleSubmit} className="space-y-7">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Title
                  <span className="ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  placeholder="Example: EC2 instance families and workloads"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <GroupSelect value={category} onChange={setCategory} label="Group" />
              </div>

              <div className="space-y-3">
                <Label htmlFor="content" className="text-sm font-semibold">
                  Content
                </Label>
                <div className="rounded-xl border border-border/70 bg-background/70 p-1">
                  <NoteEditor content={content} onChange={setContent} />
                </div>
              </div>

              {error && (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4",
                  )}
                >
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
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
                  <p className="text-sm font-medium text-destructive">{error}</p>
                </div>
              )}
            </form>
          </NotesContentSurface>
        </div>

        <NotesToolsPanel
          title="Writing Guide"
          description="Helpful structure for clear, exam-ready notes"
          open={toolsPanelOpen}
          onOpenChange={setToolsPanelOpen}
        >
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recommended structure
            </h3>
            <ul className="space-y-2 text-sm leading-6 text-foreground/90">
              <li>Start with a one-sentence concept summary.</li>
              <li>Add key rules, limits, and AWS defaults.</li>
              <li>Capture at least one real-world use case.</li>
              <li>Close with pitfalls and exam-style reminders.</li>
            </ul>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI tools</h3>
            <p className="text-sm text-muted-foreground">
              Use in-editor AI summarize/explain while writing. Chat and flashcards become available after saving.
            </p>
          </div>
        </NotesToolsPanel>
      </NotesSplitLayout>
    </NotesPageShell>
  );
}
