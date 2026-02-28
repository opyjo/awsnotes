"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useNote } from "@/hooks/api/useNote";
import { useNotes } from "@/hooks/api/useNotes";
import { useGroups } from "@/hooks/api/useGroups";
import { AIFlashcardGenerator } from "@/components/flashcards/AIFlashcardGenerator";
import { AIExplainPanel } from "@/components/notes/AIExplainPanel";
import { NoteChatPanel } from "@/components/notes/NoteChatPanel";
import { NotesBreadcrumbs, type NotesBreadcrumbItem } from "@/components/notes/layout/NotesBreadcrumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { noteProseClasses } from "@/components/notes/noteProseClasses";
import {
  buildNoteEditHref,
  buildNotesListHref,
  parseNotesGroupId,
  resolveNotesGroupContext,
} from "@/lib/notes-navigation";
import {
  NotesCommandBar,
  NotesContentSurface,
  NotesPageShell,
  NotesSplitLayout,
  NotesToolsPanel,
  NotesToolsTrigger,
} from "@/components/notes/layout/NotesLayout";

const MIN_SELECTION_TOP = 92;

const ViewNoteContent = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const noteId = params.id as string;
  const { note, isLoading: loading } = useNote(noteId);
  const { deleteNote } = useNotes();
  const { groups, isLoading: groupsLoading, getGroupByName } = useGroups();

  const [flashcardGeneratorOpen, setFlashcardGeneratorOpen] = useState(false);
  const [explainPanelOpen, setExplainPanelOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [flashcardSeed, setFlashcardSeed] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const rawGroupId = parseNotesGroupId(searchParams);
  const navigationContext = resolveNotesGroupContext(rawGroupId, groups, {
    allowUnresolved: groupsLoading,
  });
  const notesHref = buildNotesListHref(navigationContext.groupId);
  const editHref = buildNoteEditHref(noteId, navigationContext.groupId);

  const sanitizedContent = note?.content
    ? DOMPurify.sanitize(note.content, {
        USE_PROFILES: { html: true },
      })
    : "";

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(noteId);
      router.push(notesHref);
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
      y: Math.max(MIN_SELECTION_TOP, rect.top - 12),
    });
  };

  const group = note?.category ? getGroupByName(note.category) : undefined;
  const breadcrumbItems: NotesBreadcrumbItem[] = note
    ? [
        { label: "All Notes", href: buildNotesListHref() },
        ...(navigationContext.isAllNotes
          ? []
          : [
              {
                label: navigationContext.label,
                href: notesHref,
                color: navigationContext.color,
              },
            ]),
        { label: note.title, current: true },
      ]
    : [{ label: "All Notes", current: true }];

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

  if (!note) {
    return (
      <NotesPageShell>
        <NotesContentSurface className="mx-auto max-w-3xl py-20 text-center">
          <div className="space-y-4">
            <svg
              className="mx-auto h-14 w-14 text-muted-foreground/50"
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
            <h2 className="text-2xl font-semibold">Note not found</h2>
            <p className="text-muted-foreground">
              This note may have been deleted or doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push(notesHref)}>Back to Notes</Button>
          </div>
        </NotesContentSurface>
      </NotesPageShell>
    );
  }

  return (
    <NotesPageShell>
      <NotesCommandBar>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <NotesBreadcrumbs items={breadcrumbItems} />
            <p className="truncate text-sm font-medium text-foreground/85">Viewing this note</p>
          </div>

          <div className="flex items-center gap-2">
            <NotesToolsTrigger onClick={() => setToolsPanelOpen(true)} label="Tools" />

            <Button asChild variant="outline" size="sm">
              <Link href={editHref}>
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </NotesCommandBar>

      <NotesSplitLayout>
        <div className="min-w-0 space-y-5">
          <NotesContentSurface className="space-y-6">
            <header className="space-y-4 border-b border-border/60 pb-5">
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
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
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: group.color || "hsl(var(--muted))" }}
                    />
                    {group.name}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {note.category && !group && (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div
              ref={contentRef}
              className={cn(
                noteProseClasses,
                "mx-auto max-w-[78ch] rounded-xl border border-border/55 bg-background/65 px-5 py-5 sm:px-8 sm:py-7",
              )}
              onMouseUp={handleTextSelection}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            <div className="mx-auto max-w-[78ch] rounded-xl border border-border/55 bg-muted/35 px-4 py-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="h-4 w-4 text-primary/75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Select any text in the note to explain it or generate flashcards.
              </p>
            </div>
          </NotesContentSurface>
        </div>

        <NotesToolsPanel
          title="Note Tools"
          description="Actions and context for this lesson note"
          open={toolsPanelOpen}
          onOpenChange={setToolsPanelOpen}
        >
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Context</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Group</dt>
                <dd className="text-right font-medium">{group?.name || note.category || "Ungrouped"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">{format(new Date(note.createdAt), "MMM d")}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="font-medium">{format(new Date(note.updatedAt), "MMM d")}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFlashcardSeed(null);
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

            <Button asChild variant="secondary" size="sm" className="w-full justify-start">
              <Link href={`/notes/${noteId}`}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {selectionPosition && (
        <div
          className="fixed z-50 flex items-center gap-1 rounded-full border border-border/60 bg-background/95 px-2 py-1 shadow-lg"
          style={{
            left: selectionPosition.x,
            top: selectionPosition.y,
            transform: "translate(-50%, -100%)",
          }}
          onMouseDown={(event) => event.preventDefault()}
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

      <AIExplainPanel
        open={explainPanelOpen}
        onOpenChange={setExplainPanelOpen}
        initialConcept={selectedText}
        context={note.title}
        onInsertExplanation={(explanation) => {
          console.log("Explanation generated:", explanation);
        }}
      />

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

      <NoteChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        noteId={noteId}
        noteTitle={note.title}
        noteContent={note.content}
      />
    </NotesPageShell>
  );
};

export default function ViewNotePage() {
  return <ViewNoteContent />;
}
