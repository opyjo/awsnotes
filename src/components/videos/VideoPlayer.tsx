"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => (
    <div
      className="flex aspect-video w-full items-center justify-center rounded-[1.25rem] bg-muted text-sm text-muted-foreground"
      aria-hidden
    >
      Loading player…
    </div>
  ),
});

export interface VideoPlayerProps {
  url: string;
  title: string;
  className?: string;
  onProgress?: (playedSeconds: number) => void;
  onDuration?: (durationSeconds: number) => void;
  onEnded?: () => void;
  /** Throttle for native onTimeUpdate readouts in milliseconds. Default 1000. */
  progressIntervalMs?: number;
}

export const VideoPlayer = ({
  url,
  title,
  className,
  onProgress,
  onDuration,
  onEnded,
  progressIntervalMs = 1000,
}: VideoPlayerProps) => {
  const lastEmittedAtRef = useRef(0);

  if (!url) {
    return null;
  }

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!onProgress) {
      return;
    }

    const now = Date.now();
    if (now - lastEmittedAtRef.current < progressIntervalMs) {
      return;
    }
    lastEmittedAtRef.current = now;

    const target = event.currentTarget;
    if (Number.isFinite(target.currentTime)) {
      onProgress(target.currentTime);
    }
  };

  const handleDurationChange = (
    event: React.SyntheticEvent<HTMLVideoElement>,
  ) => {
    if (!onDuration) {
      return;
    }
    const target = event.currentTarget;
    if (Number.isFinite(target.duration) && target.duration > 0) {
      onDuration(target.duration);
    }
  };

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-[1.25rem] bg-black shadow-lg shadow-black/10 ring-1 ring-black/10",
        className,
      )}
      role="region"
      aria-label={title}
    >
      <ReactPlayer
        src={url}
        controls
        width="100%"
        height="100%"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onEnded={onEnded}
      />
    </div>
  );
};
