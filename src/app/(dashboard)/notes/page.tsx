"use client";

import { NotesProvider, useNotes } from "@/context/NotesContext";
import { GroupsProvider } from "@/context/GroupsContext";
import { NotesList } from "@/components/notes/NotesList";
import { GroupsSidebar } from "@/components/groups";

const NotesPageContent = () => {
  const { notes, updateNotesCategory } = useNotes();

  const handleGroupChange = async (oldName: string, newName: string) => {
    await updateNotesCategory(oldName, newName);
  };

  return (
    <div className="flex h-full -m-4 md:-m-6">
      <GroupsSidebar notes={notes} onGroupChange={handleGroupChange} />
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <NotesList />
      </div>
    </div>
  );
};

export default function NotesPage() {
  return (
    <NotesProvider>
      <GroupsProvider>
        <NotesPageContent />
      </GroupsProvider>
    </NotesProvider>
  );
}
