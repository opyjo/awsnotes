"use client";

import { useEffect } from "react";
import Link from "next/link";
import { NotesProvider, useNotes } from "@/context/NotesContext";
import { FlashcardsProvider, useFlashcards } from "@/context/FlashcardsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const DashboardContent = () => {
  const { notes, loading: notesLoading } = useNotes();
  const { dueFlashcards, loading: cardsLoading } = useFlashcards();

  const recentNotes = notes.slice(0, 5);
  const categories = Array.from(
    new Set(notes.map((note) => note.category).filter(Boolean))
  ) as string[];

  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = notes.filter((note) => note.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Total study notes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Due Flashcards</CardTitle>
            <CardDescription>Ready for review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dueFlashcards.length}</div>
            {dueFlashcards.length > 0 && (
              <Button asChild className="mt-4 w-full">
                <Link href="/flashcards/review">Start Review</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>AWS service categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardDescription>Your latest study notes</CardDescription>
          </CardHeader>
          <CardContent>
            {notesLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : recentNotes.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No notes yet.{" "}
                <Link href="/notes/new" className="text-primary underline">
                  Create your first note
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentNotes.map((note) => (
                  <Link
                    key={note.noteId}
                    href={`/notes/${note.noteId}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="font-semibold">{note.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(note.updatedAt), "MMM d, yyyy")}
                    </div>
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
            <CardDescription>Distribution of your notes</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No categories yet
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-2 rounded-lg bg-accent"
                  >
                    <span className="font-medium">{category}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} note{count !== 1 ? "s" : ""}
                    </span>
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
