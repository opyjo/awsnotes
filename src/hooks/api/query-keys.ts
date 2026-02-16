export const queryKeys = {
  notes: {
    all: ['notes'] as const,
    lists: () => [...queryKeys.notes.all, 'list'] as const,
    list: () => [...queryKeys.notes.lists()] as const,
    details: () => [...queryKeys.notes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.notes.details(), id] as const,
  },
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: () => [...queryKeys.groups.lists()] as const,
  },
  flashcards: {
    all: ['flashcards'] as const,
    lists: () => [...queryKeys.flashcards.all, 'list'] as const,
    byDeck: (deckId: string) => [...queryKeys.flashcards.lists(), { deckId }] as const,
    due: () => [...queryKeys.flashcards.lists(), 'due'] as const,
  },
} as const;
