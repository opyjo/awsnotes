import { useQuery } from '@tanstack/react-query';
import { notesApi } from '@/lib/aws/appsync';
import { queryKeys } from './query-keys';
import { useAuth } from '@/context/AuthContext';

export const useNote = (noteId: string) => {
  const { user } = useAuth();

  const noteQuery = useQuery({
    queryKey: queryKeys.notes.detail(noteId),
    queryFn: () => notesApi.getNote(noteId),
    enabled: !!user && !!noteId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    note: noteQuery.data,
    isLoading: noteQuery.isLoading,
    isError: noteQuery.isError,
    error: noteQuery.error?.message ?? null,
    refetch: noteQuery.refetch,
  };
};
