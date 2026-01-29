"use client";

import Link from "next/link";
import { NotesProvider, useNotes } from "@/context/NotesContext";
import { FlashcardsProvider, useFlashcards } from "@/context/FlashcardsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { EmptyState, EmptyNotesIcon } from "@/components/ui/empty-state";
import { format } from "date-fns";

const DashboardContent = () => {
  const { notes, loading: notesLoading } = useNotes();
  const { dueFlashcards, loading: cardsLoading } = useFlashcards();

  const loading = notesLoading || cardsLoading;

  if (loading) {
    return <DashboardSkeleton />;
  }

  const recentNotes = notes.slice(0, 5);
  const categories = Array.from(
    new Set(notes.map((note) => note.category).filter(Boolean)),
  ) as string[];

  const categoryCounts = categories.reduce(
    (acc, category) => {
      acc[category] = notes.filter((note) => note.category === category).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's your study overview.</p>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Notes</CardDescription>
            <CardTitle className="text-3xl md:text-4xl">
              {notes.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="px-0 text-primary"
            >
              <Link href="/notes">View all</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className={dueFlashcards.length > 0 ? "border-primary" : ""}>
          <CardHeader className="pb-2">
            <CardDescription>Due for Review</CardDescription>
            <CardTitle className="text-3xl md:text-4xl">
              {dueFlashcards.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dueFlashcards.length > 0 ? (
              <Button asChild size="sm">
                <Link href="/flashcards/review">Start Review</Link>
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">
                All caught up!
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl md:text-4xl">
              {categories.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-muted-foreground">
              AWS services covered
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardDescription>Your latest study notes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <EmptyState
                icon={<EmptyNotesIcon />}
                title="No notes yet"
                description="Start creating study notes to track your progress."
                action={{
                  label: "Create Note",
                  href: "/notes/new",
                }}
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <Link
                    key={note.noteId}
                    href={`/notes/${note.noteId}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate group-hover:text-primary transition-colors">
                        {note.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(note.updatedAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    {note.category && (
                      <span className="text-xs bg-secondary px-2 py-1 rounded-full ml-2 hidden sm:inline">
                        {note.category}
                      </span>
                    )}
                  </Link>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/notes">View All Notes</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes by Category</CardTitle>
            <CardDescription>Distribution of your study notes</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  No categories yet. Add categories to your notes to organize
                  them by AWS service.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(categoryCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                    >
                      <span className="font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${(count / notes.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <NotesProvider>
      <FlashcardsProvider>
        <DashboardContent />
      </FlashcardsProvider>
    </NotesProvider>
  );
}
