import type {
  NavLink,
  ResolvedLumePressOptions,
  SocialLink,
} from "../types.ts";
import { socialIconName } from "../icons.ts";
import { normalizeHref } from "../urls.ts";
import { escapeAttribute, escapeHtml } from "../html.ts";
import { attrs, classes, link } from "./markup.ts";

type NavState = {
  theme: ResolvedLumePressOptions;
  url: string;
  isHome: boolean;
  hasSidebar: boolean;
  hasLocalNav: boolean;
};

/** Mirrors VitePress's `VPNav`. */
export function renderNav(state: NavState): string {
  const { theme } = state;
  return `<header class="VPNav">
  <div class="${classes(
    "VPNavBar",
    state.hasSidebar && "has-sidebar",
    !state.isHome && state.hasLocalNav && "has-local-nav",
    state.isHome && "home",
    "top",
  )}">
    <div class="wrapper"><div class="container">
      <div class="title">${renderNavBarTitle(theme, state.hasSidebar)}</div>
      <div class="content"><div class="content-body">
        ${theme.search ? renderSearchButton(theme) : ""}
        ${renderNavMenu(theme.nav, state.url, false)}
        ${renderNavAppearance(theme, "bar")}
        ${renderSocialLinks(theme.social, "VPNavSocialLinks VPNavBarSocialLinks social-links")}
        ${renderNavBarExtra(theme, state.url)}
        <button type="button" class="VPNavBarHamburger hamburger" aria-label="${escapeAttribute(theme.labels.navMenu)}" aria-expanded="false" aria-controls="VPNavScreen"><span class="container" aria-hidden="true"><span class="top"></span><span class="middle"></span><span class="bottom"></span></span></button>
      </div></div>
    </div></div>
    <div class="divider"><div class="divider-line"></div></div>
  </div>
  <div class="VPNavScreen" id="VPNavScreen" hidden><div class="container">
    ${renderNavMenu(theme.nav, state.url, true)}
    ${renderNavAppearance(theme, "screen")}
    ${renderSocialLinks(theme.social, "VPNavSocialLinks VPNavScreenSocialLinks social-links")}
  </div></div>
</header>`;
}

function renderNavBarTitle(
  theme: ResolvedLumePressOptions,
  hasSidebar: boolean,
) {
  const { brand } = theme;
  const logo =
    brand.logoLight && brand.logoDark && brand.logoLight !== brand.logoDark
      ? `<img class="VPImage dark logo" src="${escapeAttribute(brand.logoDark)}" alt=""><img class="VPImage light logo" src="${escapeAttribute(brand.logoLight)}" alt="">`
      : brand.logoLight
        ? `<img class="VPImage logo" src="${escapeAttribute(brand.logoLight)}" alt="">`
        : "";
  return `<div class="${classes("VPNavBarTitle", hasSidebar && "has-sidebar")}"><a class="title" href="/"${attrs(
    {
      title: brand.label,
    },
  )}>${logo}<span dir="auto">${escapeHtml(brand.label)}</span></a></div>`;
}

function renderSearchButton(theme: ResolvedLumePressOptions) {
  const label = escapeAttribute(theme.labels.search);
  return `<div class="VPNavBarSearch search"><button type="button" class="VPNavBarSearchButton" aria-label="${label}" aria-keyshortcuts="/ control+k meta+k"><span class="vpi-search" aria-hidden="true"></span><span class="text">${escapeHtml(
    theme.labels.search,
  )}</span><span class="keys" aria-hidden="true"><kbd class="key-mod"></kbd><kbd class="key-k"></kbd></span></button></div>`;
}

/** Mirrors `VPNavMenu`: the bar menu (`screen: false`) or the mobile screen menu. */
function renderNavMenu(nav: NavLink[], url: string, screen: boolean) {
  if (nav.length === 0) {
    return "";
  }

  const items = nav
    .map(
      (item, index) =>
        `<li>${item.items?.length ? renderNavMenuGroup(item, url, screen, index) : renderNavMenuLink(item, url, screen)}</li>`,
    )
    .join("");
  return `<nav aria-label="Main Navigation" class="${classes(
    "VPNavMenu",
    screen ? "VPNavScreenMenu" : "VPNavBarMenu",
    "menu",
  )}"><ul class="list">${items}</ul></nav>`;
}

function renderNavMenuLink(item: NavLink, url: string, screen: boolean) {
  return link(
    {
      href: item.link,
      class: classes(
        "VPNavMenuLink",
        screen ? "VPNavScreenMenuLink" : "VPNavBarMenuLink",
        isActive(item, url) && "active",
      ),
      current: isCurrent(item, url),
      target: item.target,
      rel: item.rel,
      noIcon: item.noIcon,
    },
    `<span dir="auto">${escapeHtml(item.text)}</span>`,
  );
}

/** `index` is the group's position in the nav, which keeps its element ids unique. */
function renderNavMenuGroup(
  item: NavLink,
  url: string,
  screen: boolean,
  index: number,
): string {
  const children = item.items ?? [];
  if (screen) {
    const id = `NavScreenGroup-${index}`;
    return `<div class="${classes("VPNavMenuGroup", "VPNavScreenMenuGroup", isActive(item, url) && "active")}"><button type="button" class="button" aria-expanded="false" aria-controls="${id}"><span class="button-text" dir="auto">${escapeHtml(
      item.text,
    )}</span><span class="vpi-plus button-icon" aria-hidden="true"></span></button><ul id="${id}" class="items" hidden>${children
      .map((child) => renderMenuItem(child, url, true))
      .join("")}</ul></div>`;
  }

  return renderFlyout({
    class: classes(
      "VPNavMenuGroup",
      "VPNavBarMenuGroup",
      isActive(item, url) && "active",
    ),
    button: item.text,
    id: `Flyout-${index}`,
    menu: `<ul class="items">${children.map((child) => renderMenuItem(child, url, false)).join("")}</ul>`,
  });
}

