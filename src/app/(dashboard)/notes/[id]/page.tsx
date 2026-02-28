"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useNote } from "@/hooks/api/useNote";
import { useNotes } from "@/hooks/api/useNotes";
import { useGroups } from "@/hooks/api/useGroups";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { AIFlashcardGenerator } from "@/components/flashcards/AIFlashcardGenerator";
import { NoteChatPanel } from "@/components/notes/NoteChatPanel";
import { NotesBreadcrumbs, type NotesBreadcrumbItem } from "@/components/notes/layout/NotesBreadcrumbs";
import { GroupSelect } from "@/components/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Note } from "@/types/note";
import { format } from "date-fns";
import { buildNoteViewHref, buildNotesListHref, parseNotesGroupId, resolveNotesGroupContext } from "@/lib/notes-navigation";
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

const EditNoteFormContent = ({
  note: initialNote,
  noteId,
  notesHref,
  viewHref,
  breadcrumbContext,
}: {
  note: Note;
  noteId: string;
  notesHref: string;
  viewHref: string;
  breadcrumbContext: {
    isAllNotes: boolean;
    label: string;
    color?: string;
  };
}) => {
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
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);

  const breadcrumbItems = useMemo<NotesBreadcrumbItem[]>(
    () => [
      { label: "All Notes", href: buildNotesListHref() },
      ...(breadcrumbContext.isAllNotes
        ? []
        : [
            {
              label: breadcrumbContext.label,
              href: notesHref,
              color: breadcrumbContext.color,
            },
          ]),
      { label: title || initialNote.title, href: viewHref },
      { label: "Edit", current: true },
    ],
    [breadcrumbContext, initialNote.title, notesHref, title, viewHref],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
      router.push(notesHref);
    } catch (err: unknown) {
      console.error("Error updating note:", err);
      const errorMessage = getErrorMessage(err, "Unknown error");

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
      description: "Are you sure you want to delete this note? This action cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) return;

    try {
      await deleteNote(noteId);
      addToast({
        type: "success",
        message: "Note deleted successfully",
      });
      router.push(notesHref);
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to delete note. Please try again.",
      });
    }
  };

  return (
    <NotesPageShell>
      <NotesCommandBar>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <NotesBreadcrumbs items={breadcrumbItems} />
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Edit Lesson Note</h1>
            <p className="text-sm text-muted-foreground">
              Refine structure, tighten language, and keep study points exam-ready.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NotesToolsTrigger onClick={() => setToolsPanelOpen(true)} label="Tools" />
            <Button type="button" variant="ghost" onClick={() => router.push(viewHref)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-note-form" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </NotesCommandBar>

      <NotesSplitLayout>
        <div className="min-w-0">
          <NotesContentSurface>
            <form id="edit-note-form" onSubmit={handleSubmit} className="space-y-7">
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
                  placeholder="AWS EC2 Instance Types"
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
                <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4">
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
          title="Edit Tools"
          description="Context and actions for this note"
          open={toolsPanelOpen}
          onOpenChange={setToolsPanelOpen}
        >
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Context</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">{format(new Date(initialNote.createdAt), "MMM d, yyyy")}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Last update</dt>
                <dd className="font-medium">{format(new Date(initialNote.updatedAt), "MMM d, yyyy")}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFlashcardGeneratorOpen(true);
                setToolsPanelOpen(false);
              }}
              className="w-full justify-start"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setChatOpen(true);
                setToolsPanelOpen(false);
              }}
              className="w-full justify-start"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Chat with Note
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </NotesToolsPanel>
      </NotesSplitLayout>

      <AIFlashcardGenerator
        open={flashcardGeneratorOpen}
        onOpenChange={setFlashcardGeneratorOpen}
        noteId={noteId}
        noteContent={content}
        deckId="default"
      />

      <NoteChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        noteId={noteId}
        noteTitle={title}
        noteContent={content}
      />
    </NotesPageShell>
  );
};

const EditNoteLoader = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const noteId = params.id as string;
  const rawGroupId = parseNotesGroupId(searchParams);
  const { note, isLoading, isError, error: queryError } = useNote(noteId);
  const { groups, isLoading: groupsLoading } = useGroups();
  const breadcrumbContext = resolveNotesGroupContext(rawGroupId, groups, {
    allowUnresolved: groupsLoading,
  });
  const notesHref = buildNotesListHref(breadcrumbContext.groupId);
  const viewHref = buildNoteViewHref(noteId, breadcrumbContext.groupId);

  if (isLoading) {
    return (
      <NotesPageShell>
        <div className="flex min-h-[420px] items-center justify-center animate-fade-in">
          <div className="space-y-4 text-center">
            <svg
              className="mx-auto h-8 w-8 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-muted-foreground">Loading note...</p>
          </div>
        </div>
      </NotesPageShell>
    );
  }

  if (isError) {
    return (
      <NotesPageShell>
        <NotesContentSurface className="mx-auto max-w-3xl py-20 text-center">
          <div className="space-y-4">
            <svg className="mx-auto h-12 w-12 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-semibold">Error Loading Note</h2>
            <p className="text-muted-foreground">{queryError || "Failed to load note"}</p>
            <Button onClick={() => router.push(notesHref)}>Back to Notes</Button>
          </div>
        </NotesContentSurface>
      </NotesPageShell>
    );
  }

  if (!note) {
    return (
      <NotesPageShell>
        <NotesContentSurface className="mx-auto max-w-3xl py-20 text-center">
          <div className="space-y-4">
            <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-2xl font-semibold">Note Not Found</h2>
            <p className="text-muted-foreground">The note you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push(notesHref)}>Back to Notes</Button>
          </div>
        </NotesContentSurface>
      </NotesPageShell>
    );
  }

  return (
    <EditNoteFormContent
      note={note}
      noteId={noteId}
      notesHref={notesHref}
      viewHref={viewHref}
      breadcrumbContext={breadcrumbContext}
      key={noteId}
    />
  );
};

export default function EditNotePage() {
  return <EditNoteLoader />;
}
