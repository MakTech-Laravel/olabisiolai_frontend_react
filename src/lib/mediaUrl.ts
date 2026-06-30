import { env } from "@/config/env";

/** Laravel app origin (e.g. `http://localhost:8000`) derived from `VITE_API_BASE_URL`. */
export function apiOrigin(): string {
  const base = env.apiBaseUrl.trim();
  if (!base) return "";

  try {
    return new URL(base).origin;
  } catch {
    const withoutApi = base.replace(/\/api\/v\d+\/?$/i, "");
    try {
      return new URL(withoutApi).origin;
    } catch {
      return withoutApi.replace(/\/+$/, "");
    }
  }
}

/**
 * Turn API media paths into browser-loadable absolute URLs.
 * Handles `/storage/...`, `/images/...`, bare disk paths, and already-absolute URLs.
 */
export function resolveMediaUrl(
  url: string | null | undefined,
  fallback = "https://placehold.net/600x400.png",
): string {
  const raw = (url ?? "").trim();
  if (!raw) {
    return fallback ? resolveMediaUrl(fallback, "") : "";
  }

  const origin = apiOrigin();

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const isAppMedia =
        parsed.pathname.startsWith("/storage/") ||
        parsed.pathname.startsWith("/images/") ||
        parsed.pathname.startsWith("/files/");

      if (origin && isAppMedia) {
        const pathname = parsed.pathname.startsWith("/files/")
          ? parsed.pathname.replace(/^\/files\//, "/storage/")
          : parsed.pathname;
        return `${origin}${pathname}${parsed.search}`;
      }
    } catch {
      /* keep raw */
    }

    return raw;
  }

  const normalizedPath = raw.startsWith("/files/")
    ? raw.replace(/^\/files\//, "/storage/")
    : raw.startsWith("/")
      ? raw
      : `/storage/${raw.replace(/^\/+/, "")}`;

  if (origin) {
    return `${origin}${normalizedPath}`;
  }

  return normalizedPath;
}

export function resolveMediaUrls(urls: string[] | null | undefined): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.map((url) => resolveMediaUrl(url, "")).filter((url) => url.length > 0);
}
