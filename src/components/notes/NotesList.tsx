"use client";

import { useState } from "react";
import { useNotes } from "@/context/NotesContext";
import { NoteCard } from "./NoteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export const NotesList = () => {
  const { notes, loading, deleteNote } = useNotes();
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
    new Set(notes.map((note) => note.category).filter(Boolean))
  ) as string[];

  if (loading) {
    return <div className="text-center py-8">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notes</h1>
        <Button asChild>
          <Link href="/notes/new">Create Note</Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
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

      {filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {notes.length === 0
            ? "No notes yet. Create your first note!"
            : "No notes match your search."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <NoteCard key={note.noteId} note={note} onDelete={deleteNote} />
          ))}
        </div>
      )}
    </div>
  );
};
