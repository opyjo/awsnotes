"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useFlashcards } from "@/context/FlashcardsContext";
import { FlashcardFlip } from "./FlashcardFlip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  EmptyState,
  CelebrationIcon,
  EmptyFlashcardsIcon,
} from "@/components/ui/empty-state";
import { FlashcardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getQualityFromRating } from "@/lib/spaced-repetition/sm2";
import { cn } from "@/lib/utils";

type Rating = "again" | "hard" | "good" | "easy";

const ratingConfig: {
  key: Rating;
  label: string;
  shortcut: string;
  variant: "destructive" | "outline" | "default" | "secondary";
  icon: ReactNode;
  color: string;
}[] = [
  {
    key: "again",
    label: "Again",
    shortcut: "1",
    variant: "destructive",
    color: "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
  {
    key: "hard",
    label: "Hard",
    shortcut: "2",
    variant: "outline",
    color: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  },
  {
    key: "good",
    label: "Good",
    shortcut: "3",
    variant: "default",
    color: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    key: "easy",
    label: "Easy",
    shortcut: "4",
    variant: "secondary",
    color: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
];

export const FlashcardReview = () => {
  const { dueFlashcards, reviewFlashcard, fetchDueFlashcards, loading } =
    useFlashcards();
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

  const handleRating = useCallback(
    async (rating: Rating) => {
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
    },
    [
      currentCard,
      currentIndex,
      dueFlashcards.length,
      reviewFlashcard,
      reviewedCount,
      isSubmitting,
      addToast,
    ],
  );

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
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
      <Card className="border-2 border-dashed">
        <CardContent className="py-12">
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
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-12">
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

  const progress = ((currentIndex + 1) / dueFlashcards.length) * 100;
  const remaining = dueFlashcards.length - currentIndex - 1;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Review Flashcards
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Study smarter with spaced repetition
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {currentIndex + 1}
            </div>
            <div className="text-xs text-muted-foreground">
              of {dueFlashcards.length}
            </div>
          </div>
        </div>

        {/* Modern Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full transition-all duration-500 ease-out shadow-lg shadow-primary/20"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
          {remaining > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {remaining} card{remaining !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>
      </div>

      {/* Flashcard */}
      <div className="animate-slide-in-up flex justify-center">
        <FlashcardFlip
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </div>

      {/* Rating Buttons */}
      {isFlipped ? (
        <div className="space-y-6 animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {ratingConfig.map((rating) => (
              <Button
                key={rating.key}
                variant={rating.variant}
                onClick={() => handleRating(rating.key)}
                disabled={isSubmitting}
                className={cn(
                  "h-auto py-6 px-4 flex flex-col items-center gap-3",
                  "border-2 transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  rating.color
                )}
              >
                <div className="flex items-center gap-2">
                  {rating.icon}
                  <span className="font-semibold text-base">{rating.label}</span>
                </div>
                <kbd className="px-2 py-1 bg-background/50 rounded text-xs font-mono border border-border/50">
                  {rating.shortcut}
                </kbd>
              </Button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">1-4</kbd> to rate,{" "}
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Space</kbd> to flip
          </p>
        </div>
      ) : (
        <div className="text-center space-y-2 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <svg
              className="w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
            <span className="text-sm text-muted-foreground">
              Click the card or press <kbd className="px-1.5 py-0.5 bg-background rounded text-xs font-mono border border-border/50">Space</kbd> to reveal the answer
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
