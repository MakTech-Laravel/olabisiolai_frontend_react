/** Matches Laravel business logo/cover rules: JPG/PNG/WebP, max 10MB, must decode as an image. */

export const BUSINESS_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const BUSINESS_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const ACCEPTED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isHeicLikeFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase().trim();
  if (mime === "image/heic" || mime === "image/heif") {
    return true;
  }
  return /\.(heic|heif)$/i.test(file.name);
}

export function isAcceptedBusinessImage(file: File): boolean {
  if (isHeicLikeFile(file)) {
    return false;
  }

  const mime = (file.type || "").toLowerCase().trim();
  if (ACCEPTED_MIME.has(mime)) {
    return true;
  }

  // Some mobile/desktop pickers leave `file.type` empty — fall back to extension.
  if (!mime) {
    return /\.(jpe?g|png|webp)$/i.test(file.name);
  }

  return false;
}

export function isBusinessImageWithinSizeLimit(file: File): boolean {
  return file.size > 0 && file.size <= BUSINESS_IMAGE_MAX_BYTES;
}

/** Decode in the browser so mime-spoofed / corrupt files are rejected before upload. */
export async function canDecodeBusinessImage(file: File): Promise<boolean> {
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      return true;
    }
  } catch {
    // Fall through to Image() probe.
  }

  return await new Promise<boolean>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    image.src = url;
  });
}

export type BusinessImageFilterResult = {
  accepted: File[];
  rejectedType: File[];
  rejectedSize: File[];
  rejectedHeic: File[];
  rejectedCorrupt: File[];
};

export async function filterBusinessImages(files: File[]): Promise<BusinessImageFilterResult> {
  const accepted: File[] = [];
  const rejectedType: File[] = [];
  const rejectedSize: File[] = [];
  const rejectedHeic: File[] = [];
  const rejectedCorrupt: File[] = [];

  for (const file of files) {
    if (isHeicLikeFile(file)) {
      rejectedHeic.push(file);
      continue;
    }
    if (!isAcceptedBusinessImage(file)) {
      rejectedType.push(file);
      continue;
    }
    if (!isBusinessImageWithinSizeLimit(file)) {
      rejectedSize.push(file);
      continue;
    }
    if (!(await canDecodeBusinessImage(file))) {
      rejectedCorrupt.push(file);
      continue;
    }
    accepted.push(file);
  }

  return { accepted, rejectedType, rejectedSize, rejectedHeic, rejectedCorrupt };
}

export function businessImageRejectMessage(result: BusinessImageFilterResult): string | null {
  if (result.rejectedHeic.length > 0) {
    return "Apple HEIC/HEIF photos aren't supported. Please choose JPG, PNG, or WebP.";
  }
  if (result.rejectedCorrupt.length > 0) {
    return "One or more files aren't readable images. Please choose JPG, PNG, or WebP.";
  }
  if (result.rejectedType.length > 0) {
    return "Only JPG, PNG, or WebP images are allowed.";
  }
  if (result.rejectedSize.length > 0) {
    return "Each image must be 10MB or smaller.";
  }
  return null;
}
