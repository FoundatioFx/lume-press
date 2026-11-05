import { escapeAttribute, escapeHtml } from "../html.ts";
import type { ThemePage } from "../lume.ts";
import { pageTitle } from "../metas.ts";
import { pageData, pageLayout, sourcePath } from "../pages.ts";
import { sidebarLinks, uniqueLinks } from "../navigation.ts";
import type {
  DocsData,
  ResolvedFoundatioThemeOptions,
  SidebarItem,
} from "../types.ts";
import { renderDoc, renderLocalNav } from "./doc.ts";
import { renderHead } from "./head.ts";
import { renderHome } from "./home.ts";
import { classes } from "./markup.ts";
import { renderNav } from "./nav.ts";
import {
  outlineHeadings,
  renderTableOfContents,
  resolveOutline,
} from "./outline.ts";
import { renderSidebar } from "./sidebar.ts";

/** Renders a markdown page inside VitePress's `Layout`. */
export function renderDocument(options: {
  page: ThemePage;
  body: string;
  /** The page's sidebar, already resolved for its URL. */
  sidebar: SidebarItem[];
  theme: ResolvedFoundatioThemeOptions;
}): string {
  const { theme } = options;
  const data = pageData(options.page);
  const layout = pageLayout(data);
  const isHome = layout === "home";
  const outline = resolveOutline(data, theme);
  const headings = outlineHeadings(data.headings ?? [], outline);
  const hasSidebar =
    layout === "doc" && data.sidebar !== false && options.sidebar.length > 0;
  const body = options.body.replace(
    /<nav class="table-of-contents" data-toc(?:="")?><\/nav>/g,
    () => renderTableOfContents(data.headings ?? []),
  );

  const content = isHome
    ? renderHome(data, body)
    : layout === "page"
      ? `<div class="VPPage"><div style="position:relative;"><div>${body}</div></div></div>`
      : renderDoc({
          data,
          content: body,
          sourcePath: sourcePath(options.page),
          pages: uniqueLinks(sidebarLinks(options.sidebar)),
          outline,
          headings,
          hasSidebar,
          theme,
        });

  return renderLayout({
    title: pageTitle(data, theme),
    data,
    theme,
    isHome,
    hasSidebar,
    hasLocalNav: headings.length > 0,
    localNav: isHome
      ? ""
      : renderLocalNav({ headings, outline, hasSidebar, theme }),
    sidebar: hasSidebar
      ? renderSidebar(options.sidebar, data.url, theme.labels.sidebar)
      : "",
    content,
  });
}

/** Mirrors VitePress's `NotFound` page. */
export function renderNotFound(theme: ResolvedFoundatioThemeOptions): string {
  const { labels } = theme;
  const data = { url: "/404.html", title: labels.notFoundTitle };
  return renderLayout({
    title: pageTitle(data, theme),
    data,
    theme,
    isHome: false,
    hasSidebar: false,
    hasLocalNav: false,
    localNav: "",
    sidebar: "",
    content: `<div class="NotFound"><p class="code">404</p><h1 class="title"><bdi>${escapeHtml(
      labels.notFoundTitle,
    )}</bdi></h1><div class="divider"></div><blockquote class="quote"><bdi>${escapeHtml(
      labels.notFoundQuote,
    )}</bdi></blockquote><div class="action"><a class="link" href="/" aria-label="${escapeAttribute(
      labels.notFoundLinkLabel,
    )}"><bdi>${escapeHtml(labels.notFoundLink)}</bdi></a></div></div>`,
  });
}

function renderLayout(options: {
  title: string;
  data: DocsData;
  theme: ResolvedFoundatioThemeOptions;
  isHome: boolean;
  hasSidebar: boolean;
  hasLocalNav: boolean;
  localNav: string;
  sidebar: string;
  content: string;
}): string {
  const { data, theme } = options;
  const nav =
    data.navbar === false
      ? ""
      : renderNav({
          theme,
          url: data.url,
          isHome: options.isHome,
          hasSidebar: options.hasSidebar,
          hasLocalNav: options.hasLocalNav,
        });
  const footer =
    data.footer !== false && (theme.footer.message || theme.footer.copyright)
      ? `<footer class="${classes("VPFooter", options.hasSidebar && "has-sidebar")}"><div class="container">${
          theme.footer.message
            ? `<p class="message"><bdi>${theme.footer.message}</bdi></p>`
            : ""
        }${theme.footer.copyright ? `<p class="copyright"><bdi>${theme.footer.copyright}</bdi></p>` : ""}</div></footer>`
      : "";

  return `<!doctype html>
<html lang="${escapeAttribute(data.lang ?? theme.lang)}" dir="ltr">
<head>
${renderHead({ title: options.title, data, theme })}
</head>
<body>
  <div id="app"><div class="${classes("Layout", data.pageClass)}">
    <span tabindex="-1"></span>
    <a href="#VPContent" class="VPSkipLink visually-hidden">${escapeHtml(theme.labels.skipToContent)}</a>
    <div class="VPBackdrop backdrop" hidden></div>
    ${nav}
    ${options.localNav}
    ${options.sidebar}
    <div class="${classes("VPContent", options.hasSidebar && "has-sidebar", options.isHome && "is-home")}" id="VPContent">${options.content}</div>
    ${footer}
  </div></div>
  <script type="module" src="/assets/site.js"></script>
</body>
</html>`;
}
