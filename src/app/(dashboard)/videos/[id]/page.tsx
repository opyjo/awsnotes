"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { videosApi } from "@/lib/aws/appsync";
import { queryKeys } from "@/hooks/api/query-keys";
import { useAuth } from "@/context/AuthContext";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { getCloudFrontAssetUrl } from "@/lib/cloudfront-url";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const id = typeof params.id === "string" ? params.id : "";
  const canFetchVideo = Boolean(id) && Boolean(user) && !authLoading;

  const videoQuery = useQuery({
    queryKey: queryKeys.videos.detail(id),
    queryFn: () => videosApi.getVideo(id),
    enabled: canFetchVideo,
  });

  const category = videoQuery.data?.category;

  const categoryQuery = useQuery({
    queryKey: queryKeys.videos.byCategory(category ?? ""),
    queryFn: () => videosApi.getVideosByCategory(category!),
    enabled: Boolean(category) && Boolean(user) && !authLoading,
  });

  const { previous, next } = useMemo(() => {
    const list = categoryQuery.data ?? [];
    const idx = list.findIndex((v) => v.videoId === id);

    if (idx < 0) {
      return { previous: null, next: null };
    }

    return {
      previous: idx > 0 ? list[idx - 1] : null,
      next: idx < list.length - 1 ? list[idx + 1] : null,
    };
  }, [categoryQuery.data, id]);

  const streamUrl = videoQuery.data
    ? getCloudFrontAssetUrl(videoQuery.data.s3Key)
    : null;

  const handlePreviousLesson = () => {
    if (!previous) {
      return;
    }

    router.push(`/videos/${previous.videoId}`);
  };

  const handleNextLesson = () => {
    if (!next) {
      return;
    }

    router.push(`/videos/${next.videoId}`);
  };

  if (!id) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Invalid lesson</CardTitle>
            <CardDescription>
              Missing video identifier in the URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/videos">Back to lessons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || (canFetchVideo && videoQuery.isPending)) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Please sign in to watch lesson videos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Go to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (videoQuery.isError || !videoQuery.data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Lesson not found</CardTitle>
            <CardDescription>
              This lesson may have been removed or the ID is incorrect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/videos">Back to lessons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const video = videoQuery.data;

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8 pb-24 md:pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/videos" aria-label="Back to all lessons">
            ← All lessons
          </Link>
        </Button>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {video.category}
        </span>
      </div>

      {streamUrl ? (
        <VideoPlayer url={streamUrl} title={video.title} />
      ) : (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">
            Configure{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              NEXT_PUBLIC_CLOUDFRONT_URL
            </code>{" "}
            to stream this lesson.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{video.title}</h1>
        {video.description ? (
          <p className="leading-relaxed text-muted-foreground">
            {video.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          disabled={!previous}
          onClick={handlePreviousLesson}
          aria-label="Previous lesson in this category"
        >
          Previous lesson
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!next}
          onClick={handleNextLesson}
          aria-label="Next lesson in this category"
        >
          Next lesson
        </Button>
      </div>
    </div>
  );
}
