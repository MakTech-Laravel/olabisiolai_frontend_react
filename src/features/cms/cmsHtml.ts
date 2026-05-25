import { resolveMediaUrl } from "@/lib/mediaUrl";

/** True when HTML has visible text or embedded media (e.g. images only). */
export function hasCmsHtmlContent(html: string): boolean {
  const trimmed = html.trim();
  if (!trimmed) return false;
  if (/<img\s/i.test(trimmed) || /<iframe\s/i.test(trimmed) || /<video\s/i.test(trimmed)) {
    return true;
  }
  const text = trimmed
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text.length > 0;
}

/** Resolve relative storage paths in CMS HTML so images load on the React app origin. */
export function resolveCmsHtmlMedia(html: string): string {
  if (!html.trim()) return html;

  if (typeof DOMParser === "undefined") {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    if (!src) return;
    img.setAttribute("src", resolveMediaUrl(src, ""));
  });

  return doc.body.innerHTML;
}
