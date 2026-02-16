import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/lib/aws/appsync';
import { queryKeys } from './query-keys';
import { useAuth } from '@/context/AuthContext';
import type { Note } from '@/types/note';

export const useNote = (noteId: string) => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const noteQuery = useQuery({
    queryKey: queryKeys.notes.detail(noteId),
    queryFn: () => notesApi.getNote(noteId),
    enabled: !!user && !!noteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Initialize from the notes list cache if available
    initialData: () => {
      const notes = queryClient.getQueryData<Note[]>(queryKeys.notes.list());
      return notes?.find(n => n.noteId === noteId);
    },
    // Mark initial data as stale so it refetches in the background
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(queryKeys.notes.list())?.dataUpdatedAt;
    },
  });

  // isLoading should be true while auth is loading OR while the query is fetching with no data
  const isLoading = authLoading || noteQuery.isLoading;

  return {
    note: noteQuery.data ?? null,
    isLoading,
    isError: noteQuery.isError,
    error: noteQuery.error?.message ?? null,
    refetch: noteQuery.refetch,
  };
};
