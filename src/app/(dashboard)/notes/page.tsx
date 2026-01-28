"use client";

import { NotesProvider } from "@/context/NotesContext";
import { NotesList } from "@/components/notes/NotesList";

export default function NotesPage() {
  return (
    <NotesProvider>
      <NotesList />
    </NotesProvider>
  );
}
