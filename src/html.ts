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

/** Heading children VitePress leaves out of outline titles: badges, anchors, and footnote references. */
const outlineIgnoredPattern =
  /<([a-z][\w-]*)\b[^>]*\bclass="[^"]*\b(?:VPBadge|header-anchor|footnote-ref|ignore-header)\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi;

const badgePattern =
  /<span\b[^>]*\bclass="VPBadge\b[^"]*"[^>]*>[\s\S]*?<\/span>/g;

/**
 * A heading as VitePress's `[[toc]]` shows it: text only, except for inline
 * HTML written in the markdown (in practice, badges). Markdown formatting
 * like `code` is dropped.
 */
function tocHtml(html: string): string {
  let result = "";
  let last = 0;
  for (const badge of html.matchAll(badgePattern)) {
    result += html.slice(last, badge.index).replace(/<[^>]+>/g, "") + badge[0];
    last = badge.index + badge[0].length;
  }
  return (result + html.slice(last).replace(/<[^>]+>/g, "")).trim();
}

/** The headings in rendered page HTML, in document order, titled like VitePress's outline. */
export function extractHeadings(html: string): Heading[] {
  return [...html.matchAll(headingPattern)].map((match) => ({
    level: Number(match[1]),
    slug: decodeHtml(match[2]),
    text: htmlToText(match[3].replace(outlineIgnoredPattern, "")),
    html: tocHtml(stripHeaderAnchors(match[3])),
  }));
}
