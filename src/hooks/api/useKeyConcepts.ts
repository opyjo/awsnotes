import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keyConceptsApi } from '@/lib/aws/appsync';
import { queryKeys } from './query-keys';
import type { KeyConcept, CreateKeyConceptInput, UpdateKeyConceptInput } from '@/types/key-concept';
import { useAuth } from '@/context/AuthContext';

export const useKeyConcepts = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const conceptsQuery = useQuery({
    queryKey: queryKeys.keyConcepts.list(),
    queryFn: () => keyConceptsApi.getKeyConcepts(),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = authLoading || (conceptsQuery.isPending && !conceptsQuery.isError);

  const createConceptMutation = useMutation({
    mutationFn: (input: CreateKeyConceptInput) => keyConceptsApi.createKeyConcept(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.keyConcepts.list() });
      const previous = queryClient.getQueryData<KeyConcept[]>(queryKeys.keyConcepts.list());

      if (previous) {
        const optimistic: KeyConcept = {
          conceptId: `temp-${Date.now()}`,
          ...input,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData<KeyConcept[]>(
          queryKeys.keyConcepts.list(),
          [optimistic, ...previous],
        );
      }

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.keyConcepts.list(), context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keyConcepts.list() });
    },
  });

  const updateConceptMutation = useMutation({
    mutationFn: ({ conceptId, input }: { conceptId: string; input: UpdateKeyConceptInput }) =>
      keyConceptsApi.updateKeyConcept(conceptId, input),
    onMutate: async ({ conceptId, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.keyConcepts.list() });
      const previous = queryClient.getQueryData<KeyConcept[]>(queryKeys.keyConcepts.list());

      if (previous) {
        queryClient.setQueryData<KeyConcept[]>(
          queryKeys.keyConcepts.list(),
          previous.map((c) =>
            c.conceptId === conceptId
              ? { ...c, ...input, updatedAt: new Date().toISOString() }
              : c
          ),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.keyConcepts.list(), context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keyConcepts.list() });
    },
  });

  const deleteConceptMutation = useMutation({
    mutationFn: (conceptId: string) => keyConceptsApi.deleteKeyConcept(conceptId),
    onMutate: async (conceptId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.keyConcepts.list() });
      const previous = queryClient.getQueryData<KeyConcept[]>(queryKeys.keyConcepts.list());

      if (previous) {
        queryClient.setQueryData<KeyConcept[]>(
          queryKeys.keyConcepts.list(),
          previous.filter((c) => c.conceptId !== conceptId),
        );
      }

      return { previous };
    },
    onError: (_err, _conceptId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.keyConcepts.list(), context.previous);
      }
    },
    onSuccess: (_, conceptId) => {
      queryClient.removeQueries({ queryKey: queryKeys.keyConcepts.detail(conceptId) });
    },
  });

  return {
    concepts: conceptsQuery.data ?? [],
    isLoading,
    isFetching: conceptsQuery.isFetching,
    isError: conceptsQuery.isError,
    error: conceptsQuery.error?.message ?? null,

    createConcept: createConceptMutation.mutateAsync,
    updateConcept: (conceptId: string, input: UpdateKeyConceptInput) =>
      updateConceptMutation.mutateAsync({ conceptId, input }),
    deleteConcept: deleteConceptMutation.mutateAsync,

    isCreating: createConceptMutation.isPending,
    isUpdating: updateConceptMutation.isPending,
    isDeleting: deleteConceptMutation.isPending,

    refetch: conceptsQuery.refetch,
  };
};
