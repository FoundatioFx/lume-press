import { statSync } from "node:fs";
import { join } from "node:path";
import basePath from "@lumeland/plugin-base-path";
import checkUrls from "@lumeland/plugin-check-urls";
import markdown from "@lumeland/plugin-markdown";
import metas from "@lumeland/plugin-metas";
import sitemap from "@lumeland/plugin-sitemap";
import { readThemeAsset, themeAssets } from "./assets.ts";
import { expandAuthoringDirectives } from "./authoring.ts";
import { loadPageLanguages } from "./code.ts";
import {
  escapeAttribute,
  escapeHtml,
  extractHeadings,
  inlineJson,
} from "./html.ts";
import { applyLastUpdated } from "./last-updated.ts";
import { createGeneratedPage, type ThemePage, type ThemeSite } from "./lume.ts";
import { markdownOptions } from "./markdown.ts";
import { pageMetas } from "./metas.ts";
import {
  buildSidebar,
  resolveSidebar,
  resolveSidebars,
  sidebarGroups,
} from "./navigation.ts";
import { resolveOptions } from "./options.ts";
import {
  renderLlmsFull,
  renderLlmsIndex,
  renderMarkdownMirror,
} from "./outputs/llms.ts";
import { buildSearchIndex } from "./outputs/search.ts";
import { isMarkdownPage, pageData, readLayout, sourcePath } from "./pages.ts";
import { transformBadgeTags } from "./render/badge.ts";
import { socialIconStylesUrl } from "./render/head.ts";
import { renderDocument, renderNotFound } from "./render/layout.ts";
import type {
  ContentEntry,
  LumePressOptions,
  ResolvedLumePressOptions,
} from "./types.ts";
import {
  isDocsPath,
  legacyHtmlUrl,
  markdownMirrorUrl,
  normalizeInternalLinks,
} from "./urls.ts";

export type {
  Action,
  Badge,
  CodeHighlightOptions,
  DocsData,
  Feature,
  HeadEntry,
  HeroImage,
  HomeSection,
  LumePressOptions,
  NavLink,
  NavMeta,
  Sidebar,
  SidebarItem,
  SocialLink,
  ThemeLabels,
} from "./types.ts";

/** Lume plugin that renders markdown pages like the VitePress default theme. */
export default function lumePress(
  options: LumePressOptions,
): (site: ThemeSite) => void {
  return (site) => {
    // Lume's default location is a localhost placeholder, not a real site URL.
    const siteLocation = site.options.location;
    applyTheme(
      site,
      resolveOptions({
        ...options,
        location:
          options.location ??
          (siteLocation.hostname === "localhost" ? undefined : siteLocation),
      }),
    );
  };
}

function applyTheme(site: ThemeSite, theme: ResolvedLumePressOptions) {
  // Markdown after snippets and includes are expanded, for mirrors and LLM files.
  const expandedMarkdown = new WeakMap<ThemePage, string>();
  const srcDir = site.src();

  site.ignore(...theme.ignore);
  site.use(markdown(markdownOptions(theme)));

  if (
    theme.rawPagesDir &&
    statSync(join(srcDir, theme.rawPagesDir), {
      throwIfNoEntry: false,
    })?.isDirectory()
  ) {
    site.copy(theme.rawPagesDir, ".");
  }

  site.preprocess([".md"], async (pages) => {
    for (const page of pages) {
      const data = pageData(page);
      readLayout(data);
      applyLastUpdated(page, theme);

      // Markdown pages keep their source in `data.content` until rendered.
      const file = page.src.entry?.src;
      if (typeof data.content === "string" && file) {
        const source = expandAuthoringDirectives(
          data.content,
          file,
          srcDir,
          theme,
        );
        data.content = source;
        expandedMarkdown.set(page, source);
        if (theme.codeHighlight) {
          await loadPageLanguages(source, theme.codeHighlight);
        }
      }
    }
  });

  site.process([".html"], async (pages, allPages) => {
    const emit = (url: string, content: string | Uint8Array) =>
      allPages.push(
        createGeneratedPage({ url, content, unlisted: true, search: false }),
      );

    if (theme.assets) {
      for (const name of themeAssets) {
        emit(`/assets/${name}`, await readThemeAsset(theme, name));
      }
    }

    const entries: ContentEntry[] = pages.filter(isMarkdownPage).map((page) => {
      const data = pageData(page);
      const html = transformBadgeTags(
        // Relative links resolve against the source file, like VitePress.
        normalizeInternalLinks(page.text, sourcePath(page)),
      );
      data.headings = extractHeadings(html);
      return {
        page,
        data,
        sourcePath: sourcePath(page),
        html,
        markdown: expandedMarkdown.get(page) ?? "",
      };
    });

    const docsEntries = entries.filter((entry) =>
      isDocsPath(entry.sourcePath, theme.docsRoot),
    );
    const sidebar = theme.sidebar ?? {
      [`/${theme.docsRoot}/`]: buildSidebar(
        docsEntries.map((entry) => entry.page),
        theme.docsRoot,
      ),
    };

    for (const entry of entries) {
      entry.data.metas = pageMetas(entry.data, theme);
      entry.page.content = renderDocument({
        page: entry.page,
        body: entry.html,
        sidebar: resolveSidebar(sidebar, entry.data.url),
        theme,
      });
      addImageDefaults(entry.page);
    }

    if (theme.socialIconStyles) {
      emit(socialIconStylesUrl, theme.socialIconStyles);
    }
    if (theme.search) {
      emit("/search-index.json", JSON.stringify(buildSearchIndex(entries)));
    }
    if (theme.markdownMirrors) {
      for (const entry of docsEntries) {
        emit(markdownMirrorUrl(entry.data.url), renderMarkdownMirror(entry));
      }
    }
    if (theme.llms) {
      const home = entries.find((entry) => entry.data.url === "/")?.data;
      const groups = resolveSidebars(sidebar).flatMap(sidebarGroups);
      emit("/llms.txt", renderLlmsIndex(groups, theme, home));
      emit("/llms-full.txt", renderLlmsFull(entries, groups));
    }
    for (const [from, to] of Object.entries(theme.redirects)) {
      emit(from, renderRedirect(to));
    }
    for (const entry of entries) {
      const legacyUrl = legacyHtmlUrl(entry.data.url);
      if (legacyUrl) {
        emit(legacyUrl, renderRedirect(entry.data.url));
      }
    }
    emit("/404.html", renderNotFound(theme));
  });

  site.use(metas());
  if (theme.checkUrls) {
    site.use(checkUrls(theme.checkUrls));
  }
  if (theme.sitemap) {
    site.use(sitemap(theme.sitemap));
  }
  if (theme.basePath !== "/") {
    site.use(basePath());
  }
}

/** Images decode off the main thread and, below the fold, load lazily. */
function addImageDefaults(page: ThemePage) {
  for (const image of page.document.querySelectorAll("img")) {
    if (!image.hasAttribute("decoding")) {
      image.setAttribute("decoding", "async");
    }
    if (
      !image.hasAttribute("loading") &&
      !image.classList.contains("image-src") &&
      !image.closest(".VPNavBarTitle")
    ) {
      image.setAttribute("loading", "lazy");
    }
  }
}

/** A static redirect page that keeps the URL hash. */
function renderRedirect(target: string) {
  const href = escapeAttribute(target);
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${href}"><link rel="canonical" href="${href}"><title>Redirecting...</title><script>const target=${inlineJson(
    target,
  )};window.location.replace(target+(target.includes("#")?"":window.location.hash));</script></head><body><p>Redirecting to <a href="${href}">${escapeHtml(target)}</a>.</p></body></html>`;
}
