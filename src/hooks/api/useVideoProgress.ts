import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { videoProgressApi } from "@/lib/aws/appsync";
import { queryKeys } from "./query-keys";
import { useAuth } from "@/context/AuthContext";
import type {
  SaveVideoProgressInput,
  VideoProgress,
} from "@/types/video";

export const useVideoProgressList = () => {
  const { user, loading: authLoading } = useAuth();

  const progressQuery = useQuery({
    queryKey: queryKeys.videoProgress.list(),
    queryFn: () => videoProgressApi.getVideoProgressList(),
    enabled: !!user && !authLoading,
    staleTime: 60 * 1000,
  });

  const isLoading =
    authLoading || (progressQuery.isPending && !progressQuery.isError);

  return {
    progressList: progressQuery.data ?? [],
    isLoading,
    isFetching: progressQuery.isFetching,
    isError: progressQuery.isError,
    error: progressQuery.error?.message ?? null,
    refetch: progressQuery.refetch,
  };
};

export const useVideoProgress = (videoId: string) => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const enabled = !!user && !authLoading && Boolean(videoId);

  const progressQuery = useQuery({
    queryKey: queryKeys.videoProgress.detail(videoId),
    queryFn: () => videoProgressApi.getVideoProgress(videoId),
    enabled,
    staleTime: 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: (input: SaveVideoProgressInput) =>
      videoProgressApi.saveVideoProgress(input),
    onSuccess: (saved) => {
      queryClient.setQueryData<VideoProgress | null>(
        queryKeys.videoProgress.detail(saved.videoId),
        saved,
      );

      queryClient.setQueryData<VideoProgress[] | undefined>(
        queryKeys.videoProgress.list(),
        (old) => {
          if (!old) {
            return [saved];
          }

          const exists = old.some((item) => item.videoId === saved.videoId);
          if (exists) {
            return old.map((item) =>
              item.videoId === saved.videoId ? saved : item,
            );
          }

          return [...old, saved];
        },
      );
    },
  });

  return {
    progress: progressQuery.data ?? null,
    isLoading:
      authLoading || (enabled && progressQuery.isPending && !progressQuery.isError),
    isFetching: progressQuery.isFetching,
    isError: progressQuery.isError,
    error: progressQuery.error?.message ?? null,
    saveProgress: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error?.message ?? null,
  };
};
