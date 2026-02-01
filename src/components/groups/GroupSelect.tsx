"use client";

import { useState } from "react";
import { useGroups } from "@/context/GroupsContext";
import { GroupModal } from "./GroupModal";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface GroupSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const GroupSelect = ({
  value,
  onChange,
  label = "Group",
  className,
}: GroupSelectProps) => {
  const { groups, getGroupByName } = useGroups();
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const selectedGroup = value ? getGroupByName(value) : undefined;

  const handleSelect = (groupName: string) => {
    onChange(groupName);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      // If a new group was just created, select it
      const newGroup = groups.at(-1);
      if (newGroup && !value) {
        onChange(newGroup.name);
      }
    }
  };

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {label && (
          <Label className="flex items-center gap-2 text-sm font-semibold">
            <svg
              className="w-4 h-4 text-primary"
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
            {label}
          </Label>
        )}

        <div className="relative z-20">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full h-12 px-3 flex items-center justify-between gap-2",
              "rounded-md border border-input bg-background text-sm",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "hover:border-primary/50"
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="flex items-center gap-2 truncate">
              {selectedGroup ? (
                <>
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        selectedGroup.color || "hsl(var(--muted))",
                    }}
                  />
                  <span>{selectedGroup.name}</span>
                </>
              ) : value ? (
                <>
                  <span className="w-3 h-3 rounded-full shrink-0 bg-muted" />
                  <span>{value}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Select a group...</span>
              )}
            </span>
            <svg
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown content */}
              <div
                className={cn(
                  "absolute z-[101] w-full mt-1 py-1 rounded-md border bg-popover shadow-xl",
                  "max-h-60 overflow-y-auto"
                )}
                role="listbox"
              >
                {/* Create new group - at the top */}
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className={cn(
                    "w-full px-3 py-2 flex items-center gap-2 text-sm text-left",
                    "hover:bg-accent transition-colors text-primary font-medium"
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
                  <span>Create new group</span>
                </button>

                {/* Divider */}
                <div className="my-1 border-t border-border" />

                {/* No group option */}
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    "w-full px-3 py-2 flex items-center gap-2 text-sm text-left",
                    "hover:bg-accent transition-colors",
                    !value && "bg-accent/50"
                  )}
                  role="option"
                  aria-selected={!value}
                >
                  <span className="w-3 h-3 rounded-full bg-muted shrink-0" />
                  <span className="text-muted-foreground">No group</span>
                </button>

                {/* Existing groups */}
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleSelect(group.name)}
                    className={cn(
                      "w-full px-3 py-2 flex items-center gap-2 text-sm text-left",
                      "hover:bg-accent transition-colors",
                      value?.toLowerCase() === group.name.toLowerCase() &&
                        "bg-accent/50"
                    )}
                    role="option"
                    aria-selected={
                      value?.toLowerCase() === group.name.toLowerCase()
                    }
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: group.color || "hsl(var(--muted))",
                      }}
                    />
                    <span className="truncate">{group.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <GroupModal open={modalOpen} onOpenChange={handleModalClose} />
    </>
  );
};
