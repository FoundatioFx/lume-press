---
title: Coming from VitePress
description: How VitePress config, front matter, and markdown map to LumePress.
nav:
  section: Introduction
  sectionOrder: 1
  order: 3
---

# Coming from VitePress

Most of a VitePress site moves over unchanged: markdown, front matter, and the shape of `nav` and `sidebar`. What changes is where configuration lives, and anything that relies on Vue.

## Config

VitePress options split between the site config and `themeConfig`. LumePress takes one options object, passed to `lumePress()` in `_config.ts`, and some site-level settings belong to `lume()` instead.

| VitePress                                   | LumePress                                             |
| ------------------------------------------- | ----------------------------------------------------- |
| `title`, `description`, `lang`, `head`      | Same names                                            |
| `titleTemplate`                             | `titleTemplate`                                       |
| `base`                                      | `basePath`, or the path of `location`                 |
| `cleanUrls: true`                           | `prettyUrls: true` in `lume()`                        |
| `srcExclude`                                | `ignore`, or `site.ignore()`                          |
| `rewrites`                                  | `url` front matter (a Lume feature)                   |
| `lastUpdated: true`                         | `lastUpdated: { git: true }`                          |
| `sitemap.hostname`                          | `location` in `lume()`                                |
| `markdown.theme`                            | `codeHighlight.themes`                                |
| `markdown.languageAlias`                    | `codeHighlight.languageAlias`                         |
| `markdown.codeTransformers`                 | `codeHighlight.transformers`                          |
| `markdown.lineNumbers`                      | `code.lineNumbers`                                    |
| `themeConfig.logo`, `siteTitle`             | `brand.logoLight`, `brand.logoDark`, `brand.label`    |
| `themeConfig.nav`                           | `nav`, same shape                                     |
| `themeConfig.sidebar`                       | `sidebar`, same shape, or generated from front matter |
| `themeConfig.socialLinks`                   | `social`, with `label` instead of `ariaLabel`         |
| `themeConfig.footer`, `editLink`, `outline` | `footer`, `editLink`, `outline`                       |
| `themeConfig.lastUpdated.text`              | `lastUpdated.text`                                    |
| `themeConfig.search.provider: "local"`      | `search: true` (the default)                          |
| Labels like `docFooter`, `returnToTopLabel` | `labels`                                              |

The public folder isn't automatic in Lume. Add `site.copy("public", ".")` to serve its files from the site root.

## Front matter

These keys work the same way: `layout` (`doc`, `page`, `home`, or `false`), `title`, `titleTemplate`, `description`, `head`, `hero`, `features`, `navbar`, `sidebar`, `aside`, `outline`, `editLink`, `lastUpdated`, `prev`, `next`, `footer`, `pageClass`, and `search`.

LumePress adds `nav`, which places a page in the generated sidebar, and `homeSections` for the home page. See [Front Matter](./frontmatter).

## Markdown

Every VitePress markdown extension that doesn't need Vue is supported, with the same syntax: custom containers, GitHub alerts, code highlighting and notation, line numbers, code groups, snippet imports, file includes, `[[toc]]`, emoji, and header anchors. [Markdown Extensions](./markdown) demonstrates each one.

## Not supported

These VitePress features depend on Vue or aren't ported yet:

- Vue in markdown: components (other than `<Badge>`), `<script setup>`, and template interpolation.
- Custom themes and layout slots. Use Lume layouts and processors instead.
- Internationalization, Algolia search, math equations, and the team page components.
- `aside: left` and the `appearance` options.

## Extras

LumePress also does things the VitePress default theme doesn't:

- **A sidebar from front matter**: each page sets its section and order, so adding a page doesn't mean editing the config. See [Navigation](./navigation#sidebar).
- **Home sections**: extra blocks with text, buttons, and cards on the home page. See [Home Page](./home-page#home-sections).
- **Mermaid** diagrams from `mermaid` code blocks. See [Markdown Extensions](./markdown#mermaid-diagrams).
- **LLM files and markdown mirrors**, redirects, a sitemap, and link checking. See [Generated Outputs](./outputs).
