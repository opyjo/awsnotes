"use client";

import type { Video, VideoProgress } from "@/types/video";
import { VideoCard } from "@/components/videos/VideoCard";

export interface CategorySectionProps {
  category: string;
  videos: Video[];
  onPlayVideo: (video: Video) => void;
  progressByVideoId?: Record<string, VideoProgress>;
}

export const sectionIdFromCategory = (category: string): string => {
  const slug = category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const hash = Array.from(category).reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000,
    7,
  );

  return `video-category-${slug || "uncategorized"}-${hash.toString(36)}`;
};

export const CategorySection = ({
  category,
  videos,
  onPlayVideo,
  progressByVideoId,
}: CategorySectionProps) => {
  const headingId = sectionIdFromCategory(category);

  return (
    <section
      className="scroll-mt-24 rounded-4xl border border-border/60 bg-card/55 p-4 shadow-sm shadow-black/3 ring-1 ring-white/40 backdrop-blur-sm dark:ring-white/5 md:p-5"
      aria-labelledby={headingId}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/15"
            aria-hidden
          >
            {category.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Topic
            </p>
            <h2
              id={headingId}
              className="mt-0.5 truncate text-lg font-semibold tracking-tight text-foreground md:text-xl"
            >
              {category}
            </h2>
          </div>
        </div>
        <p className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {videos.length} {videos.length === 1 ? "lesson" : "lessons"}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        {videos.map((video, index) => (
          <VideoCard
            key={video.videoId}
            video={video}
            onPlay={onPlayVideo}
            showCategory={false}
            priority={index === 0}
            progress={progressByVideoId?.[video.videoId] ?? null}
          />
        ))}
      </div>
    </section>
  );
};
