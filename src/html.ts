import type { Heading } from "./types.ts";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

/** Decodes the entities `escapeHtml` and markdown-it produce. `&amp;` goes last so it isn't decoded twice. */
export function decodeHtml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#96;/g, "`")
    .replace(/&amp;/g, "&");
}

/** Serializes a value for an inline `<script>`, so `</script>` in strings can't close it. */
export function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function htmlToText(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

/** Matches rendered headings that have an `id`: level, id, and inner HTML. */
export const headingPattern =
  /<h([1-6])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;

export function stripHeaderAnchors(html: string): string {
  return html.replace(
    /<a\b[^>]*class="[^"]*\bheader-anchor\b[^"]*"[\s\S]*?<\/a>/gi,
    "",
  );
}

/** The headings in rendered page HTML, in document order. */
export function extractHeadings(html: string): Heading[] {
  return [...html.matchAll(headingPattern)].map((match) => ({
    level: Number(match[1]),
    slug: decodeHtml(match[2]),
    text: htmlToText(stripHeaderAnchors(match[3])),
  }));
}
