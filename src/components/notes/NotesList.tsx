"use client";

import { useMemo, useState } from "react";
import { useNotes } from "@/hooks/api/useNotes";
import { useGroups } from "@/hooks/api/useGroups";
import { NotesBreadcrumbs, type NotesBreadcrumbItem } from "@/components/notes/layout/NotesBreadcrumbs";
import { NoteCard } from "./NoteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  EmptyNotesIcon,
  EmptySearchIcon,
} from "@/components/ui/empty-state";
import { NotesListSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { NotesContentSurface } from "@/components/notes/layout/NotesLayout";
import Link from "next/link";
import {
  buildNotesListHref,
  resolveNotesGroupContext,
} from "@/lib/notes-navigation";

interface NotesListProps {
  selectedGroupId?: string | null;
  onSelectedGroupChange?: (groupId: string | null) => void;
  onToggleGroups?: () => void;
}

export const NotesList = ({
  selectedGroupId: externalSelectedGroupId,
  onSelectedGroupChange: externalOnSelectedGroupChange,
  onToggleGroups,
}: NotesListProps = {}) => {
  const { notes, isLoading: loading, isError, error, deleteNote } = useNotes();
  const { groups, isLoading: groupsLoading } = useGroups();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [internalSelectedGroupId, setInternalSelectedGroupId] = useState<string | null>(null);

  const selectedGroupId =
    externalSelectedGroupId !== undefined ? externalSelectedGroupId : internalSelectedGroupId;
  const setSelectedGroupId = externalOnSelectedGroupChange || setInternalSelectedGroupId;

  const groupContext = useMemo(
    () =>
      resolveNotesGroupContext(selectedGroupId, groups, {
        allowUnresolved: groupsLoading,
      }),
    [selectedGroupId, groups, groupsLoading],
  );

  const selectedGroupName = groupContext.isAllNotes
    ? undefined
    : groupContext.isPending
      ? undefined
      : groupContext.isUngrouped
      ? null
      : groupContext.label;

  const breadcrumbItems = useMemo<NotesBreadcrumbItem[]>(() => {
    if (groupContext.isAllNotes) {
      return [{ label: "All Notes", current: true }];
    }

    return [
      {
        label: "All Notes",
        href: buildNotesListHref(),
      },
      {
        label: groupContext.label,
        color: groupContext.color,
        current: true,
      },
    ];
  }, [groupContext]);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesGroup = true;
    if (selectedGroupName === null) {
      matchesGroup = !note.category;
    } else if (selectedGroupName !== undefined) {
      matchesGroup = note.category?.toLowerCase() === selectedGroupName.toLowerCase();
    }

    return matchesSearch && matchesGroup;
  });

  const handleDelete = async (noteId: string) => {
    const confirmed = await confirm({
      title: "Delete Note",
      description:
        "Are you sure you want to delete this note? This action cannot be undone.",
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
    } catch {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to delete note. Please try again.",
      });
    }
  };

  if (loading) {
    return <NotesListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 py-12 text-center">
        <p className="font-medium text-destructive">Failed to load notes</p>
        <p className="text-sm text-muted-foreground">{error ?? "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <NotesContentSurface className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            {onToggleGroups && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onToggleGroups}
                className="2xl:hidden"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                Groups
              </Button>
            )}
            <p className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground">
              {notes.length} total
            </p>
            <NotesBreadcrumbs items={breadcrumbItems} />
            <h1 className="min-w-0 text-xl font-semibold tracking-tight sm:text-2xl">Lesson Notes</h1>
          </div>

          <Button asChild className="h-10 px-4 text-sm lg:shrink-0">
            <Link href="/notes/new">Create Note</Link>
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
            <Input
              placeholder="Search lesson notes by title or content"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(searchQuery || !groupContext.isAllNotes) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGroupId(null);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </NotesContentSurface>

      {notes.length === 0 ? (
        <EmptyState
          icon={<EmptyNotesIcon />}
          title="No notes yet"
          description="Start creating study notes to organize your AWS certification preparation."
          action={{
            label: "Create Your First Note",
            href: "/notes/new",
          }}
        />
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={<EmptySearchIcon />}
          title="No notes found"
          description="Try adjusting your search or filter to find what you're looking for."
          action={{
            label: "Clear Filters",
            onClick: () => {
              setSearchQuery("");
              setSelectedGroupId(null);
            },
          }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.noteId}
              note={note}
              onDelete={handleDelete}
              contextGroupId={groupContext.groupId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
