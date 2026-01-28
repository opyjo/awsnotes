"use client";

import { useState, useEffect, useCallback } from "react";
import { useFlashcards } from "@/context/FlashcardsContext";
import { FlashcardFlip } from "./FlashcardFlip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, CelebrationIcon, EmptyFlashcardsIcon } from "@/components/ui/empty-state";
import { FlashcardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getQualityFromRating } from "@/lib/spaced-repetition/sm2";

type Rating = "again" | "hard" | "good" | "easy";

const ratingConfig: { key: Rating; label: string; shortcut: string; variant: "destructive" | "outline" | "default" }[] = [
  { key: "again", label: "Again", shortcut: "1", variant: "destructive" },
  { key: "hard", label: "Hard", shortcut: "2", variant: "outline" },
  { key: "good", label: "Good", shortcut: "3", variant: "default" },
  { key: "easy", label: "Easy", shortcut: "4", variant: "outline" },
];

export const FlashcardReview = () => {
  const { dueFlashcards, reviewFlashcard, fetchDueFlashcards, loading } = useFlashcards();
  const { addToast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDueFlashcards();
  }, []);

  const currentCard = dueFlashcards[currentIndex];

  const handleRating = useCallback(async (rating: Rating) => {
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    const quality = getQualityFromRating(rating);
    
    try {
      await reviewFlashcard(currentCard.cardId, quality);
      setReviewedCount((prev) => prev + 1);

      if (currentIndex < dueFlashcards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        setSessionComplete(true);
        addToast({
          type: "success",
          title: "Session Complete!",
          message: `You reviewed ${reviewedCount + 1} flashcard${reviewedCount > 0 ? "s" : ""}.`,
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to save review. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentCard, currentIndex, dueFlashcards.length, reviewFlashcard, reviewedCount, isSubmitting, addToast]);

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped && !isSubmitting) {
        if (e.key === "1") handleRating("again");
        else if (e.key === "2") handleRating("hard");
        else if (e.key === "3") handleRating("good");
        else if (e.key === "4") handleRating("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, isSubmitting, handleFlip, handleRating]);

  if (loading) {
    return <FlashcardSkeleton />;
  }

  if (dueFlashcards.length === 0) {
    return (
      <Card>
        <CardContent className="py-0">
          <EmptyState
            icon={<EmptyFlashcardsIcon />}
            title="No flashcards due"
            description="Great job! You've reviewed all your flashcards. Check back later or create new ones."
            action={{
              label: "Create Flashcards",
              href: "/flashcards",
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (sessionComplete) {
    return (
      <Card>
        <CardContent className="py-0">
          <EmptyState
            icon={<CelebrationIcon />}
            title="Session Complete!"
            description={`Excellent work! You reviewed ${reviewedCount} flashcard${reviewedCount !== 1 ? "s" : ""} today. Keep up the great study habits!`}
            action={{
              label: "Review More",
              onClick: () => window.location.reload(),
            }}
          />
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentIndex) / dueFlashcards.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Review Flashcards</h1>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} of {dueFlashcards.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <FlashcardFlip
        card={currentCard}
        isFlipped={isFlipped}
        onFlip={handleFlip}
      />

      {isFlipped ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
            {ratingConfig.map((rating) => (
              <Button
                key={rating.key}
                variant={rating.variant}
                onClick={() => handleRating(rating.key)}
                disabled={isSubmitting}
                className="flex-1 md:flex-none min-w-[80px]"
              >
                <span className="hidden md:inline mr-1 opacity-60">[{rating.shortcut}]</span>
                {rating.label}
              </Button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground hidden md:block">
            Keyboard shortcuts: 1-4 to rate, Space to flip
          </p>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Click the card or press <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> to reveal the answer
          </p>
        </div>
      )}
    </div>
  );
};