/** Mirrors `VPMenuLink` and `VPMenuGroup`. */
function renderMenuItem(item: NavLink, url: string, screen: boolean): string {
  if (item.items?.length) {
    const hasSubGroups = item.items.some((child) => child.items?.length);
    return `<li class="${classes("VPMenuGroup", screen && "VPNavScreenMenuGroupSection")}">${
      item.text ? `<p class="title">${escapeHtml(item.text)}</p>` : ""
    }<ul${attrs({ class: hasSubGroups ? "sub-groups" : undefined })}>${item.items
      .map((child) => renderMenuItem(child, url, screen))
      .join("")}</ul></li>`;
  }

  return `<li class="VPMenuLink">${link(
    {
      href: item.link,
      class: classes(
        isActive(item, url) && "active",
        screen && "VPNavScreenMenuGroupLink",
      ),
      current: isCurrent(item, url),
      target: item.target,
      rel: item.rel,
      noIcon: item.noIcon,
    },
    `<span dir="auto">${escapeHtml(item.text)}</span>`,
  )}</li>`;
}

/**
 * Mirrors `VPNavBarExtra`, the `⋯` menu. It holds a copy of everything the
 * bar can collapse into it; `client/nav-overflow.js` measures the bar and
 * keeps only what doesn't fit, hiding the menu when nothing is collapsed.
 */
function renderNavBarExtra(theme: ResolvedLumePressOptions, url: string) {
  const items = theme.nav
    .map((item) => renderMenuItem(item, url, false))
    .join("");
  const social = theme.social.length
    ? `<div class="group" data-overflow="socialLinks"><div class="item social-links">${renderSocialLinks(
        theme.social,
        "social-links-list",
      )}</div></div>`
    : "";

  return `<div class="VPFlyout VPNavBarExtra extra" hidden><button type="button" class="button" aria-expanded="false" aria-controls="VPNavBarExtraMenu" aria-label="${escapeAttribute(
    theme.labels.extraMenu,
  )}"><span class="vpi-ellipsis icon" aria-hidden="true"></span></button><div class="menu" id="VPNavBarExtraMenu"><div class="VPMenu">${
    items ? `<ul class="group overflow-items">${items}</ul>` : ""
  }<div class="group" data-overflow="appearance">${renderNavAppearance(theme, "menu")}</div>${social}</div></div></div>`;
}

/** Mirrors `VPFlyout` with a text button. */
function renderFlyout(options: {
  class: string;
  button: string;
  menu: string;
  id: string;
}) {
  const { id } = options;
  return `<div class="${classes("VPFlyout", options.class)}"><button type="button" class="button" aria-expanded="false" aria-controls="${id}"><span class="text"><span dir="auto">${escapeHtml(
    options.button,
  )}</span><span class="vpi-chevron-down text-icon" aria-hidden="true"></span></span></button><div class="menu" id="${id}"><div class="VPMenu">${options.menu}</div></div></div>`;
}

/** Mirrors `VPNavAppearance` + `VPSwitchAppearance`: in the bar, the `⋯` menu, or the nav screen. */
function renderNavAppearance(
  theme: ResolvedLumePressOptions,
  variant: "bar" | "menu" | "screen",
) {
  const label = theme.labels.darkModeSwitch;
  const switchButton = (labelledBy?: string) =>
    `<button class="VPSwitch VPSwitchAppearance" type="button" role="switch"${attrs(
      {
        title: theme.labels.darkModeSwitchTitle,
        "aria-label": label,
        "aria-checked": "false",
        "aria-labelledby": labelledBy,
      },
    )}><span class="check"><span class="icon"><span class="vpi-sun sun" aria-hidden="true"></span><span class="vpi-moon moon" aria-hidden="true"></span></span></span></button>`;

  if (variant === "bar") {
    return `<div class="VPNavAppearance VPNavBarAppearance appearance">${switchButton()}</div>`;
  }

  const id = `appearance-label-${variant}`;
  return `<div class="${classes(
    "VPNavAppearance",
    variant === "screen"
      ? "VPNavScreenAppearance appearance"
      : "menu-appearance",
  )}"><p id="${id}" class="text">${escapeHtml(
    label,
  )}</p>${switchButton(id)}</div>`;
}

/** Mirrors `VPSocialLinks` + `VPSocialLink`. */
function renderSocialLinks(links: SocialLink[], className: string) {
  if (links.length === 0) {
    return "";
  }

  return `<ul class="${classes("VPSocialLinks", className)}">${links
    .map((social) => {
      const name = socialIconName(social);
      const icon = name
        ? `<span class="vpi-simple-icons-${escapeAttribute(name)}"></span>`
        : `<span class="VPIcon">${social.icon}</span>`;
      return `<li><a class="VPSocialLink no-icon" href="${escapeAttribute(social.link)}" aria-label="${escapeAttribute(
        social.label,
      )}" target="_blank" rel="me noopener">${icon}</a></li>`;
    })
    .join("")}</ul>`;
}

function isCurrent(item: NavLink, url: string) {
  return Boolean(item.link) && normalizeHref(item.link!) === url;
}

function isActive(item: NavLink, url: string): boolean {
  if (item.activeMatch) {
    return new RegExp(item.activeMatch).test(url);
  }

  return (
    isCurrent(item, url) ||
    (item.items?.some((child) => isActive(child, url)) ?? false)
  );
}
