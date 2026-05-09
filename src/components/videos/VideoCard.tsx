"use client";

import Link from "next/link";
import type { Video, VideoProgress } from "@/types/video";
import { Card, CardContent } from "@/components/ui/card";
import { getCloudFrontAssetUrl } from "@/lib/cloudfront-url";
import { formatDurationSeconds } from "@/lib/format-duration";
import { cn } from "@/lib/utils";

export type VideoCardVariant = "auto" | "vertical";

export interface VideoCardProps {
  video: Video;
  onPlay: (video: Video) => void;
  className?: string;
  /** When false, hides the category chip (e.g. inside a category section). Default true. */
  showCategory?: boolean;
  priority?: boolean;
  progress?: VideoProgress | null;
  /** Card layout variant. "auto" switches to horizontal at sm breakpoint. "vertical" stays vertical. Default "auto". */
  variant?: VideoCardVariant;
}

const computeProgressPercent = (
  progress: VideoProgress | null | undefined,
  fallbackDuration: number | null | undefined,
): number => {
  if (!progress) {
    return 0;
  }

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

export const VideoCard = ({
  video,
  onPlay,
  className,
  showCategory = true,
  priority = false,
  progress = null,
  variant = "auto",
}: VideoCardProps) => {
  const isVertical = variant === "vertical";
  const thumbUrl = getCloudFrontAssetUrl(video.thumbnailKey ?? undefined);
  const durationLabel = formatDurationSeconds(video.duration ?? undefined);
  const progressPercent = computeProgressPercent(progress, video.duration);
  const hasStartedProgress = Boolean(progress) && progressPercent > 0;
  const isCompleted = Boolean(progress?.completed) || progressPercent >= 100;
  const playLabel = isCompleted
    ? "Replay"
    : hasStartedProgress
      ? "Resume"
      : "Play";

  const handlePlayClick = () => {
    onPlay(video);
  };

  return (
    <Card
      className={cn(
        "group/card overflow-hidden rounded-2xl border-border/60 bg-background/80 shadow-sm shadow-black/3 ring-1 ring-white/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/10 focus-within:ring-2 focus-within:ring-primary/35 dark:ring-white/5",
        className,
      )}
    >
      <CardContent
        className={cn(
          "flex flex-col p-0",
          !isVertical && "sm:flex-row",
        )}
      >
        <button
          type="button"
          aria-label={`Play lesson: ${video.title}`}
          className={cn(
            "relative block w-full cursor-pointer text-left outline-none",
            !isVertical && "sm:w-48 sm:shrink-0 md:w-56",
          )}
          onClick={handlePlayClick}
        >
          <div
            className={cn(
              "relative aspect-video w-full overflow-hidden bg-slate-950",
              !isVertical && "sm:aspect-auto sm:h-full",
            )}
          >
            {thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- CloudFront video thumbnails are user-managed assets.
              <img
                src={thumbUrl}
                alt=""
                className="h-full w-full object-cover opacity-95 transition duration-300 group-hover/card:scale-105 group-hover/card:opacity-100"
                loading={priority ? "eager" : "lazy"}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_38%),linear-gradient(135deg,rgba(15,23,42,1),rgba(30,64,175,0.7))]">
                <svg
                  className="size-10 text-white/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.752 11.168l-5.197-3.027A1 1 0 008 9.027v6.946a1 1 0 001.555.832l5.197-3.027a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            )}
            <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
            {showCategory ? (
              <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/90 px-2.5 py-0.5 text-[0.7rem] font-semibold text-slate-950 shadow-sm backdrop-blur-md">
                {video.category}
              </span>
            ) : null}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-lg shadow-black/25 ring-1 ring-white/70 transition duration-200 group-hover/card:scale-110 group-focus-within/card:scale-110">
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
            {durationLabel ? (
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums text-white shadow-sm backdrop-blur-sm">
                {durationLabel}
              </span>
            ) : null}
            {isCompleted ? (
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[0.65rem] font-semibold text-white shadow-sm backdrop-blur-sm">
                <svg
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Watched
              </span>
            ) : null}
            {hasStartedProgress && !isCompleted ? (
              <div
                className="absolute inset-x-0 bottom-0 h-1 bg-white/20"
                aria-hidden
              >
                <div
                  className="h-full bg-primary transition-[width] duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            ) : null}
          </div>
        </button>
        <div
          className={cn(
            "flex flex-1 flex-col gap-2",
            isVertical ? "p-3" : "p-4 md:gap-2.5 md:p-5",
          )}
        >
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground line-clamp-2 md:text-base">
              {video.title}
            </h3>
            {video.description ? (
              <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2 md:text-sm">
                {video.description}
              </p>
            ) : null}
          </div>
          {hasStartedProgress && !isCompleted ? (
            <p className="text-[0.7rem] font-medium text-muted-foreground">
              {progressPercent}% watched
            </p>
          ) : null}
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={handlePlayClick}
              aria-label={`${playLabel} ${video.title}`}
            >
              {playLabel}
            </button>
            <Link
              href={`/videos/${video.videoId}`}
              className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-primary underline-offset-4 transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Open lesson page for ${video.title}`}
            >
              Details
              <span aria-hidden className="text-[0.65rem] opacity-80">
                →
              </span>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
