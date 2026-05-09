import type { Video } from "@/types/video";

/**
 * Group lesson videos by category; categories sorted A–Z. Videos keep API order within each group.
 */
export const groupVideosByCategory = (
  videos: Video[],
): { category: string; videos: Video[] }[] => {
  const map = new Map<string, Video[]>();

  for (const video of videos) {
    const category = video.category?.trim() || "Uncategorized";
    const existing = map.get(category) ?? [];
    existing.push(video);
    map.set(category, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map(([category, items]) => ({ category, videos: items }));
};
