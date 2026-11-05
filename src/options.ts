import { socialIconStyles } from "./icons.ts";
import type {
  FoundatioThemeOptions,
  ResolvedFoundatioThemeOptions,
  ThemeLabels,
} from "./types.ts";
import { normalizeDocsRoot } from "./urls.ts";

/** English UI text, matching VitePress's defaults. */
const defaultLabels: ThemeLabels = {
  search: "Search",
  searchPlaceholder: "Search",
  searchNoResults: "No results for",
  searchReset: "Reset search",
  searchBack: "Close search",
  searchDetailedList: "Display detailed list",
  searchNavigate: "to navigate",
  searchSelect: "to select",
  searchClose: "to close",
  navMenu: "Menu",
  extraMenu: "More options",
  sidebarMenu: "Menu",
  sidebar: "Sidebar Navigation",
  returnTop: "Return to top",
  previousPage: "Previous page",
  nextPage: "Next page",
  pager: "Pager",
  darkModeSwitch: "Appearance",
  darkModeSwitchTitle: "Switch to dark theme",
  lightModeSwitchTitle: "Switch to light theme",
  skipToContent: "Skip to content",
  codeCopy: "Copy code",
  codeCopied: "Copied",
  tip: "TIP",
  info: "INFO",
  warning: "WARNING",
  danger: "DANGER",
  details: "Details",
  note: "NOTE",
  important: "IMPORTANT",
  caution: "CAUTION",
  notFoundTitle: "PAGE NOT FOUND",
  notFoundQuote:
    "But if you don't change your direction, and if you keep looking, you may end up where you are heading.",
  notFoundLink: "Take me home",
  notFoundLinkLabel: "go to home",
};

export function resolveOptions(
  options: FoundatioThemeOptions,
): ResolvedFoundatioThemeOptions {
  const docsRoot = normalizeDocsRoot(options.docsRoot ?? "guide");
  const location =
    typeof options.location === "string"
      ? new URL(options.location)
      : options.location;
  const lastUpdated = options.lastUpdated === true ? {} : options.lastUpdated;
  const brand = options.brand ?? {};

  return {
    title: options.title,
    description: options.description,
    lang: options.lang ?? "en-US",
    location,
    basePath: normalizeBasePath(options.basePath ?? location?.pathname ?? "/"),
    docsRoot,
    head: options.head ?? [],
    metas: { robots: true, ...options.metas },
    labels: { ...defaultLabels, ...options.labels },
    brand: {
      label: brand.label ?? options.title,
      logoLight: brand.logoLight ?? brand.icon ?? "",
      logoDark: brand.logoDark ?? brand.logoLight ?? brand.icon ?? "",
      icon: brand.icon ?? brand.logoLight ?? "",
      themeColor: brand.themeColor ?? "#3c8772",
    },
    sidebar: options.sidebar,
    titleTemplate: options.titleTemplate ?? true,
    nav: options.nav ?? [{ text: "Guide", link: `/${docsRoot}/` }],
    social: options.social ?? [],
    socialIconStyles: socialIconStyles(options.social ?? []),
    footer: {
      message: options.footer?.message ?? "",
      copyright: options.footer?.copyright ?? "",
    },
    editLink: options.editLink && {
      pattern: options.editLink.pattern,
      text: options.editLink.text ?? "Edit this page",
    },
    lastUpdated: lastUpdated
      ? {
          git: lastUpdated.git ?? false,
          text: lastUpdated.text ?? "Last updated",
        }
      : false,
    outline: {
      level: options.outline?.level ?? 2,
      label: options.outline?.label ?? "On this page",
    },
    sitemap:
      options.sitemap === false
        ? false
        : {
            // Without last-updated dates, point lastmod at a key pages never have.
            items: { lastmod: lastUpdated ? "=lastmod" : "=__noLastmod" },
            ...(typeof options.sitemap === "object" ? options.sitemap : {}),
          },
    checkUrls:
      options.checkUrls === false
        ? false
        : {
            anchors: true,
            throw: true,
            ...(typeof options.checkUrls === "object" ? options.checkUrls : {}),
          },
    codeHighlight:
      options.codeHighlight === false
        ? false
        : {
            themes: {
              light: options.codeHighlight?.themes?.light ?? "github-light",
              dark: options.codeHighlight?.themes?.dark ?? "github-dark",
            },
            languageAlias: options.codeHighlight?.languageAlias ?? {},
          },
    code: { lineNumbers: options.code?.lineNumbers ?? false },
    snippets:
      options.snippets === false
        ? false
        : {
            docsRoot: options.snippets?.docsRoot ?? ".",
            repoRoot: options.snippets?.repoRoot ?? "..",
            aliases: options.snippets?.aliases ?? {},
          },
    redirects: options.redirects ?? {},
    llms: options.llms ?? true,
    markdownMirrors: options.markdownMirrors ?? true,
    search: options.search ?? true,
    assets: options.assets !== false,
    assetBaseUrl:
      typeof options.assets === "object" && options.assets.baseUrl
        ? new URL(options.assets.baseUrl)
        : undefined,
    rawPagesDir:
      options.rawPagesDir === undefined ? "pages" : options.rawPagesDir,
    ignore: [
      ".build",
      ".npmrc",
      ".vitepress",
      "_lume",
      "_site",
      "_theme",
      "node_modules",
      "package-lock.json",
      "package.json",
      "pnpm-lock.yaml",
      "README.md",
      ...(options.ignore ?? []),
    ],
  };
}

function normalizeBasePath(path: string) {
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}
