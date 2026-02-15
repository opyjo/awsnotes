"use client";

import { useState } from "react";
import { useGroups } from "@/context/GroupsContext";
import { GroupModal } from "./GroupModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";
import type { Group } from "@/types/group";

interface GroupsSidebarProps {
  notes: Note[];
  onGroupChange?: (oldName: string, newName: string) => Promise<void>;
}

export const GroupsSidebar = ({ notes, onGroupChange }: GroupsSidebarProps) => {
  const {
    groups,
    selectedGroupId,
    setSelectedGroupId,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useGroups();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Count notes per group
  const getNotesCount = (groupName: string | null): number => {
    if (groupName === null) {
      // Ungrouped notes
      return notes.filter((n) => !n.category).length;
    }
    return notes.filter(
      (n) => n.category?.toLowerCase() === groupName.toLowerCase()
    ).length;
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setModalOpen(true);
  };

  const handleEditGroup = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group);
    setModalOpen(true);
  };

  const handleSelectGroup = (groupId: string | null) => {
    setSelectedGroupId(groupId);
  };

  // "UNGROUPED" special ID
  const UNGROUPED_ID = "__ungrouped__";

  return (
    <>
      <aside
        className={cn(
          "shrink-0 border-r border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300",
          sidebarCollapsed ? "w-12" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={cn(
              "flex items-center justify-between p-3 border-b border-border/50",
              sidebarCollapsed && "justify-center"
            )}
          >
            {!sidebarCollapsed && (
              <h2 className="text-sm font-semibold text-foreground/80">
                Groups
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className={cn(
                  "w-4 h-4 transition-transform",
                  sidebarCollapsed && "rotate-180"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </Button>
          </div>

          {/* Create Group Button - at the top */}
          <div className="p-2 border-b border-border/50">
            <Button
              onClick={handleCreateGroup}
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start gap-2",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {!sidebarCollapsed && <span>Create Group</span>}
            </Button>
          </div>

          {/* Groups List */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* All Notes */}
            <button
              onClick={() => handleSelectGroup(null)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                "hover:bg-accent/50",
                selectedGroupId === null
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/70",
                sidebarCollapsed && "justify-center px-0"
              )}
              aria-label="All Notes"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">All Notes</span>
                  <span className="text-xs text-muted-foreground">
                    {notes.length}
                  </span>
                </>
              )}
            </button>

            {/* Ungrouped Notes */}
            <button
              onClick={() => handleSelectGroup(UNGROUPED_ID)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                "hover:bg-accent/50",
                selectedGroupId === UNGROUPED_ID
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/70",
                sidebarCollapsed && "justify-center px-0"
              )}
              aria-label="Ungrouped"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">Ungrouped</span>
                  <span className="text-xs text-muted-foreground">
                    {getNotesCount(null)}
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            {groups.length > 0 && (
              <div className="my-2 border-t border-border/50" />
            )}

            {/* User Groups */}
            {groups.map((group) => (
              <div key={group.id} className="group/item relative">
                <button
                  onClick={() => handleSelectGroup(group.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    "hover:bg-accent/50",
                    selectedGroupId === group.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/70",
                    sidebarCollapsed ? "justify-center px-0" : "pr-8"
                  )}
                  aria-label={group.name}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor: group.color || "hsl(var(--muted))",
                    }}
                  >
                    {!group.color && (
                      <svg
                        className="w-2.5 h-2.5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    )}
                  </span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">
                        {group.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getNotesCount(group.name)}
                      </span>
                    </>
                  )}
                </button>
                {/* Edit button on hover */}
                {!sidebarCollapsed && (
                  <button
                    onClick={(e) => handleEditGroup(group, e)}
                    className={cn(
                      "absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md",
                      "opacity-0 group-hover/item:opacity-100 transition-opacity",
                      "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={`Edit ${group.name}`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </nav>

        </div>
      </aside>

      <GroupModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        group={editingGroup}
        onGroupChange={onGroupChange}
      />
    </>
  );
};

export { type GroupsSidebarProps };
