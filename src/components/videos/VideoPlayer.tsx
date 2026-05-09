"use client";

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
}

export const VideoPlayer = ({ url, title, className }: VideoPlayerProps) => {
  if (!url) {
    return null;
  }

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
      />
    </div>
  );
};
