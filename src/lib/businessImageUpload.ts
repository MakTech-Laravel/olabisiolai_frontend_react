/** Accepted MIME types for business logo / gallery cover uploads. */
export const BUSINESS_IMAGE_ACCEPT_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const BUSINESS_IMAGE_ACCEPT_ATTR = BUSINESS_IMAGE_ACCEPT_MIME.join(",");

export const BUSINESS_COVER_PHOTOS_ERROR =
  "Gallery photos must be JPG, PNG, or WebP files (max 10MB).";

export const BUSINESS_IMAGE_MAX_MB = 10;

export function isAcceptedBusinessImage(file: File): boolean {
  return (BUSINESS_IMAGE_ACCEPT_MIME as readonly string[]).includes(file.type);
}

export function isWithinBusinessImageSizeLimit(
  file: File,
  maxMb: number = BUSINESS_IMAGE_MAX_MB,
): boolean {
  return file.size <= maxMb * 1024 * 1024;
}

/** Keep only real File objects that pass MIME + size checks. */
export function filterValidBusinessImageFiles(files: File[]): File[] {
  return files.filter(
    (file) =>
      typeof File !== "undefined" &&
      file instanceof File &&
      isAcceptedBusinessImage(file) &&
      isWithinBusinessImageSizeLimit(file),
  );
}

export function isCoverPhotosValidationKey(key: string): boolean {
  return key === "cover_photos" || key.startsWith("cover_photos.");
}

export function isCoverPhotosValidationMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("cover photos") ||
    lower.includes("cover_photos") ||
    (lower.includes("must be an image") && lower.includes("cover"))
  );
}
