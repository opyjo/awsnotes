"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { videosApi } from "@/lib/aws/appsync";
import { queryKeys } from "@/hooks/api/query-keys";
import { useAuth } from "@/context/AuthContext";
import { useVideoProgress } from "@/hooks/api/useVideoProgress";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { getCloudFrontAssetUrl } from "@/lib/cloudfront-url";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PROGRESS_SAVE_INTERVAL_MS = 8000;
const COMPLETION_THRESHOLD_PERCENT = 0.95;

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

  const {
    progress,
    saveProgress,
    isSaving: isSavingProgress,
    saveError: progressSaveError,
  } = useVideoProgress(id);

  const persistedNotes = progress?.notes ?? "";
  const persistedCompleted = Boolean(progress?.completed);

  const [notesDraft, setNotesDraft] = useState(persistedNotes);
  const [notesStatus, setNotesStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [notesError, setNotesError] = useState<string | null>(null);

  const playedSecondsRef = useRef(0);
  const durationRef = useRef<number | null>(null);
  const lastSavedAtRef = useRef(0);
  const completedRef = useRef(persistedCompleted);
  const prevIdRef = useRef(id);
  const prevNotesRef = useRef(persistedNotes);

  useEffect(() => {
    if (prevIdRef.current !== id || prevNotesRef.current !== persistedNotes) {
      prevIdRef.current = id;
      prevNotesRef.current = persistedNotes;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional state reset when source data changes
      setNotesDraft(persistedNotes);
      setNotesStatus("idle");
      setNotesError(null);
    }
  }, [id, persistedNotes]);

  useEffect(() => {
    completedRef.current = persistedCompleted;
  }, [persistedCompleted]);

  useEffect(() => {
    playedSecondsRef.current = 0;
    durationRef.current = null;
    lastSavedAtRef.current = 0;
  }, [id]);

  const persistedDuration = progress?.duration ?? null;
  const persistedNotesValue = progress?.notes ?? null;

  const persistProgress = useCallback(
    async ({
      seconds,
      duration,
      completed,
      notes,
      force,
    }: {
      seconds?: number;
      duration?: number | null;
      completed?: boolean;
      notes?: string | null;
      force?: boolean;
    }) => {
      if (!id || !user) {
        return;
      }

      const now = Date.now();
      if (
        !force &&
        now - lastSavedAtRef.current < PROGRESS_SAVE_INTERVAL_MS
      ) {
        return;
      }

      const safeSeconds = Math.max(
        0,
        Math.round(seconds ?? playedSecondsRef.current ?? 0),
      );
      const safeDuration =
        duration ?? durationRef.current ?? persistedDuration ?? null;

      lastSavedAtRef.current = now;

      try {
        await saveProgress({
          videoId: id,
          progressSeconds: safeSeconds,
          duration: safeDuration ?? null,
          completed: completed ?? completedRef.current,
          notes: notes ?? persistedNotesValue ?? null,
        });
      } catch (error) {
        console.error("Failed to save video progress", error);
      }
    },
    [id, persistedDuration, persistedNotesValue, saveProgress, user],
  );

  const handlePlayerProgress = useCallback(
    (seconds: number) => {
      playedSecondsRef.current = seconds;

      const totalDuration = durationRef.current ?? persistedDuration ?? null;
      const reachedCompletion =
        Boolean(totalDuration) &&
        totalDuration! > 0 &&
        seconds / totalDuration! >= COMPLETION_THRESHOLD_PERCENT;

      if (reachedCompletion && !completedRef.current) {
        completedRef.current = true;
        void persistProgress({
          seconds: totalDuration ?? seconds,
          completed: true,
          force: true,
        });
        return;
      }

      void persistProgress({ seconds });
    },
    [persistProgress, persistedDuration],
  );

  const handlePlayerDuration = useCallback(
    (duration: number) => {
      durationRef.current = duration;

      if (persistedDuration !== duration) {
        void persistProgress({
          seconds: playedSecondsRef.current,
          duration,
          force: true,
        });
      }
    },
    [persistProgress, persistedDuration],
  );

  const handlePlayerEnded = useCallback(() => {
    completedRef.current = true;
    const finalSeconds =
      durationRef.current ?? playedSecondsRef.current ?? persistedDuration ?? 0;

    void persistProgress({
      seconds: finalSeconds,
      completed: true,
      force: true,
    });
  }, [persistProgress, persistedDuration]);

  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setNotesDraft(event.target.value);
    if (notesStatus !== "idle") {
      setNotesStatus("idle");
      setNotesError(null);
    }
  };

  const persistedSeconds = progress?.progressSeconds ?? 0;

  const handleSaveNotes = async () => {
    if (!id) {
      return;
    }

    setNotesStatus("saving");
    setNotesError(null);

    try {
      const trimmed = notesDraft.trim();
      await saveProgress({
        videoId: id,
        progressSeconds: Math.max(
          0,
          Math.round(playedSecondsRef.current || persistedSeconds || 0),
        ),
        duration: durationRef.current ?? persistedDuration ?? null,
        completed: completedRef.current,
        notes: trimmed.length > 0 ? trimmed : null,
      });
      setNotesStatus("saved");
    } catch (error) {
      setNotesStatus("error");
      setNotesError(
        error instanceof Error ? error.message : "Failed to save notes",
      );
    }
  };

  const handleResetNotes = () => {
    setNotesDraft(persistedNotes);
    setNotesStatus("idle");
    setNotesError(null);
  };

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

  const totalDuration = persistedDuration ?? video.duration ?? null;
  const watchedSeconds = persistedSeconds;
  const watchedPercent =
    totalDuration && totalDuration > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((watchedSeconds / totalDuration) * 100)),
        )
      : 0;
  const isCompleted = persistedCompleted;
  const notesAreDirty = persistedNotes !== notesDraft;

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
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
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
            Completed
          </span>
        ) : null}
      </div>

      {streamUrl ? (
        <VideoPlayer
          url={streamUrl}
          title={video.title}
          onProgress={handlePlayerProgress}
          onDuration={handlePlayerDuration}
          onEnded={handlePlayerEnded}
        />
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

      {watchedSeconds > 0 || isCompleted ? (
        <div
          className="space-y-2"
          aria-label="Lesson progress"
          aria-live="polite"
        >
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{isCompleted ? "Completed" : `${watchedPercent}% watched`}</span>
            {isSavingProgress ? <span>Saving…</span> : null}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${isCompleted ? 100 : watchedPercent}%` }}
            />
          </div>
          {progressSaveError ? (
            <p className="text-xs text-destructive">{progressSaveError}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{video.title}</h1>
        {video.description ? (
          <p className="leading-relaxed text-muted-foreground">
            {video.description}
          </p>
        ) : null}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Lesson notes</CardTitle>
          <CardDescription>
            Capture takeaways for this lesson. Notes are synced to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notesDraft}
            onChange={handleNotesChange}
            placeholder="Write down key points, timestamps, or questions…"
            aria-label="Lesson notes"
            className="min-h-[160px] rounded-2xl"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className="text-xs text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {notesStatus === "saving"
                ? "Saving notes…"
                : notesStatus === "saved" && !notesAreDirty
                  ? "Notes saved."
                  : notesStatus === "error"
                    ? notesError ?? "Failed to save notes."
                    : notesAreDirty
                      ? "Unsaved changes."
                      : "All changes saved."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetNotes}
                disabled={!notesAreDirty || notesStatus === "saving"}
                aria-label="Discard unsaved note changes"
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleSaveNotes}
                disabled={!notesAreDirty || notesStatus === "saving"}
                aria-label="Save lesson notes"
              >
                {notesStatus === "saving" ? "Saving…" : "Save notes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
