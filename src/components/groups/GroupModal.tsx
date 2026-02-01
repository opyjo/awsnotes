"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGroups } from "@/context/GroupsContext";
import { GROUP_COLORS, type Group } from "@/types/group";
import { cn } from "@/lib/utils";

interface GroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group | null;
  onGroupChange?: (oldName: string, newName: string) => Promise<void>;
}

export const GroupModal = ({
  open,
  onOpenChange,
  group,
  onGroupChange,
}: GroupModalProps) => {
  const { createGroup, updateGroup, deleteGroup, groups } = useGroups();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditing = !!group;

  useEffect(() => {
    if (open) {
      if (group) {
        setName(group.name);
        setColor(group.color);
      } else {
        setName("");
        setColor(undefined);
      }
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Group name is required");
      return;
    }

    // Check for duplicate names (case-insensitive)
    const existingGroup = groups.find(
      (g) =>
        g.name.toLowerCase() === trimmedName.toLowerCase() &&
        g.id !== group?.id
    );

    if (existingGroup) {
      setError("A group with this name already exists");
      return;
    }

    setSaving(true);

    try {
      if (isEditing && group) {
        const oldName = group.name;
        updateGroup(group.id, { name: trimmedName, color });

        // If name changed, update all notes with the old category
        if (oldName !== trimmedName && onGroupChange) {
          await onGroupChange(oldName, trimmedName);
        }
      } else {
        createGroup({ name: trimmedName, color });
      }

      onOpenChange(false);
    } catch (err) {
      setError("Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!group) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    deleteGroup(group.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Group" : "Create Group"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the group name or color. Notes in this group will be updated."
              : "Create a new group to organize your notes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AWS EC2, Networking, Security"
              className="h-11"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label>Color (optional)</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  "bg-muted hover:scale-110",
                  !color
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent"
                )}
                aria-label="No color"
              >
                {!color && (
                  <svg
                    className="w-4 h-4 mx-auto text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                    color === c.value
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="mr-auto"
              >
                {confirmDelete ? "Confirm Delete" : "Delete"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>

        {confirmDelete && (
          <p className="text-sm text-muted-foreground mt-2">
            Notes in this group will become ungrouped. This cannot be undone.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
