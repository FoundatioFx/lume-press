---
title: Generated Outputs
description: Local search, LLM files, markdown mirrors, redirects, and the sitemap.
nav:
  section: Reference
  sectionOrder: 3
  order: 3
  badge:
    text: extra
    type: tip
---

# Generated Outputs

Besides the HTML pages, LumePress writes files that help readers, search engines, and LLMs find their way around. Each can be turned off in the [config](./config#build).

## Local search

Press <kbd>/</kbd> or <kbd>Ctrl</kbd> <kbd>K</kbd> (<kbd>⌘</kbd> <kbd>K</kbd> on a Mac) to search this site. The search box is VitePress's, with the same keyboard navigation, fuzzy matching, and "detailed list" view.

The index is `/search-index.json`, with one entry per heading: its title, the headings above it, and its text. Pages with `search: false` front matter are left out.

## LLM files

[`/llms.txt`](https://llmstxt.org/) is a table of contents for the docs, grouped like the sidebar, linking to each page's markdown mirror. `/llms-full.txt` has every docs page's markdown in one file, in sidebar order.

Try them on this site: [llms.txt](/llms.txt), [llms-full.txt](/llms-full.txt).

## Markdown mirrors

Each docs page is also published as markdown next to its HTML, with snippet imports and includes already expanded. This page's mirror is `/guide/outputs.md`.

## Redirects

`redirects` maps old paths to new URLs, as static pages that redirect at once and keep the URL's `#hash`:

```ts
lumePress({
  redirects: {
    "/guide/old-page/": "/guide/new-page/",
    "/discord/": "https://discord.gg/invite",
  },
});
```

With `prettyUrls`, the old `.html` URL of every page redirects to its new one too, so `/guide/outputs.html` still works.

## Sitemap

`/sitemap.xml` lists every page, with its last updated time when [`lastUpdated`](./config#lastupdated) is on. It uses Lume's sitemap plugin, so its options apply.

## 404 page

`/404.html` is VitePress's not-found page. GitHub Pages and most static hosts serve it for missing URLs.

## Link checking

Lume's check URLs plugin runs on every build and reports internal links or anchors that point nowhere, so broken links are caught before they're deployed.
