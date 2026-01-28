"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/types/flashcard";

interface FlashcardCardProps {
  card: Flashcard;
  onFlip?: () => void;
  showBack?: boolean;
}

export const FlashcardCard = ({
  card,
  onFlip,
  showBack = false,
}: FlashcardCardProps) => {
  return (
    <Card
      className="min-h-[300px] md:min-h-[400px] cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
      onClick={onFlip}
    >
      <CardContent className="flex h-full items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <div className="text-base md:text-lg font-semibold mb-4 text-muted-foreground">
            {showBack ? "Answer" : "Question"}
          </div>
          <div className="text-lg md:text-xl">
            {showBack ? card.back : card.front}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
