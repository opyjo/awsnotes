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
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(note.noteId);
  };

  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const contentPreview = typeof window !== "undefined" 
    ? stripHtml(note.content).substring(0, 150) 
    : note.content.replace(/<[^>]*>/g, "").substring(0, 150);

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">
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
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label="Delete note"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {contentPreview}...
        </p>
        {note.tags && note.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{note.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        <div className="mt-4 text-xs text-muted-foreground">
          Updated {format(new Date(note.updatedAt), "MMM d, yyyy")}
        </div>
      </CardContent>
    </Card>
  );
};
