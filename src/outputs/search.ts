import type { ContentEntry } from "../types.ts";
import {
  decodeHtml,
  headingPattern,
  htmlToText,
  stripHeaderAnchors,
} from "../html.ts";

/** One searchable section, shaped like VitePress's local search documents. */
export type SearchSection = {
  id: string;
  url: string;
  anchor: string;
  /** The section's heading. */
  title: string;
  /** Headings the section is nested under, outermost first. */
  titles: string[];
  text: string;
};

const maxTextLength = 5000;

/**
 * Splits each page into one section per heading, like VitePress: a section's
 * text runs to the next heading, and content before the first heading is skipped.
 */
export function buildSearchIndex(entries: ContentEntry[]): SearchSection[] {
  return entries
    .filter((entry) => entry.data.search !== false)
    .flatMap((entry) => pageSections(entry.data.url, cleanHtml(entry.html)));
}

function pageSections(url: string, html: string): SearchSection[] {
  const headings = [...html.matchAll(headingPattern)];
  const parents: Array<{ level: number; text: string }> = [];

  return headings.flatMap((match, index) => {
    const level = Number(match[1]);
    const anchor = decodeHtml(match[2]);
    const title = htmlToText(match[3]);
    while (parents.length && parents.at(-1)!.level >= level) {
      parents.pop();
    }
    const titles = parents.map((parent) => parent.text);
    parents.push({ level, text: title });

    const start = match.index + match[0].length;
    const end = headings[index + 1]?.index ?? html.length;
    const text = boundText(htmlToText(html.slice(start, end)));
    return title || text
      ? [{ id: `${url}#${anchor}`, url, anchor, title, titles, text }]
      : [];
  });
}

/** Drops markup that isn't readable content: scripts, anchors, copy buttons, hidden nodes. */
function cleanHtml(html: string) {
  return stripHeaderAnchors(html)
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(
      /<button\b[^>]*class="[^"]*\bcopy\b[^"]*"[\s\S]*?<\/button>/gi,
      " ",
    )
    .replace(
      /<div\b[^>]*class="[^"]*\bline-numbers-wrapper\b[^"]*"[\s\S]*?<\/div>/gi,
      " ",
    )
    .replace(
      /<([a-z][\w:-]*)\b(?=[^>]*(?:\shidden(?:[\s=>]|$)|\saria-hidden=["']true["']))[^>]*>[\s\S]*?<\/\1>/gi,
      " ",
    );
}

function boundText(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= maxTextLength
    ? text
    : `${text.slice(0, maxTextLength).trim()}...`;
}
