---
title: Site Config
description: Every option lumePress() accepts.
outline: [2, 3]
nav:
  section: Reference
  sectionOrder: 3
  order: 1
---

# Site Config

All configuration goes to `lumePress()` in `_config.ts`. Only `title` and `description` are required.

```ts
import lume from "@lumeland/lume";
import lumePress from "@foundatiofx/lume-press";

const site = lume({ location: new URL("https://example.com/"), prettyUrls: true });

site.use(lumePress({
  title: "My Project",
  description: "Documentation for My Project",
}));

export default site;
```

The `LumePressOptions` type describes every option, so editors can complete and check them.

## Site

### title

- Type: `string`

The site's title: shown in the nav bar (unless [`brand.label`](#brand) is set) and appended to every page title.

### description

- Type: `string`

The default meta description, for pages without their own.

### lang

- Type: `string`
- Default: `"en-US"`

The `lang` attribute of every page, and the locale for dates. Pages can override it with `lang` front matter.

### location

- Type: `string | URL`
- Default: Lume's `location`

The site's public URL, for canonical links, Open Graph tags, and the sitemap. Set it once on `lume()` and LumePress picks it up.

### basePath

- Type: `string`
- Default: the path of `location`

The path the site is served from, like `/docs/` on a project's GitHub Pages site. Internal links and assets are prefixed with it.

### titleTemplate

- Type: `string | boolean`
- Default: `true`

The suffix for page titles, like VitePress's `titleTemplate`. By default a page's `<title>` is `Page | Site`.

```ts
lumePress({
  title: "My Project",
  titleTemplate: "Docs", // "Page | Docs"
  // titleTemplate: ":title - My Project", // ":title" is the page title
  // titleTemplate: false, // just "Page"
});
```

Pages can override it with [front matter](./frontmatter#titletemplate).

### head

- Type: `HeadEntry[]`

Extra tags for every page's `<head>`, as `[tag, attributes, content]` arrays or raw HTML strings.

```ts
lumePress({
  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["script", { async: true, src: "https://example.com/analytics.js" }],
  ],
});
```

### metas

- Type: `Partial<MetaData>`

Options for Lume's [metas plugin](https://lume.land/plugins/metas/), which writes the Open Graph and Twitter tags. LumePress fills in the title, description, icon, and language.

## Theme

### brand

- Type: `{ label?, logoLight?, logoDark?, icon?, themeColor? }`

The nav bar's logo and title, the favicon, and the browser theme color.

```ts
lumePress({
  brand: {
    label: "My Project",
    logoLight: "/logo.svg",
    logoDark: "/logo-dark.svg",
    icon: "/favicon.png",
    themeColor: "#3c8772",
  },
});
```

### nav, sidebar, social

The nav bar menu, the sidebar, and the social links. See [Navigation](./navigation).

### footer

- Type: `{ message?: string; copyright?: string }`

The site footer, shown on pages without a sidebar. Both may contain HTML.

```ts
lumePress({
  footer: {
    message: "Released under the MIT License.",
    copyright: "Copyright © 2026 My Company",
  },
});
```

### editLink

- Type: `{ pattern: string; text?: string }`

Adds an "Edit this page" link to the doc footer. `:path` in the pattern is the page's source path.

```ts
lumePress({
  editLink: {
    pattern: "https://github.com/org/repo/edit/main/docs/:path",
    text: "Edit this page on GitHub",
  },
});
```

### lastUpdated

- Type: `boolean | { git?: boolean; text?: string }`

Shows when each page last changed, in the doc footer and the sitemap. The time comes from `lastmod` front matter, then the file's last git commit (with `git: true`) or its modification time.

```ts
lumePress({
  lastUpdated: { git: true, text: "Updated at" },
});
```

### outline

- Type: `{ level?: number | [number, number] | "deep"; label?: string }`
- Default: `{ level: 2, label: "On this page" }`

The default heading levels and title of the page outline. Pages can override it with [front matter](./frontmatter#outline).

### labels

- Type: `Partial<ThemeLabels>`

Every piece of UI text, for translating the theme: search, the nav and sidebar menus, prev/next, the appearance switch, copy buttons, container titles, and the 404 page. The defaults are VitePress's English strings.

```ts
lumePress({
  labels: {
    previousPage: "Page précédente",
    nextPage: "Page suivante",
    tip: "ASTUCE",
  },
});
```

## Markdown

### codeHighlight

- Type: `false | { themes?, languageAlias?, transformers? }`
- Default: `{ themes: { light: "github-light", dark: "github-dark" } }`

Shiki highlighting for code blocks. `themes` sets the light and dark themes, `languageAlias` maps extra fence languages to Shiki's, and `transformers` adds Shiki transformers after the built-in ones. `false` turns highlighting off.

```ts
lumePress({
  codeHighlight: {
    themes: { light: "catppuccin-latte", dark: "catppuccin-mocha" },
    languageAlias: { mylang: "ts" },
  },
});
```

These docs use a transformer to show the notation syntax, as VitePress's docs do. See this site's `_config.ts`.

### code

- Type: `{ lineNumbers?: boolean }`

`lineNumbers: true` shows line numbers on every code block. See [line numbers](./markdown#line-numbers).

### snippets

- Type: `false | { docsRoot?: string; repoRoot?: string; aliases?: Record<string, string> }`
- Default: `{ docsRoot: ".", repoRoot: ".." }`

Where [snippet imports](./markdown#import-code-snippets) and [includes](./markdown#markdown-file-inclusion) look for files. `@/` paths resolve from `docsRoot`, `~/` paths from `repoRoot`, and `aliases` adds more prefixes. Files outside these roots can't be read. `false` turns both directives off.

## Build

### docsRoot

- Type: `string`
- Default: `"guide"`

The folder whose pages get the [generated sidebar](./navigation#generated-from-front-matter).

### search

- Type: `boolean`
- Default: `true`

Builds the [local search](./outputs#local-search) index and shows the search box.

### llms, markdownMirrors

- Type: `boolean`
- Default: `true`

Generate [`llms.txt` files](./outputs#llm-files) and [markdown mirrors](./outputs#markdown-mirrors).

### sitemap

- Type: `boolean | SitemapOptions`
- Default: `true`

Options for Lume's [sitemap plugin](https://lume.land/plugins/sitemap/), or `false` to skip it.

### checkUrls

- Type: `boolean | CheckUrlsOptions`
- Default: `{ anchors: true, throw: true }`

Options for Lume's [check URLs plugin](https://lume.land/plugins/check_urls/), which reports broken internal links and anchors. `false` skips the check.

### redirects

- Type: `Record<string, string>`

Static redirect pages, from a path to a URL. See [redirects](./outputs#redirects).

### assets

- Type: `boolean | { baseUrl?: string | URL }`
- Default: `true`

Writes the theme's styles, scripts, and fonts to `/assets/`. `baseUrl` reads them from another location (like a CDN copy of the package) instead of the installed package.

### rawPagesDir

- Type: `string | false`
- Default: `"pages"`

A folder whose files are copied to the site root untouched, for finished HTML pages and other files that shouldn't go through Lume.

### ignore

- Type: `string[]`

Extra paths for Lume to ignore, added to the theme's defaults (`node_modules`, `README.md`, lockfiles, and build folders).
