"use client";

import { useState } from "react";
import { FlashcardsProvider, useFlashcards } from "@/context/FlashcardsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateFlashcardModal } from "@/components/flashcards/CreateFlashcardModal";
import Link from "next/link";

const FlashcardsPageContent = () => {
  const { dueFlashcards, loading, createFlashcard } = useFlashcards();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDeckId] = useState("default");

  const handleCreateFlashcard = async (input: any) => {
    await createFlashcard(input);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <div className="flex gap-4">
          <Button onClick={() => setCreateModalOpen(true)}>
            Create Flashcard
          </Button>
          {dueFlashcards.length > 0 && (
            <Button asChild>
              <Link href="/flashcards/review">
                Review ({dueFlashcards.length} due)
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">{dueFlashcards.length}</div>
              <div className="text-sm text-muted-foreground">Due for Review</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Total Cards</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-sm text-muted-foreground">Decks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading flashcards...</div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-lg text-muted-foreground">
              No flashcards yet. Create your first flashcard!
            </div>
          </CardContent>
        </Card>
      )}

      <CreateFlashcardModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreate={handleCreateFlashcard}
        deckId={selectedDeckId}
      />
    </div>
  );
};

export default function FlashcardsPage() {
  return (
    <FlashcardsProvider>
      <FlashcardsPageContent />
    </FlashcardsProvider>
  );
}
