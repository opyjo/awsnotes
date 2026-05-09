"use client";

import Link from "next/link";
import type { Video } from "@/types/video";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { getCloudFrontAssetUrl } from "@/lib/cloudfront-url";

export interface VideoModalProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VideoModal = ({
  video,
  open,
  onOpenChange,
}: VideoModalProps) => {
  const streamUrl = video
    ? getCloudFrontAssetUrl(video.s3Key)
    : null;

  if (!video) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-5xl gap-5 overflow-y-auto rounded-[1.75rem] border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <DialogHeader className="px-1 pt-1">
          <div className="mb-2 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {video.category}
          </div>
          <DialogTitle className="text-2xl leading-tight tracking-tight">
            {video.title}
          </DialogTitle>
          {video.description ? (
            <DialogDescription className="max-w-3xl leading-6">
              {video.description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              Video lesson: {video.title}
            </DialogDescription>
          )}
        </DialogHeader>
        {streamUrl ? (
          <VideoPlayer
            key={video.videoId}
            url={streamUrl}
            title={video.title}
            className="rounded-[1.25rem]"
          />
        ) : (
          <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Video URL could not be built. Set{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              NEXT_PUBLIC_CLOUDFRONT_URL
            </code>{" "}
            and ensure the lesson&apos;s S3 key is correct.
          </p>
        )}
        <DialogFooter className="gap-2 px-1 pb-1 sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-full">
              Close
            </Button>
          </DialogClose>
          <Button type="button" asChild className="rounded-full">
            <Link
              href={`/videos/${video.videoId}`}
              aria-label={`Open full lesson page for ${video.title}`}
            >
              Open lesson page
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
