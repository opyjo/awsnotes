"use client";

import { useState, useEffect, type MouseEvent } from "react";
import { useGroups } from "@/hooks/api/useGroups";
import { GroupModal } from "./GroupModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NOTES_UNGROUPED_ID } from "@/lib/notes-navigation";
import type { Note } from "@/types/note";
import type { Group } from "@/types/group";

interface GroupsSidebarProps {
  notes: Note[];
  onGroupChange?: (oldName: string, newName: string) => Promise<void>;
  selectedGroupId?: string | null;
  onGroupSelect?: (groupId: string | null) => void;
  mode?: "rail" | "drawer";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const SIDEBAR_STATE_KEY = "aws-study-notes-sidebar-collapsed";
export const GroupsSidebar = ({
  notes,
  onGroupChange,
  selectedGroupId: externalSelectedGroupId,
  onGroupSelect: externalOnGroupSelect,
  mode = "rail",
  open,
  onOpenChange,
  className,
}: GroupsSidebarProps) => {
  const { groups } = useGroups();
  const isDrawer = mode === "drawer";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [internalSelectedGroupId, setInternalSelectedGroupId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    if (typeof window === "undefined" || isDrawer) return false;
    try {
      const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch (err) {
      console.error("Failed to load sidebar state:", err);
      return false;
    }
  });
  const [internalOpen, setInternalOpen] = useState(false);

  const selectedGroupId =
    externalSelectedGroupId !== undefined ? externalSelectedGroupId : internalSelectedGroupId;
  const setSelectedGroupId = externalOnGroupSelect || setInternalSelectedGroupId;
  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (!isDrawer || !isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawer, isOpen, setOpen]);

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(collapsed));
    } catch (err) {
      console.error("Failed to save sidebar state:", err);
    }
  };

  const getNotesCount = (groupName: string | null): number => {
    if (groupName === null) {
      return notes.filter((n) => !n.category).length;
    }
    return notes.filter((n) => n.category?.toLowerCase() === groupName.toLowerCase()).length;
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setModalOpen(true);
  };

  const handleEditGroup = (group: Group, event: MouseEvent) => {
    event.stopPropagation();
    setEditingGroup(group);
    setModalOpen(true);
  };

  const handleSelectGroup = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    if (isDrawer) {
      setOpen(false);
    }
  };

  const collapsed = isDrawer ? false : sidebarCollapsed;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center border-b border-border/60 p-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && <h2 className="text-sm font-semibold text-foreground/85">Groups</h2>}

        {isDrawer ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpen(false)}
            aria-label="Close groups"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!collapsed)}
            className="h-8 w-8"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
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
        )}
      </div>

      <div className="border-b border-border/60 p-2.5">
        <Button
          type="button"
          onClick={handleCreateGroup}
          variant="outline"
          size="sm"
          className={cn("w-full gap-2", collapsed ? "justify-center px-0" : "justify-start")}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {!collapsed && <span>Create Group</span>}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2.5">
        <button
          type="button"
          onClick={() => handleSelectGroup(null)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            "hover:bg-accent/60",
            selectedGroupId === null ? "bg-primary/10 font-medium text-primary" : "text-foreground/75",
            collapsed && "justify-center px-0",
          )}
          aria-label="All Notes"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">All Notes</span>
              <span className="text-xs text-muted-foreground">{notes.length}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSelectGroup(NOTES_UNGROUPED_ID)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            "hover:bg-accent/60",
            selectedGroupId === NOTES_UNGROUPED_ID
              ? "bg-primary/10 font-medium text-primary"
              : "text-foreground/75",
            collapsed && "justify-center px-0",
          )}
          aria-label="Ungrouped"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Ungrouped</span>
              <span className="text-xs text-muted-foreground">{getNotesCount(null)}</span>
            </>
          )}
        </button>

        {groups.length > 0 && <div className="my-2 border-t border-border/55" />}

        {groups.map((group) => (
          <div key={group.id} className="group/item relative">
            <button
              type="button"
              onClick={() => handleSelectGroup(group.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                "hover:bg-accent/60",
                selectedGroupId === group.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground/75",
                collapsed ? "justify-center px-0" : "pr-9",
              )}
              aria-label={group.name}
            >
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: group.color || "hsl(var(--muted))" }}
              >
                {!group.color && (
                  <svg className="h-2.5 w-2.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left">{group.name}</span>
                  <span className="text-xs text-muted-foreground">{getNotesCount(group.name)}</span>
                </>
              )}
            </button>

            {!collapsed && (
              <button
                type="button"
                onClick={(event) => handleEditGroup(group, event)}
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5",
                  "text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground",
                  "group-hover/item:opacity-100",
                )}
                aria-label={`Edit ${group.name}`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );

  return (
    <>
      {isDrawer ? (
        <>
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] transition-opacity duration-200 2xl:hidden",
              isOpen ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-[292px] border-r border-border/70 bg-background/95 shadow-xl backdrop-blur-md transition-transform duration-200 2xl:hidden",
              isOpen ? "translate-x-0" : "-translate-x-full",
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Notes groups"
          >
            {sidebarContent}
          </aside>
        </>
      ) : (
        <aside
          className={cn(
            "hidden shrink-0 border-r border-border/55 bg-card/35 backdrop-blur-sm transition-[width] duration-300 2xl:block",
            collapsed ? "w-16" : "w-72",
            className,
          )}
        >
          {sidebarContent}
        </aside>
      )}

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
