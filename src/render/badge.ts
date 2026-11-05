import {
  decodeHtml,
  escapeAttribute,
  escapeHtml,
  htmlToText,
} from "../html.ts";
import type { Badge } from "../types.ts";

/** Mirrors VitePress's `VPBadge`. */
export function renderBadge(value: string | Badge): string {
  const badge = typeof value === "string" ? { text: value } : value;
  return `<span class="VPBadge ${escapeAttribute(badge.type ?? "tip")}" dir="auto">${escapeHtml(badge.text)}</span>`;
}

/** Renders `<Badge text="…" type="…" />` and `<Badge type="…">text</Badge>` from markdown. */
export function transformBadgeTags(html: string): string {
  return html
    .replace(/<Badge\b([^>]*?)\s*\/>/g, (match, attrs: string) => {
      const text = attribute(attrs, "text");
      return text === undefined
        ? match
        : renderBadge({
            text: decodeHtml(text),
            type: attribute(attrs, "type"),
          });
    })
    .replace(
      /<Badge\b([^>]*)>([\s\S]*?)<\/Badge>/g,
      (_match, attrs: string, text: string) =>
        renderBadge({ text: htmlToText(text), type: attribute(attrs, "type") }),
    );
}

function attribute(attrs: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\s)${name}=(?:"([^"]*)"|'([^']*)')`).exec(
    attrs,
  );
  return match ? (match[1] ?? match[2]) : undefined;
}
