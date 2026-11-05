import type { ThemePage } from "./lume.ts";
import type { DocsData, PageLayout } from "./types.ts";

export function pageData(page: ThemePage): DocsData {
  return page.data as DocsData;
}

/** The page's source path with `/` separators, like `/guide/intro.md`. */
export function sourcePath(page: ThemePage): string {
  return page.sourcePath.replaceAll("\\", "/");
}

/** Markdown pages the theme lays out (not `_`-prefixed partials or `layout: false` pages). */
export function isMarkdownPage(page: ThemePage): boolean {
  const path = sourcePath(page);
  const data = pageData(page);
  return (
    page.isHTML &&
    path.endsWith(".md") &&
    !path.startsWith("/_") &&
    Boolean(data.url) &&
    data.docsLayout !== false
  );
}

const layouts: Record<string, PageLayout> = {
  home: "home",
  doc: "doc",
  docs: "doc",
  page: "page",
};

/**
 * Moves VitePress-style `layout` front matter to `docsLayout`, so Lume doesn't
 * look for a template with that name.
 */
export function readLayout(data: DocsData) {
  if (data.layout === false) {
    data.docsLayout = false;
  } else if (typeof data.layout === "string" && data.layout in layouts) {
    data.docsLayout = layouts[data.layout];
  } else {
    return;
  }
  delete data.layout;
}

/** The page's VitePress-style layout; `doc` unless front matter says otherwise. */
export function pageLayout(data: DocsData): Exclude<PageLayout, false> {
  return data.docsLayout || "doc";
}

export function firstHeading(data: DocsData): string | undefined {
  return data.headings?.find((heading) => heading.level === 1)?.text;
}
