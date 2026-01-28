export interface Flashcard {
  cardId: string;
  deckId: string;
  front: string;
  back: string;
  noteId?: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  createdAt: string;
}

export interface CreateFlashcardInput {
  deckId: string;
  front: string;
  back: string;
  noteId?: string;
}

export interface FlashcardDeck {
  deckId: string;
  name: string;
  description?: string;
  cardCount: number;
  createdAt: string;
}
