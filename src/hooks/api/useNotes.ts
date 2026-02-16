import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/lib/aws/appsync';
import { queryKeys } from './query-keys';
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/types/note';
import { useAuth } from '@/context/AuthContext';

export const useNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query: Get all notes
  const notesQuery = useQuery({
    queryKey: queryKeys.notes.list(),
    queryFn: () => notesApi.getNotes(),
    enabled: !!user, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation: Create note
  const createNoteMutation = useMutation({
    mutationFn: (input: CreateNoteInput) => notesApi.createNote(input),
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.list() });

      // Snapshot previous value
      const previousNotes = queryClient.getQueryData<Note[]>(queryKeys.notes.list());

      // Optimistically update
      if (previousNotes) {
        const optimisticNote: Note = {
          noteId: `temp-${Date.now()}`,
          title: input.title,
          content: input.content,
          category: input.category,
          images: input.images || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueryData<Note[]>(
          queryKeys.notes.list(),
          [...previousNotes, optimisticNote].sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
          )
        );
      }

      return { previousNotes };
    },
    onError: (err, input, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes.list(), context.previousNotes);
      }
    },
    onSuccess: (newNote) => {
      // Update cache with real server data
      queryClient.setQueryData<Note[]>(
        queryKeys.notes.list(),
        (old) => {
          if (!old) return [newNote];
          const withoutTemp = old.filter((n) => !n.noteId.startsWith('temp-'));
          return [...withoutTemp, newNote].sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
          );
        }
      );

      // Invalidate to refetch (ensures consistency)
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list() });
    },
  });

  // Mutation: Update note
  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: UpdateNoteInput }) =>
      notesApi.updateNote(noteId, input),
    onMutate: async ({ noteId, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.list() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.detail(noteId) });

      const previousNotes = queryClient.getQueryData<Note[]>(queryKeys.notes.list());
      const previousNote = queryClient.getQueryData<Note>(queryKeys.notes.detail(noteId));

      // Optimistically update list
      if (previousNotes) {
        queryClient.setQueryData<Note[]>(
          queryKeys.notes.list(),
          previousNotes.map((note) =>
            note.noteId === noteId
              ? { ...note, ...input, updatedAt: new Date().toISOString() }
              : note
          )
        );
      }

      // Optimistically update detail
      if (previousNote) {
        queryClient.setQueryData<Note>(queryKeys.notes.detail(noteId), {
          ...previousNote,
          ...input,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousNotes, previousNote };
    },
    onError: (err, { noteId }, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes.list(), context.previousNotes);
      }
      if (context?.previousNote) {
        queryClient.setQueryData(queryKeys.notes.detail(noteId), context.previousNote);
      }
    },
    onSuccess: (updatedNote, { noteId }) => {
      // Update both list and detail caches
      queryClient.setQueryData<Note[]>(
        queryKeys.notes.list(),
        (old) => old?.map((n) => (n.noteId === noteId ? updatedNote : n))
      );
      queryClient.setQueryData(queryKeys.notes.detail(noteId), updatedNote);
    },
  });

  // Mutation: Delete note
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesApi.deleteNote(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.list() });

      const previousNotes = queryClient.getQueryData<Note[]>(queryKeys.notes.list());

      if (previousNotes) {
        queryClient.setQueryData<Note[]>(
          queryKeys.notes.list(),
          previousNotes.filter((n) => n.noteId !== noteId)
        );
      }

      return { previousNotes };
    },
    onError: (err, noteId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes.list(), context.previousNotes);
      }
    },
    onSuccess: (_, noteId) => {
      // Remove from detail cache too
      queryClient.removeQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
  });

  // Mutation: Update category for multiple notes
  const updateNotesCategoryMutation = useMutation({
    mutationFn: async ({ oldCategory, newCategory }: { oldCategory: string; newCategory: string }) => {
      const notes = queryClient.getQueryData<Note[]>(queryKeys.notes.list()) || [];
      const notesToUpdate = notes.filter(
        (note) => note.category?.toLowerCase() === oldCategory.toLowerCase()
      );

      const updatePromises = notesToUpdate.map((note) =>
        notesApi.updateNote(note.noteId, {
          title: note.title,
          content: note.content,
          category: newCategory,
        })
      );

      return Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list() });
    },
  });

  return {
    // Data
    notes: notesQuery.data ?? [],

    // Loading states
    isLoading: notesQuery.isLoading,
    isFetching: notesQuery.isFetching,
    isError: notesQuery.isError,
    error: notesQuery.error?.message ?? null,

    // Mutations
    createNote: createNoteMutation.mutateAsync,
    updateNote: (noteId: string, input: UpdateNoteInput) =>
      updateNoteMutation.mutateAsync({ noteId, input }),
    deleteNote: deleteNoteMutation.mutateAsync,
    updateNotesCategory: (oldCategory: string, newCategory: string) =>
      updateNotesCategoryMutation.mutateAsync({ oldCategory, newCategory }),

    // Mutation states
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,

    // Refetch
    refetch: notesQuery.refetch,
  };
};
