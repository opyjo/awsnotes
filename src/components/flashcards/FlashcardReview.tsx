"use client";

import { useState, useEffect } from "react";
import { useFlashcards } from "@/context/FlashcardsContext";
import { FlashcardCard } from "./FlashcardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQualityFromRating } from "@/lib/spaced-repetition/sm2";

export const FlashcardReview = () => {
  const { dueFlashcards, reviewFlashcard, fetchDueFlashcards } =
    useFlashcards();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    fetchDueFlashcards();
  }, []);

  const currentCard = dueFlashcards[currentIndex];

  const handleRating = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!currentCard) return;

    const quality = getQualityFromRating(rating);
    await reviewFlashcard(currentCard.cardId, quality);
    setReviewedCount((prev) => prev + 1);

    if (currentIndex < dueFlashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionComplete(true);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (dueFlashcards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-lg text-muted-foreground">
            No flashcards due for review. Great job!
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessionComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg">
            You reviewed {reviewedCount} flashcard{reviewedCount !== 1 ? "s" : ""} today.
          </div>
          <Button onClick={() => window.location.reload()}>
            Review More
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Review Flashcards</h1>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} of {dueFlashcards.length}
        </div>
      </div>

      <FlashcardCard
        card={currentCard}
        showBack={isFlipped}
        onFlip={handleFlip}
      />

      {isFlipped && (
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
          <Button
            variant="destructive"
            onClick={() => handleRating("again")}
            className="flex-1 md:flex-none min-w-[80px]"
          >
            Again
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRating("hard")}
            className="flex-1 md:flex-none min-w-[80px]"
          >
            Hard
          </Button>
          <Button
            onClick={() => handleRating("good")}
            className="flex-1 md:flex-none min-w-[80px]"
          >
            Good
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRating("easy")}
            className="flex-1 md:flex-none min-w-[80px]"
          >
            Easy
          </Button>
        </div>
      )}

      {!isFlipped && (
        <div className="text-center text-sm text-muted-foreground">
          Click the card to reveal the answer
        </div>
      )}
    </div>
  );
};
