"use client";

import { useState } from "react";
import { useNotes } from "@/hooks/api/useNotes";
import { NotesList } from "@/components/notes/NotesList";
import { GroupsSidebar } from "@/components/groups";
import { ExamCountdownWidget } from "@/components/exam";

export default function NotesPage() {
  const { notes, updateNotesCategory } = useNotes();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const handleGroupChange = async (oldName: string, newName: string) => {
    await updateNotesCategory(oldName, newName);
  };

  return (
    <div className="flex h-full -m-4 md:-m-6">
      <GroupsSidebar
        notes={notes}
        onGroupChange={handleGroupChange}
        selectedGroupId={selectedGroupId}
        onGroupSelect={setSelectedGroupId}
      />
      <div className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto">
        <ExamCountdownWidget />
        <NotesList
          selectedGroupId={selectedGroupId}
          onSelectedGroupChange={setSelectedGroupId}
        />
      </div>
    </div>
  );
}
