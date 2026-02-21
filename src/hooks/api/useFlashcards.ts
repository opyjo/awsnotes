import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashcardsApi } from '@/lib/aws/appsync';
import { queryKeys } from './query-keys';
import type { Flashcard, CreateFlashcardInput } from '@/types/flashcard';
import { useAuth } from '@/context/AuthContext';

export const useFlashcards = (deckId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query: Get flashcards by deck
  const flashcardsQuery = useQuery({
    queryKey: deckId ? queryKeys.flashcards.byDeck(deckId) : queryKeys.flashcards.all,
    queryFn: () => (deckId ? flashcardsApi.getFlashcards(deckId) : Promise.resolve([])),
    enabled: !!user && !!deckId,
    staleTime: 2 * 60 * 1000, // 2 minutes (flashcards change more frequently)
  });

  // Query: Get due flashcards
  const dueFlashcardsQuery = useQuery({
    queryKey: queryKeys.flashcards.due(),
    queryFn: () => flashcardsApi.getDueFlashcards(),
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute (due list changes after reviews)
  });

  // Mutation: Create flashcard
  const createFlashcardMutation = useMutation({
    mutationFn: (input: CreateFlashcardInput) => flashcardsApi.createFlashcard(input),
    onSuccess: (newCard, variables) => {
      // Invalidate the deck's flashcards
      if (variables.deckId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.flashcards.byDeck(variables.deckId),
        });
      }
    },
  });

  // Mutation: Update flashcard (e.g. move to a different deck/group)
  const updateFlashcardMutation = useMutation({
    mutationFn: ({
      cardId,
      input,
    }: {
      cardId: string;
      input: { deckId?: string; front?: string; back?: string };
    }) => flashcardsApi.updateFlashcard(cardId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.all });
    },
  });

  // Mutation: Review flashcard
  const reviewFlashcardMutation = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: string; quality: number }) =>
      flashcardsApi.reviewFlashcard(cardId, quality),
    onSuccess: (updatedCard, { cardId }) => {
      // Update all relevant caches
      queryClient.invalidateQueries({ queryKey: queryKeys.flashcards.all });

      // Remove from due list if it was there
      queryClient.setQueryData<Flashcard[]>(queryKeys.flashcards.due(), (old) =>
        old?.filter((card) => card.cardId !== cardId)
      );
    },
  });

  return {
    // Data
    flashcards: flashcardsQuery.data ?? [],
    dueFlashcards: dueFlashcardsQuery.data ?? [],

    // Loading states
    isLoading: flashcardsQuery.isLoading || dueFlashcardsQuery.isLoading,
    isError: flashcardsQuery.isError || dueFlashcardsQuery.isError,
    error: flashcardsQuery.error?.message ?? dueFlashcardsQuery.error?.message ?? null,

    // Mutations
    createFlashcard: createFlashcardMutation.mutateAsync,
    updateFlashcard: (cardId: string, input: { deckId?: string; front?: string; back?: string }) =>
      updateFlashcardMutation.mutateAsync({ cardId, input }),
    reviewFlashcard: (cardId: string, quality: number) =>
      reviewFlashcardMutation.mutateAsync({ cardId, quality }),

    // Refetch
    refetchFlashcards: flashcardsQuery.refetch,
    refetchDueFlashcards: dueFlashcardsQuery.refetch,
  };
};
