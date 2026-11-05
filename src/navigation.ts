import { escapeHtml } from "./html.ts";
import type { ThemePage } from "./lume.ts";
import { firstHeading, pageData, sourcePath } from "./pages.ts";
import { renderBadge } from "./render/badge.ts";
import type { Sidebar, SidebarItem, SidebarLink } from "./types.ts";
import { isExternal, normalizeHref, titleFromPath } from "./urls.ts";

type SortedItem = {
  title: string;
  order: number;
  item: SidebarItem;
  children: SortedItem[];
};

/**
 * Builds a sidebar from front matter: pages are grouped by `nav.section`
 * (default: the docs root's name), nested by subfolder, and sorted by
 * `sectionOrder`/`order`, then title.
 */
export function buildSidebar(
  pages: ThemePage[],
  docsRoot: string,
): SidebarItem[] {
  const sections = new Map<string, SortedItem>();

  for (const page of pages) {
    const data = pageData(page);
    const meta = data.nav ?? {};
    if (meta.hidden) {
      continue;
    }

    const sectionTitle = meta.section ?? titleFromPath(docsRoot);
    const section = sections.get(sectionTitle) ?? {
      title: sectionTitle,
      order: Infinity,
      item: { text: escapeHtml(sectionTitle) },
      children: [],
    };
    section.order = Math.min(section.order, meta.sectionOrder ?? 100);
    sections.set(sectionTitle, section);

    const title =
      meta.title ??
      data.title ??
      firstHeading(data) ??
      titleFromPath(sourcePath(page));
    const badge =
      typeof meta.badge === "string" ? { text: meta.badge } : meta.badge;
    folderGroup(section, folders(sourcePath(page), docsRoot)).children.push({
      title,
      order: meta.order ?? 100,
      item: {
        text: `${escapeHtml(title)}${badge ? ` ${renderBadge(badge)}` : ""}`,
        // The prev/next links show the title without the badge.
        docFooterText: badge ? escapeHtml(title) : undefined,
        link: data.url,
        collapsed: meta.collapsed,
      },
      children: [],
    });
  }

  return toItems([...sections.values()]);
}

/** Subfolders between the docs root and the page: `/guide/a/b/page.md` → `["a", "b"]`. */
function folders(path: string, docsRoot: string): string[] {
  return path.slice(`/${docsRoot}/`.length).split("/").slice(0, -1);
}

function folderGroup(parent: SortedItem, path: string[]): SortedItem {
  let current = parent;
  for (const folder of path) {
    const title = titleFromPath(folder);
    let group = current.children.find(
      (child) => !child.item.link && child.title === title,
    );
    if (!group) {
      group = {
        title,
        order: 100,
        item: { text: escapeHtml(title) },
        children: [],
      };
      current.children.push(group);
    }
    current = group;
  }
  return current;
}

function toItems(items: SortedItem[]): SidebarItem[] {
  return items
    .sort(
      (left, right) =>
        left.order - right.order || left.title.localeCompare(right.title),
    )
    .map(({ item, children }) =>
      children.length ? { ...item, items: toItems(children) } : item,
    );
}

/**
 * The sidebar for a page URL, like VitePress's `getSidebar`: the longest
 * matching path prefix wins, `base` prefixes links, and links are normalized
 * to the site's pretty URLs.
 */
export function resolveSidebar(
  sidebar: Sidebar | undefined,
  url: string,
): SidebarItem[] {
  if (!sidebar) {
    return [];
  }
  if (Array.isArray(sidebar)) {
    return resolveItems(sidebar);
  }

  const prefix = Object.keys(sidebar)
    .sort((left, right) => right.split("/").length - left.split("/").length)
    .find((path) => url.startsWith(withLeadingSlash(path)));
  const config = prefix ? sidebar[prefix] : [];
  return Array.isArray(config)
    ? resolveItems(config)
    : resolveItems(config.items, config.base);
}

/** Every sidebar in the config, resolved: one for a list, one per prefix otherwise. */
export function resolveSidebars(sidebar: Sidebar | undefined): SidebarItem[][] {
  if (!sidebar) {
    return [];
  }
  return Array.isArray(sidebar)
    ? [resolveItems(sidebar)]
    : Object.keys(sidebar).map((prefix) =>
        resolveSidebar(sidebar, withLeadingSlash(prefix)),
      );
}

function resolveItems(
  items: SidebarItem[],
  parentBase?: string,
): SidebarItem[] {
  return items.map((source) => {
    const item = { ...source };
    const base = item.base || parentBase;
    if (item.link && !isExternal(item.link)) {
      const link = base
        ? base + item.link.replace(/^\//, base.endsWith("/") ? "" : "/")
        : item.link;
      item.link = normalizeHref(link);
    }
    if (item.items) {
      item.items = resolveItems(item.items, base);
    }
    return item;
  });
}

function withLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Groups top-level items like VitePress's `getSidebarGroups`: items with
 * children are groups, and runs of plain links share an untitled group.
 */
export function sidebarGroups(sidebar: SidebarItem[]): SidebarItem[] {
  const groups: SidebarItem[] = [];
  let lastGroup = 0;
  for (const item of sidebar) {
    if (item.items) {
      lastGroup = groups.push(item);
      continue;
    }
    groups[lastGroup] ??= { items: [] };
    groups[lastGroup].items!.push(item);
  }
  return groups;
}

/** The sidebar's links in reading order, like VitePress's `getFlatSideBarLinks`. */
export function sidebarLinks(items: SidebarItem[]): SidebarLink[] {
  return items.flatMap((item) => [
    ...(item.text && item.link
      ? [
          {
            text: item.text,
            link: item.link,
            docFooterText: item.docFooterText,
            rel: item.rel,
            target: item.target,
          },
        ]
      : []),
    ...sidebarLinks(item.items ?? []),
  ]);
}

/** Drops repeated links, keeping the first, like VitePress's prev/next candidates. */
export function uniqueLinks(links: SidebarLink[]): SidebarLink[] {
  const seen = new Set<string>();
  return links.filter((item) => !seen.has(item.link) && seen.add(item.link));
}

/** Whether a sidebar link points at the page (ignoring its hash). */
export function isActiveLink(link: string | undefined, url: string): boolean {
  return Boolean(link) && !isExternal(link!) && link!.split("#")[0] === url;
}
