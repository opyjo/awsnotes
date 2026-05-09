export interface Video {
  videoId: string;
  title: string;
  description?: string | null;
  category: string;
  s3Key: string;
  thumbnailKey?: string | null;
  duration?: number | null;
  order?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoInput {
  title: string;
  description?: string | null;
  category: string;
  s3Key: string;
  thumbnailKey?: string | null;
  duration?: number | null;
  order?: number | null;
}

export interface UpdateVideoInput {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  s3Key?: string | null;
  thumbnailKey?: string | null;
  duration?: number | null;
  order?: number | null;
}

export interface VideoProgress {
  videoId: string;
  progressSeconds: number;
  duration?: number | null;
  completed: boolean;
  notes?: string | null;
  lastWatchedAt: string;
  updatedAt: string;
}

export interface SaveVideoProgressInput {
  videoId: string;
  progressSeconds: number;
  duration?: number | null;
  completed?: boolean | null;
  notes?: string | null;
}
