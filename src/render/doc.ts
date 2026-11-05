import { escapeHtml } from "../html.ts";
import { isActiveLink } from "../navigation.ts";
import type {
  DocsData,
  Heading,
  PageLink,
  ResolvedFoundatioThemeOptions,
  SidebarLink,
} from "../types.ts";
import { normalizeHref, titleFromPath } from "../urls.ts";
import { classes, link } from "./markup.ts";
import { type OutlineSettings, renderOutlineItems } from "./outline.ts";

/** Mirrors VitePress's `VPDoc`. */
export function renderDoc(options: {
  data: DocsData;
  content: string;
  sourcePath: string;
  pages: SidebarLink[];
  outline: OutlineSettings;
  headings: Heading[];
  hasSidebar: boolean;
  theme: ResolvedFoundatioThemeOptions;
}): string {
  const { data, outline } = options;
  const hasAside = data.aside !== false;
  const aside = hasAside
    ? `<div class="aside"><div class="aside-curtain"></div><div class="aside-container"><div class="aside-content"><div class="VPDocAside">${
        outline.enabled
          ? renderAsideOutline(options.headings, outline.label)
          : ""
      }<div class="spacer"></div></div></div></div></div>`
    : "";

  return `<div class="${classes("VPDoc", options.hasSidebar && "has-sidebar", hasAside && "has-aside")}"><div class="container">${aside}<div class="content"><div class="content-container"><main class="main"><div style="position:relative;" class="${classes(
    "vp-doc",
    pageClassName(data.url),
  )}"><div>${options.content}</div></div></main>${renderDocFooter(options)}</div></div></div></div>`;
}

/** VitePress adds a class derived from the page path, like `_guide_getting-started`. */
function pageClassName(url: string) {
  return (url.replace(/(?:\/index)?(?:\.html)?\/?$/, "") || "/index").replace(
    /[./]+/g,
    "_",
  );
}

function renderAsideOutline(headings: Heading[], label: string) {
  return `<nav aria-labelledby="doc-outline-aria-label" class="${classes(
    "VPDocAsideOutline",
    headings.length > 0 && "has-outline",
  )}"><div class="content"><div class="outline-marker"></div><div aria-level="2" class="outline-title" id="doc-outline-aria-label" role="heading">${escapeHtml(
    label,
  )}</div>${renderOutlineItems(headings, true)}</div></nav>`;
}

/** Mirrors `VPLocalNav` + `VPLocalNavOutlineDropdown`, the mobile bar under the nav. */
export function renderLocalNav(options: {
  headings: Heading[];
  outline: OutlineSettings;
  hasSidebar: boolean;
  theme: ResolvedFoundatioThemeOptions;
}) {
  const { headings, theme } = options;
  const hasLocalNav = headings.length > 0;
  const menu = options.hasSidebar
    ? `<button type="button" class="menu" aria-expanded="false" aria-controls="VPSidebarNav"><span class="vpi-text-align-start menu-icon" aria-hidden="true"></span><span class="menu-text">${escapeHtml(
        theme.labels.sidebarMenu,
      )}</span></button>`
    : "";
  const dropdown = hasLocalNav
    ? `<button type="button" aria-expanded="false" aria-controls="VPLocalNavOutline"><span class="menu-text">${escapeHtml(
        options.outline.label,
      )}</span><span class="vpi-chevron-right icon" aria-hidden="true"></span></button><div id="VPLocalNavOutline" class="items" hidden><div class="header"><a class="top-link" href="#">${escapeHtml(
        theme.labels.returnTop,
      )}</a></div><div class="outline">${renderOutlineItems(headings, false)}</div></div>`
    : `<button type="button" class="return-top">${escapeHtml(theme.labels.returnTop)}</button>`;

  return `<div class="${classes(
    "VPLocalNav",
    options.hasSidebar && "has-sidebar",
    !hasLocalNav && "empty",
    !hasLocalNav && !options.hasSidebar && "fixed",
  )}"><div class="container">${menu}<div class="VPLocalNavOutlineDropdown">${dropdown}</div></div></div>`;
}

