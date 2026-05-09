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
