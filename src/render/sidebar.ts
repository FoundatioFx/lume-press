import { escapeHtml } from "../html.ts";
import { isActiveLink, sidebarGroups } from "../navigation.ts";
import type { SidebarItem } from "../types.ts";
import { classes, link } from "./markup.ts";

/** Mirrors VitePress's `VPSidebar` + `VPSidebarGroup`. */
export function renderSidebar(
  sidebar: SidebarItem[],
  url: string,
  label: string,
) {
  const groups = sidebarGroups(sidebar)
    .map((item) => `<div class="group">${renderItem(item, 0, url)}</div>`)
    .join("");

  return `<aside class="VPSidebar"><div class="curtain"></div><nav class="nav" id="VPSidebarNav" aria-labelledby="sidebar-aria-label" tabindex="-1"><span class="visually-hidden" id="sidebar-aria-label">${escapeHtml(
    label,
  )}</span>${groups}</nav></aside>`;
}

/** Mirrors `VPSidebarItem`; collapsed items holding the current page start open. */
function renderItem(item: SidebarItem, depth: number, url: string): string {
  const children = item.items ?? [];
  const hasChildren = children.length > 0;
  const isActive = isActiveLink(item.link, url);
  const hasActive = isActive || children.some((child) => contains(child, url));
  const collapsible = item.collapsed != null;
  const collapsed = collapsible && item.collapsed && !hasActive;
  const textTag = hasChildren && depth < 5 ? `h${depth + 2}` : "p";
  const sectionTag = item.text && textTag !== "p" ? "section" : "div";

  const text = `<${textTag} class="text"><bdi>${item.text}</bdi></${textTag}>`;
  const caret =
    collapsible && hasChildren
      ? `<button type="button" class="caret" aria-label="toggle section" aria-expanded="${!collapsed}"><span class="vpi-chevron-right caret-icon"></span></button>`
      : "";
  const row = item.text
    ? `<div class="item"><div class="indicator"></div>${
        item.link
          ? link(
              {
                href: item.link,
                class: "link",
                current: isActive,
                rel: item.rel,
                target: item.target,
              },
              text,
            )
          : text
      }${caret}</div>`
    : "";
  const items = hasChildren
    ? `<ul class="items">${
        depth < 5
          ? `<li>${children.map((child) => renderItem(child, depth + 1, url)).join("")}</li>`
          : ""
      }</ul>`
    : "";

  return `<${sectionTag} class="${classes(
    "VPSidebarItem",
    `level-${depth}`,
    collapsible && "collapsible",
    collapsed && "collapsed",
    item.link && "is-link",
    isActive && "is-active",
    hasActive && "has-active",
  )}">${row}${items}</${sectionTag}>`;
}

function contains(item: SidebarItem, url: string): boolean {
  return (
    isActiveLink(item.link, url) ||
    (item.items ?? []).some((child) => contains(child, url))
  );
}