/** Mirrors `VPDocFooter`: edit link, last updated, and prev/next. */
function renderDocFooter(options: {
  data: DocsData;
  sourcePath: string;
  pages: SidebarLink[];
  theme: ResolvedFoundatioThemeOptions;
}) {
  const { data, theme } = options;
  const index = options.pages.findIndex((page) =>
    isActiveLink(page.link, data.url),
  );
  const prev = pagerLink(
    data.prev,
    index > 0 ? options.pages[index - 1] : undefined,
  );
  const next = pagerLink(
    data.next,
    index >= 0 ? options.pages[index + 1] : undefined,
  );

  const editLink =
    theme.editLink && data.editLink !== false
      ? `<div class="edit-link">${link(
          {
            href: theme.editLink.pattern.replace(
              ":path",
              options.sourcePath.replace(/^\//, ""),
            ),
            class: "edit-link-button",
            noIcon: true,
          },
          `<span class="vpi-square-pen edit-link-icon"></span> ${escapeHtml(theme.editLink.text)}`,
        )}</div>`
      : "";
  const lastUpdated =
    theme.lastUpdated && data.lastUpdated !== false && data.lastUpdatedDate
      ? `<div class="last-updated"><p class="VPLastUpdated"><bdi>${escapeHtml(
          theme.lastUpdated.text,
        )}:</bdi> <time dir="auto" datetime="${data.lastUpdatedDate.toISOString()}">${escapeHtml(
          new Intl.DateTimeFormat(data.lang ?? theme.lang, {
            dateStyle: "medium",
            timeStyle: "medium",
          }).format(data.lastUpdatedDate),
        )}</time></p></div>`
      : "";
  const editInfo =
    editLink || lastUpdated
      ? `<div class="edit-info">${editLink}${lastUpdated}</div>`
      : "";

  const pager = (page: PagerLink | undefined, direction: "prev" | "next") =>
    `<div class="pager">${
      page
        ? link(
            {
              href: page.link,
              class: `pager-link ${direction}`,
              target: page.target,
              rel: page.rel,
            },
            `<span class="desc">${escapeHtml(
              direction === "prev"
                ? theme.labels.previousPage
                : theme.labels.nextPage,
            )}</span><span class="title"><bdi>${page.text}</bdi></span>`,
          )
        : ""
    }</div>`;
  const nav =
    prev || next
      ? `<nav class="prev-next" aria-labelledby="doc-footer-aria-label"><span class="visually-hidden" id="doc-footer-aria-label">${escapeHtml(
          theme.labels.pager,
        )}</span>${pager(prev, "prev")}${pager(next, "next")}</nav>`
      : "";

  return editInfo || nav
    ? `<footer class="VPDocFooter">${editInfo}${nav}</footer>`
    : "";
}

type PagerLink = { text: string; link: string; rel?: string; target?: string };

/**
 * Resolves `prev`/`next` front matter like VitePress: `false` hides the link,
 * a string replaces the text, and `{ text, link, rel, target }` overrides
 * the sidebar's neighbor. Text is HTML.
 */
function pagerLink(
  value: PageLink | false | undefined,
  fallback: SidebarLink | undefined,
): PagerLink | undefined {
  if (value === false) {
    return undefined;
  }
  const custom = typeof value === "string" ? { text: value } : value;
  const href = custom?.link ?? fallback?.link;
  if (!href) {
    return undefined;
  }
  return {
    text:
      custom?.text ??
      fallback?.docFooterText ??
      fallback?.text ??
      escapeHtml(titleFromPath(href)),
    link: normalizeHref(href),
    rel: custom?.rel ?? fallback?.rel,
    target: custom?.target ?? fallback?.target,
  };
}
