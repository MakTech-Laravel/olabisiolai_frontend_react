export function getMessageFromUnknown(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object"
  ) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Something went wrong. Please try again.";
}

function getAxiosResponseData(error: unknown): Record<string, unknown> | null {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    !Array.isArray(error.response.data)
  ) {
    return error.response.data as Record<string, unknown>;
  }
  return null;
}

function firstValidationMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) return item.trim();
    }
  }
  return null;
}

function extractLaravelValidationErrors(payload: Record<string, unknown>): Record<string, string> {
  let raw: unknown = payload.errors;
  if (
    (!raw || typeof raw !== "object" || Array.isArray(raw)) &&
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    const inner = (payload.data as Record<string, unknown>).errors;
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      raw = inner;
    }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const msg = firstValidationMessage(val);
    if (!msg) continue;
    if (key.startsWith("services.")) {
      if (!out.services) out.services = msg;
      continue;
    }
    if (key.startsWith("cover_photos.")) {
      if (!out.cover_photos) out.cover_photos = msg;
      continue;
    }
    out[key] = msg;
  }
  return out;
}

export function parseVendorBusinessApiFailure(error: unknown): {
  fieldErrors: Record<string, string>;
  general: string | null;
} {
  const data = getAxiosResponseData(error);
  if (!data) {
    return { fieldErrors: {}, general: getMessageFromUnknown(error) };
  }

  const fieldErrors = extractLaravelValidationErrors(data);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, general: null };
  }

  const msg =
    typeof data.message === "string" && data.message.trim() ? data.message.trim() : null;
  return { fieldErrors: {}, general: msg ?? getMessageFromUnknown(error) };
}
