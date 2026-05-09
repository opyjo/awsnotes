import { useQuery } from "@tanstack/react-query";
import { videosApi } from "@/lib/aws/appsync";
import { queryKeys } from "./query-keys";
import { useAuth } from "@/context/AuthContext";

export const useVideos = () => {
  const { user, loading: authLoading } = useAuth();

  const videosQuery = useQuery({
    queryKey: queryKeys.videos.list(),
    queryFn: () => videosApi.getVideos(),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    authLoading || (videosQuery.isPending && !videosQuery.isError);

  return {
    videos: videosQuery.data ?? [],
    isLoading,
    isFetching: videosQuery.isFetching,
    isError: videosQuery.isError,
    error: videosQuery.error?.message ?? null,
    refetch: videosQuery.refetch,
  };
};
