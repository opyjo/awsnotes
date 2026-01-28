"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Flashcard, CreateFlashcardInput } from "@/types/flashcard";
import { flashcardsApi } from "@/lib/aws/appsync";
import { useAuth } from "./AuthContext";

interface FlashcardsContextType {
  flashcards: Flashcard[];
  dueFlashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  fetchFlashcards: (deckId: string) => Promise<void>;
  fetchDueFlashcards: () => Promise<void>;
  createFlashcard: (input: CreateFlashcardInput) => Promise<Flashcard>;
  reviewFlashcard: (cardId: string, quality: number) => Promise<Flashcard>;
}

const FlashcardsContext = createContext<FlashcardsContextType | undefined>(
  undefined
);

export const FlashcardsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchFlashcards = async (deckId: string) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedCards = await flashcardsApi.getFlashcards(deckId);
      setFlashcards(fetchedCards);
    } catch (err: any) {
      setError(err.message || "Failed to fetch flashcards");
      console.error("Error fetching flashcards:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDueFlashcards = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedCards = await flashcardsApi.getDueFlashcards();
      setDueFlashcards(fetchedCards);
    } catch (err: any) {
      setError(err.message || "Failed to fetch due flashcards");
      console.error("Error fetching due flashcards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDueFlashcards();
    }
  }, [user]);

  const createFlashcard = async (
    input: CreateFlashcardInput
  ): Promise<Flashcard> => {
    try {
      const newCard = await flashcardsApi.createFlashcard(input);
      setFlashcards((prev) => [newCard, ...prev]);
      return newCard;
    } catch (err: any) {
      setError(err.message || "Failed to create flashcard");
      throw err;
    }
  };

  const reviewFlashcard = async (
    cardId: string,
    quality: number
  ): Promise<Flashcard> => {
    try {
      const updatedCard = await flashcardsApi.reviewFlashcard(cardId, quality);
      setFlashcards((prev) =>
        prev.map((card) => (card.cardId === cardId ? updatedCard : card))
      );
      setDueFlashcards((prev) => prev.filter((card) => card.cardId !== cardId));
      return updatedCard;
    } catch (err: any) {
      setError(err.message || "Failed to review flashcard");
      throw err;
    }
  };

  return (
    <FlashcardsContext.Provider
      value={{
        flashcards,
        dueFlashcards,
        loading,
        error,
        fetchFlashcards,
        fetchDueFlashcards,
        createFlashcard,
        reviewFlashcard,
      }}
    >
      {children}
    </FlashcardsContext.Provider>
  );
};

export const useFlashcards = () => {
  const context = useContext(FlashcardsContext);
  if (context === undefined) {
    throw new Error("useFlashcards must be used within a FlashcardsProvider");
  }
  return context;
};
