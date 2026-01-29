"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Note } from "@/types/note";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onDelete?: (noteId: string) => void;
}

export const NoteCard = ({ note, onDelete }: NoteCardProps) => {
  const router = useRouter();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(note.noteId);
  };

  const handleCardClick = () => {
    router.push(`/notes/${note.noteId}`);
  };

  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    if (typeof window === "undefined") {
      return html.replace(/<[^>]*>/g, "").substring(0, 120);
    }
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const contentPreview = stripHtml(note.content);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-2 transition-all duration-200",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        "cursor-pointer bg-card/50 backdrop-blur-sm",
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Open note: ${note.title}`}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {note.title}
            </CardTitle>
            {note.category && (
              <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
                <svg
                  className="w-3.5 h-3.5 text-muted-foreground"
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
                <span className="text-muted-foreground">{note.category}</span>
              </CardDescription>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className={cn(
                "h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-all",
                "text-destructive hover:text-destructive hover:bg-destructive/10",
                "rounded-full"
              )}
              aria-label="Delete note"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Content Preview */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {contentPreview}
          {contentPreview.length >= 120 && "..."}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium",
                  "bg-primary/10 text-primary border border-primary/20",
                  "transition-colors group-hover:bg-primary/15"
                )}
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 4 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground bg-muted/50">
                +{note.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer with date */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{format(new Date(note.updatedAt), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
