import { escapeAttribute, escapeHtml } from "../html.ts";
import type {
  DocsData,
  Heading,
  OutlineLevel,
  ResolvedLumePressOptions,
} from "../types.ts";

export type OutlineSettings = {
  enabled: boolean;
  min: number;
  max: number;
  label: string;
};

/** Resolves `outline` front matter against the theme default, like VitePress. */
export function resolveOutline(
  data: DocsData,
  theme: ResolvedLumePressOptions,
): OutlineSettings {
  if (data.outline === false) {
    return { enabled: false, min: 2, max: 2, label: theme.outline.label };
  }

  const configured =
    typeof data.outline === "object" && !Array.isArray(data.outline)
      ? data.outline
      : data.outline === undefined
        ? theme.outline
        : { level: data.outline };
  const [min, max] = outlineRange(configured.level ?? theme.outline.level);
  return {
    enabled: true,
    min,
    max,
    label: configured.label ?? theme.outline.label,
  };
}

function outlineRange(level: OutlineLevel): [number, number] {
  if (level === "deep") {
    return [2, 6];
  }
  return Array.isArray(level) ? level : [level, level];
}

export function outlineHeadings(
  headings: Heading[],
  outline: OutlineSettings,
): Heading[] {
  return outline.enabled
    ? headings.filter(
        (heading) =>
          heading.level >= outline.min && heading.level <= outline.max,
      )
    : [];
}

type HeadingTree = { heading: Heading; children: HeadingTree[] };

/** Nests each heading under the closest preceding heading of a lower level. */
function nestHeadings(headings: Heading[]): HeadingTree[] {
  const roots: HeadingTree[] = [];
  const stack: HeadingTree[] = [];
  for (const heading of headings) {
    const node = { heading, children: [] };
    while (stack.length && stack.at(-1)!.heading.level >= heading.level) {
      stack.pop();
    }
    (stack.at(-1)?.children ?? roots).push(node);
    stack.push(node);
  }
  return roots;
}

/** Mirrors VitePress's `VPDocOutlineItem`. */
export function renderOutlineItems(headings: Heading[], root: boolean): string {
  const render = (nodes: HeadingTree[], isRoot: boolean): string =>
    `<ul class="VPDocOutlineItem ${isRoot ? "root" : "nested"}">${nodes
      .map(
        ({ heading, children }) =>
          `<li><a class="outline-link" href="#${escapeAttribute(heading.slug)}" title="${escapeAttribute(
            heading.text,
          )}"><bdi>${escapeHtml(heading.text)}</bdi></a>${children.length ? render(children, false) : ""}</li>`,
      )
      .join("")}</ul>`;
  return render(nestHeadings(headings), root);
}

/** Renders `[[toc]]` the way VitePress does: nested lists of the level 2 and 3 headings. */
export function renderTableOfContents(headings: Heading[]): string {
  const render = (nodes: HeadingTree[]): string =>
    `<ul>${nodes
      .map(
        ({ heading, children }) =>
          `<li><a href="#${escapeAttribute(heading.slug)}">${heading.html}</a>${
            children.length ? render(children) : ""
          }</li>`,
      )
      .join("")}</ul>`;
  const items = headings.filter(
    (heading) => heading.level === 2 || heading.level === 3,
  );
  return items.length
    ? `<nav class="table-of-contents">${render(nestHeadings(items))}</nav>`
    : "";
}
