import { decodeHtml, escapeAttribute } from "./html.ts";

export function isExternal(href: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}

/** `"guide"` from `"/guide/"`, `"guide"`, or `""` (the default). */
export function normalizeDocsRoot(root: string): string {
  return root.replace(/^\/+|\/+$/g, "") || "guide";
}

/** Whether a source path (like `/guide/intro.md`) is under the docs root (already normalized). */
export function isDocsPath(path: string, docsRoot: string): boolean {
  return path.startsWith(`/${docsRoot}/`);
}

/** Rewrites every `href` in rendered HTML with `normalizeHref`; `from` is the page's source path. */
export function normalizeInternalLinks(html: string, from?: string): string {
  return html.replace(
    /\shref="([^"]+)"/g,
    (_match, href: string) =>
      ` href="${escapeAttribute(normalizeHref(decodeHtml(href), from))}"`,
  );
}

/**
 * Turns markdown links into the site's pretty URLs: `intro.md` and
 * `intro.html` become `intro/`, and the query and hash are kept. Relative
 * paths resolve against `from`: a source file like `/guide/intro.md` (as
 * VitePress does) or a directory URL like `/guide/`. External links and
 * files are untouched.
 */
export function normalizeHref(href: string, from?: string): string {
  if (href.startsWith("#") || isExternal(href)) {
    return href;
  }

  const [, path = "", suffix = ""] = /^([^?#]*)(.*)$/.exec(href) ?? [];
  if (path === "") {
    return href;
  }

  const pretty = prettyPagePath(path);
  if (!from || path.startsWith("/")) {
    return `${pretty}${suffix}`;
  }
  return `${new URL(pretty, new URL(from, "https://site.local")).pathname}${suffix}`;
}

function prettyPagePath(path: string): string {
  if (path.endsWith("/")) {
    return path;
  }
  if (/(?:^|\/)index\.(?:md|html)$/.test(path)) {
    return path.replace(/index\.(?:md|html)$/, "") || "./";
  }
  if (/\.(?:md|html)$/.test(path)) {
    return `${path.replace(/\.(?:md|html)$/, "")}/`;
  }
  // Other files (images, `.txt`, `.json`, …) keep their name.
  return path.split("/").pop()?.includes(".") ? path : `${path}/`;
}

/** The markdown mirror for a page URL: `/guide/intro/` → `/guide/intro.md`, `/` → `/index.md`. */
export function markdownMirrorUrl(url: string): string {
  const path = url
    .split("#", 1)[0]
    .replace(/\/$/, "")
    .replace(/(?:\/index)?\.html$/, "");
  return `${path || "/index"}.md`;
}

/** The old `.html` URL to redirect from, for pretty-URL pages: `/guide/intro/` → `/guide/intro.html`. */
export function legacyHtmlUrl(url: string): string | undefined {
  const path = url.split("#", 1)[0].replace(/\/$/, "");
  if (!path || path === "/index" || /\.[a-z0-9]+$/i.test(path)) {
    return undefined;
  }
  return `${path}.html`;
}

/** `"Getting Started"` from `"/guide/getting-started.md"` or `"/guide/getting-started/"`. */
export function titleFromPath(path: string): string {
  const name =
    path.replace(/\/$/, "").split("/").pop()?.replace(/\.md$/, "") ?? "";
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
