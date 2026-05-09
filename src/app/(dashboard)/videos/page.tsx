"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { useVideos } from "@/hooks/api/useVideos";
import { useVideoProgressList } from "@/hooks/api/useVideoProgress";
import { groupVideosByCategory } from "@/lib/videos/group-by-category";
import {
  CategorySection,
  sectionIdFromCategory,
} from "@/components/videos/CategorySection";
import { VideoModal } from "@/components/videos/VideoModal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCloudFrontAssetUrl } from "@/lib/cloudfront-url";
import { formatDurationSeconds } from "@/lib/format-duration";
import type { Video, VideoProgress } from "@/types/video";

const computeProgressPercent = (
  progress: VideoProgress,
  fallbackDuration: number | null | undefined,
): number => {
  if (progress.completed) {
    return 100;
  }

  const duration = progress.duration ?? fallbackDuration ?? 0;
  if (!duration || duration <= 0) {
    return 0;
  }

  const ratio = (progress.progressSeconds / duration) * 100;
  if (!Number.isFinite(ratio)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(ratio)));
};

export default function VideosPage() {
  const { videos, isLoading, isError, error } = useVideos();
  const { progressList } = useVideoProgressList();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredVideos = useMemo(() => {
    if (!normalizedSearchQuery) {
      return videos;
    }

    return videos.filter((video) => {
      const searchableText = [
        video.title,
        video.description,
        video.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [normalizedSearchQuery, videos]);

  const grouped = useMemo(
    () => groupVideosByCategory(filteredVideos),
    [filteredVideos],
  );

  const progressByVideoId = useMemo(() => {
    const map: Record<string, VideoProgress> = {};
    for (const item of progressList) {
      map[item.videoId] = item;
    }
    return map;
  }, [progressList]);

  const continueWatching = (() => {
    if (videos.length === 0 || progressList.length === 0) {
      return null;
    }

    const eligible = progressList
      .filter((item) => !item.completed && item.progressSeconds > 0)
      .sort((a, b) => {
        const timeA = new Date(a.lastWatchedAt).getTime();
        const timeB = new Date(b.lastWatchedAt).getTime();
        const safeA = Number.isFinite(timeA) ? timeA : 0;
        const safeB = Number.isFinite(timeB) ? timeB : 0;
        return safeB - safeA;
      });

    const candidate = eligible.find((item) =>
      videos.some((video) => video.videoId === item.videoId),
    );

    if (!candidate) {
      return null;
    }

    const matchedVideo = videos.find(
      (video) => video.videoId === candidate.videoId,
    );

    if (!matchedVideo) {
      return null;
    }

    return { video: matchedVideo, progress: candidate };
  })();

  const continueWatchingThumbnailUrl = getCloudFrontAssetUrl(
    continueWatching?.video.thumbnailKey ?? undefined,
  );
  const continueWatchingPercent = continueWatching
    ? computeProgressPercent(
        continueWatching.progress,
        continueWatching.video.duration,
      )
    : 0;

  const categoryCount = grouped.length;
  const featuredVideo = videos[0] ?? null;
  const featuredThumbnailUrl = getCloudFrontAssetUrl(
    featuredVideo?.thumbnailKey ?? undefined,
  );
  const featuredDuration = formatDurationSeconds(featuredVideo?.duration);

  const handlePlayVideo = (video: Video) => {
    setActiveVideo(video);
    setModalOpen(true);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleModalOpenChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setActiveVideo(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-12">
      <header className="relative mb-8 overflow-hidden rounded-4xl border border-border/60 bg-card/70 p-5 shadow-sm shadow-black/3 ring-1 ring-white/50 backdrop-blur-xl dark:ring-white/5 md:mb-10 md:p-8 lg:p-10">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-blue-500/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-1/4 size-72 rounded-full bg-cyan-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="space-y-7">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <span className="size-2 rounded-full bg-primary" aria-hidden />
                Video library
              </div>
              <div className="max-w-3xl space-y-4">
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                  AWS lessons, organized for focused playback.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                  Browse clean topic collections, jump into a lesson instantly,
                  and keep recordings easy to scan as your library grows.
                </p>
              </div>
            </div>

            {!isLoading && !isError && videos.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Lessons
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                    {videos.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Topics
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                    {categoryCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Source
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-tight">
                    CloudFront
                  </p>
                </div>
              </div>
            ) : null}

            {!isLoading && !isError && grouped.length > 0 ? (
              <nav
                className="flex flex-wrap gap-2"
                aria-label="Video categories"
              >
                {grouped.map(({ category, videos: sectionVideos }) => (
                  <Link
                    key={category}
                    href={`#${sectionIdFromCategory(category)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {category}
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] tabular-nums text-muted-foreground">
                      {sectionVideos.length}
                    </span>
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>

          {featuredVideo ? (
            <aside className="rounded-[1.75rem] border border-white/40 bg-slate-950 p-3 text-white shadow-2xl shadow-blue-950/20 ring-1 ring-white/10">
              <button
                type="button"
                className="group relative block aspect-video w-full overflow-hidden rounded-[1.35rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                onClick={() => handlePlayVideo(featuredVideo)}
                aria-label={`Play featured lesson: ${featuredVideo.title}`}
              >
                {featuredThumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- CloudFront video thumbnails are user-managed assets.
                  <img
                    src={featuredThumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                  />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.55),transparent_36%),linear-gradient(135deg,#020617,#1d4ed8)]" />
                )}
                <span className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-white text-slate-950 shadow-2xl transition group-hover:scale-110">
                    <svg
                      className="ml-1 size-7"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                  </span>
                </span>
                {featuredDuration ? (
                  <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur-sm">
                    {featuredDuration}
                  </span>
                ) : null}
              </button>
              <div className="space-y-4 p-3 pt-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Featured lesson
                  </p>
                  <h2 className="text-xl font-semibold tracking-tight line-clamp-2">
                    {featuredVideo.title}
                  </h2>
                  {featuredVideo.description ? (
                    <p className="text-sm leading-6 text-slate-300 line-clamp-2">
                      {featuredVideo.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    className="rounded-full bg-white text-slate-950 hover:bg-white/90"
                    onClick={() => handlePlayVideo(featuredVideo)}
                    aria-label={`Play ${featuredVideo.title}`}
                  >
                    Start watching
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="rounded-full text-white hover:bg-white/10 hover:text-white"
                  >
                    <Link
                      href={`/videos/${featuredVideo.videoId}`}
                      aria-label={`Open lesson page for ${featuredVideo.title}`}
                    >
                      View details
                    </Link>
                  </Button>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-8">
          <div className="rounded-4xl border border-border/60 bg-card/60 p-4 md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 rounded-full" />
                  <Skeleton className="h-7 w-48 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-3xl border border-border/60 bg-background/80"
                >
                  <Skeleton className="aspect-video w-full rounded-none" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && continueWatching ? (
        <section
          className="mb-8 overflow-hidden rounded-4xl border border-primary/25 bg-linear-to-br from-primary/12 via-card/70 to-card/55 p-4 shadow-sm shadow-primary/10 ring-1 ring-primary/15 backdrop-blur-sm md:p-5"
          aria-labelledby="continue-watching-heading"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <button
              type="button"
              className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 text-left ring-1 ring-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:w-64 md:shrink-0"
              onClick={() => handlePlayVideo(continueWatching.video)}
              aria-label={`Resume ${continueWatching.video.title}`}
            >
              {continueWatchingThumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- CloudFront video thumbnails are user-managed assets.
                <img
                  src={continueWatchingThumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.5),transparent_40%),linear-gradient(135deg,#020617,#1d4ed8)]" />
              )}
              <span className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-lg shadow-black/30 transition group-hover:scale-110">
                  <svg
                    className="ml-0.5 size-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </span>
              </span>
              <div
                className="absolute inset-x-0 bottom-0 h-1.5 bg-white/15"
                aria-hidden
              >
                <div
                  className="h-full bg-primary transition-[width] duration-300"
                  style={{ width: `${continueWatchingPercent}%` }}
                />
              </div>
            </button>
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <p
                  id="continue-watching-heading"
                  className="text-xs font-semibold uppercase tracking-[0.22em] text-primary"
                >
                  Continue watching
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                  {continueWatching.video.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {continueWatching.video.category} · {continueWatchingPercent}%
                  watched
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => handlePlayVideo(continueWatching.video)}
                  aria-label={`Resume ${continueWatching.video.title}`}
                >
                  Resume lesson
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-full text-foreground hover:bg-foreground/10"
                >
                  <Link
                    href={`/videos/${continueWatching.video.videoId}`}
                    aria-label={`Open lesson page for ${continueWatching.video.title}`}
                  >
                    Open lesson page
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!isLoading && !isError && videos.length > 0 ? (
        <section
          className="mb-8 rounded-4xl border border-border/60 bg-card/60 p-4 shadow-sm shadow-black/3 ring-1 ring-white/40 backdrop-blur-sm dark:ring-white/5 md:p-5"
          aria-labelledby="video-search-heading"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2
                id="video-search-heading"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                Find a lesson
              </h2>
              <p className="text-sm text-muted-foreground">
                Search by lesson title, description, or topic.
              </p>
            </div>
            <p className="text-sm font-medium tabular-nums text-muted-foreground">
              Showing {filteredVideos.length} of {videos.length}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35m1.1-5.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                />
              </svg>
              <Input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search videos..."
                aria-label="Search videos"
                className="h-11 rounded-2xl pl-10"
              />
            </div>
            {searchQuery ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-2xl"
                onClick={handleClearSearch}
                aria-label="Clear video search"
              >
                Clear
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {!isLoading && isError ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-destructive">
              {error ?? "Could not load videos."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              After deploying the updated AppSync schema and DynamoDB resolvers,
              sign in again and refresh this page.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Go to dashboard
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && videos.length === 0 ? (
        <EmptyState
          title="No lesson videos yet"
          description="Upload videos to S3, then createVideo in GraphQL with title, category, and s3Key. Lessons appear here grouped by category."
          action={{
            label: "Back to dashboard",
            href: "/dashboard",
          }}
          className="rounded-4xl border border-dashed border-border bg-card/50"
        />
      ) : null}

      {!isLoading &&
      !isError &&
      videos.length > 0 &&
      filteredVideos.length === 0 ? (
        <EmptyState
          title="No matching videos"
          description="Try a different lesson title, description keyword, or topic name."
          action={{
            label: "Clear search",
            onClick: handleClearSearch,
          }}
          className="rounded-4xl border border-dashed border-border bg-card/50"
        />
      ) : null}

      {!isLoading && !isError && grouped.length > 0 ? (
        <div className="space-y-8 md:space-y-10">
          {grouped.map(({ category, videos: sectionVideos }) => (
            <CategorySection
              key={category}
              category={category}
              videos={sectionVideos}
              onPlayVideo={handlePlayVideo}
              progressByVideoId={progressByVideoId}
            />
          ))}
        </div>
      ) : null}

      <VideoModal
        video={activeVideo}
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
      />
    </div>
  );
}
