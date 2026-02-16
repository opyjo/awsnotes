import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '@/lib/aws/appsync';
import { queryKeys } from './query-keys';
import type { Group, CreateGroupInput, UpdateGroupInput } from '@/types/group';
import { useAuth } from '@/context/AuthContext';

export const useGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query: Get all groups
  const groupsQuery = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: () => groupsApi.getGroups(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation: Create group
  const createGroupMutation = useMutation({
    mutationFn: (input: CreateGroupInput) => groupsApi.createGroup(input),
    onSuccess: (newGroup) => {
      queryClient.setQueryData<Group[]>(queryKeys.groups.list(), (old) => {
        if (!old) return [newGroup];
        return [...old, newGroup].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
      });
    },
  });

  // Mutation: Update group
  const updateGroupMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGroupInput }) =>
      groupsApi.updateGroup(id, input),
    onSuccess: (updatedGroup) => {
      if (updatedGroup) {
        queryClient.setQueryData<Group[]>(
          queryKeys.groups.list(),
          (old) => old?.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
        );
      }
    },
  });

  // Mutation: Delete group
  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => groupsApi.deleteGroup(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Group[]>(
        queryKeys.groups.list(),
        (old) => old?.filter((g) => g.id !== id)
      );
    },
  });

  const groups = groupsQuery.data ?? [];

  return {
    // Data
    groups,

    // Loading states
    isLoading: groupsQuery.isLoading,
    isFetching: groupsQuery.isFetching,
    isError: groupsQuery.isError,
    error: groupsQuery.error?.message ?? null,

    // Mutations
    createGroup: createGroupMutation.mutateAsync,
    updateGroup: (id: string, input: UpdateGroupInput) =>
      updateGroupMutation.mutateAsync({ id, input }),
    deleteGroup: deleteGroupMutation.mutateAsync,

    // Helper functions (in-memory lookups)
    getGroupByName: (name: string) =>
      groups.find((g) => g.name.toLowerCase() === name.toLowerCase()),
    getGroupById: (id: string) => groups.find((g) => g.id === id),

    // Refetch
    refetch: groupsQuery.refetch,
  };
};
