"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Note } from "@/types/note";
import { format } from "date-fns";

interface NoteCardProps {
  note: Note;
  onDelete?: (noteId: string) => void;
}

export const NoteCard = ({ note, onDelete }: NoteCardProps) => {
  const handleDelete = async () => {
    if (onDelete && confirm("Are you sure you want to delete this note?")) {
      await onDelete(note.noteId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>
              <Link
                href={`/notes/${note.noteId}`}
                className="hover:underline"
              >
                {note.title}
              </Link>
            </CardTitle>
            {note.category && (
              <CardDescription className="mt-1">
                {note.category}
              </CardDescription>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              🗑️
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-sm text-muted-foreground line-clamp-3"
          dangerouslySetInnerHTML={{
            __html: note.content.substring(0, 200) + "...",
          }}
        />
        {note.tags && note.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 text-xs text-muted-foreground">
          Updated {format(new Date(note.updatedAt), "MMM d, yyyy")}
        </div>
      </CardContent>
    </Card>
  );
};
