"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/types/flashcard";

interface FlashcardFlipProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

export const FlashcardFlip = ({
  card,
  isFlipped,
  onFlip,
}: FlashcardFlipProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isFlipped !== undefined) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isFlipped]);

  return (
    <div className="flex justify-center w-full">
      <div
        className="perspective w-full max-w-[600px] cursor-pointer group mx-auto"
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
            "relative w-full aspect-[4/3] min-h-[400px] transition-transform duration-700 ease-in-out preserve-3d",
            isFlipped && "rotate-y-180",
            "group-hover:scale-[1.02] transition-all duration-300"
          )}
        >
          {/* Front - Question */}
          <div
            className={cn(
              "absolute inset-0 backface-hidden",
              "rounded-2xl border-2 border-border/50 bg-gradient-to-br from-card via-card to-muted/30",
              "shadow-2xl shadow-primary/5",
              "flex flex-col items-center justify-center p-6 md:p-8",
              "backdrop-blur-sm",
              "transition-all duration-300"
            )}
          >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-50" />
            
            <div className="relative z-10 w-full max-w-[500px] text-center space-y-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
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
                Question
              </div>

              {/* Question Text */}
              <div className="text-xl md:text-2xl font-bold text-foreground leading-relaxed px-4">
                {card.front}
              </div>

              {/* Hint */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <svg
                  className="w-3.5 h-3.5 animate-pulse"
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
                <span>Click or press Space to reveal answer</span>
              </div>
            </div>
          </div>

          {/* Back - Answer */}
          <div
            className={cn(
              "absolute inset-0 backface-hidden rotate-y-180",
              "rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10",
              "shadow-2xl shadow-primary/10",
              "flex flex-col items-center justify-center p-6 md:p-8",
              "backdrop-blur-sm",
              "transition-all duration-300"
            )}
          >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-60" />
            
            <div className="relative z-10 w-full max-w-[500px] text-center space-y-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Answer
              </div>

              {/* Answer Text */}
              <div className="text-lg md:text-xl font-semibold text-foreground leading-relaxed px-4">
                {card.back}
              </div>

              {/* Hint */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <span>Rate your recall below</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
