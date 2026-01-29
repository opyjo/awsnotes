"use client";

import { useState } from "react";
import { useNotes } from "@/context/NotesContext";
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

export const NotesList = () => {
  const { notes, loading, deleteNote } = useNotes();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || note.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set(notes.map((note) => note.category).filter(Boolean)),
  ) as string[];

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
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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
              setCategoryFilter("");
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
