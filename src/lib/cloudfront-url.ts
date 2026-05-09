/**
 * Build a CloudFront URL for an S3 object key (supports nested paths).
 */
export const getCloudFrontAssetUrl = (
  key: string | undefined | null,
): string | null => {
  if (!key?.trim()) {
    return null;
  }

  const base = process.env.NEXT_PUBLIC_CLOUDFRONT_URL?.replace(/\/$/, "") ?? "";
  if (!base) {
    return null;
  }

  const normalized = key.replace(/^\/+/, "");
  const path = normalized
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/${path}`;
};
