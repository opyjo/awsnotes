"use client";

import { useState } from "react";
import { useNotes } from "@/context/NotesContext";
import { useGroups } from "@/context/GroupsContext";
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
import Link from "next/link";

const UNGROUPED_ID = "__ungrouped__";

export const NotesList = () => {
  const { notes, loading, deleteNote } = useNotes();
  const { selectedGroupId, setSelectedGroupId, getGroupById } = useGroups();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");

  // Get selected group name for filtering
  const getSelectedGroupName = (): string | null | undefined => {
    if (selectedGroupId === null) return undefined; // All notes
    if (selectedGroupId === UNGROUPED_ID) return null; // Ungrouped
    const group = getGroupById(selectedGroupId);
    return group?.name;
  };

  const selectedGroupName = getSelectedGroupName();

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    // Group filter logic
    let matchesGroup = true;
    if (selectedGroupName === null) {
      // Ungrouped - notes without category
      matchesGroup = !note.category;
    } else if (selectedGroupName !== undefined) {
      // Specific group selected
      matchesGroup =
        note.category?.toLowerCase() === selectedGroupName.toLowerCase();
    }
    // If selectedGroupName is undefined, show all notes

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

    if (confirmed) {
      try {
        await deleteNote(noteId);
        addToast({
          type: "success",
          message: "Note deleted successfully",
        });
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
    return <NotesListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Notes</h1>
        <Button asChild>
          <Link href="/notes/new">Create Note</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        {/* Group indicator when a specific group is selected */}
        {selectedGroupId && selectedGroupId !== UNGROUPED_ID && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20 text-sm">
            <span className="text-primary font-medium">
              {getGroupById(selectedGroupId)?.name || "Group"}
            </span>
          </div>
        )}
        {selectedGroupId === UNGROUPED_ID && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted border border-border text-sm">
            <span className="text-muted-foreground font-medium">Ungrouped</span>
          </div>
        )}
      </div>

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNotes.map((note) => (
            <NoteCard key={note.noteId} note={note} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};
