"use client";

import { FlashcardsProvider } from "@/context/FlashcardsContext";
import { FlashcardReview } from "@/components/flashcards/FlashcardReview";

export default function ReviewPage() {
  return (
    <FlashcardsProvider>
      <FlashcardReview />
    </FlashcardsProvider>
  );
}
