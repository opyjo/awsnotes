"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/types/flashcard";

interface FlashcardFlipProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

export const FlashcardFlip = ({ card, isFlipped, onFlip }: FlashcardFlipProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isFlipped !== undefined) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isFlipped]);

  return (
    <div
      className="perspective w-full cursor-pointer"
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? "Show question" : "Show answer"}
    >
      <div
        className={cn(
          "relative w-full min-h-[300px] md:min-h-[400px] transition-transform duration-500 preserve-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front - Question */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden",
            "rounded-lg border bg-card shadow-lg",
            "flex flex-col items-center justify-center p-6 md:p-8"
          )}
        >
          <div className="text-sm font-medium text-muted-foreground mb-4">
            Question
          </div>
          <div className="text-xl md:text-2xl text-center font-medium">
            {card.front}
          </div>
          <div className="absolute bottom-4 text-sm text-muted-foreground">
            Click to reveal answer
          </div>
        </div>

        {/* Back - Answer */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rotate-y-180",
            "rounded-lg border bg-card shadow-lg",
            "flex flex-col items-center justify-center p-6 md:p-8"
          )}
        >
          <div className="text-sm font-medium text-muted-foreground mb-4">
            Answer
          </div>
          <div className="text-xl md:text-2xl text-center font-medium">
            {card.back}
          </div>
          <div className="absolute bottom-4 text-sm text-muted-foreground">
            Rate your recall below
          </div>
        </div>
      </div>
    </div>
  );
};
