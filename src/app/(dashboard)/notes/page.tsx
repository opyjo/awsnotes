"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotes } from "@/hooks/api/useNotes";
import { NotesList } from "@/components/notes/NotesList";
import { GroupsSidebar } from "@/components/groups";
import { ExamCountdownWidget } from "@/components/exam";
import { NotesPageShell } from "@/components/notes/layout/NotesLayout";
import { buildNotesListHref, parseNotesGroupId } from "@/lib/notes-navigation";

const GROUP_DRAWER_STATE_KEY = "aws-study-notes-groups-drawer-open";

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notes, updateNotesCategory } = useNotes();
  const [groupsDrawerOpen, setGroupsDrawerOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(GROUP_DRAWER_STATE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch (error) {
      console.error("Failed to restore groups drawer state:", error);
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(GROUP_DRAWER_STATE_KEY, JSON.stringify(groupsDrawerOpen));
    } catch (error) {
      console.error("Failed to persist groups drawer state:", error);
    }
  }, [groupsDrawerOpen]);

  const handleGroupChange = async (oldName: string, newName: string) => {
    await updateNotesCategory(oldName, newName);
  };

  const selectedGroupId = parseNotesGroupId(searchParams);

  const handleSelectedGroupChange = (groupId: string | null) => {
    router.replace(buildNotesListHref(groupId), { scroll: false });
  };

  return (
    <div className="relative flex h-full -m-4 md:-m-6">
      <GroupsSidebar
        notes={notes}
        onGroupChange={handleGroupChange}
        selectedGroupId={selectedGroupId}
        onGroupSelect={handleSelectedGroupChange}
        mode="rail"
      />

      <GroupsSidebar
        notes={notes}
        onGroupChange={handleGroupChange}
        selectedGroupId={selectedGroupId}
        onGroupSelect={handleSelectedGroupChange}
        mode="drawer"
        open={groupsDrawerOpen}
        onOpenChange={setGroupsDrawerOpen}
      />

      <div className="min-w-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 lg:px-7">
        <NotesPageShell className="max-w-none">
          <ExamCountdownWidget />
          <NotesList
            selectedGroupId={selectedGroupId}
            onSelectedGroupChange={handleSelectedGroupChange}
            onToggleGroups={() => setGroupsDrawerOpen(true)}
          />
        </NotesPageShell>
      </div>
    </div>
  );
}
