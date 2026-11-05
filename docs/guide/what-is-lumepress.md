---
title: What is LumePress?
description: A Lume theme that renders markdown sites like VitePress's default theme.
nav:
  section: Introduction
  sectionOrder: 1
  order: 1
---

# What is LumePress?

LumePress is a [Lume](https://lume.land/) plugin that renders markdown sites the way [VitePress](https://vitepress.dev/)'s default theme does: the same layout, the same styles, and the same markdown extensions. You get VitePress's polished docs experience while keeping Lume's build pipeline, plugins, and plain static output.

<div class="tip custom-block" style="padding-top: 8px">

Just want to try it out? Skip to [Getting Started](./getting-started).

</div>

## Use cases

- **Documentation** for libraries and tools, with a sidebar, page outlines, previous/next links, edit links, and local search.
- **Project sites** that start as docs and grow: the home page supports a hero, features, and extra [home sections](./home-page#home-sections), and any page can opt out of the docs layout.
- **Sites read by machines** as well as people: every docs page also ships as markdown, with `llms.txt` and `llms-full.txt` indexes. See [Generated Outputs](./outputs).

## How it works

VitePress is a Vue app. LumePress renders the same HTML on the server, with no Vue:

- **Styles come from VitePress.** `vitepress.css` is generated from the VitePress package's own stylesheets and component styles, with Vue's scoping translated into plain CSS. See [VitePress Parity](./vitepress-parity).
- **Markdown matches VitePress.** The markdown-it plugins and Shiki setup are ports of VitePress's, so containers, alerts, code blocks, snippets, and includes render the same.
- **Behavior is small, plain JavaScript.** The nav, sidebar, outline tracking, code copy, code groups, appearance switch, and search are a few browser modules that mirror VitePress's components.

These docs are the proof. The same `docs/` folder also builds with VitePress (see `vitepress-reference/` in the repository), and the two sites are compared page by page.

## What's different

LumePress follows VitePress's naming wherever the two overlap, so its front matter and options will look familiar. The differences come from Lume:

- Configuration is passed to `lumePress()` in `_config.ts`, not `.vitepress/config.ts`.
- The sidebar can be **generated from front matter**, so adding a page doesn't mean editing a config file.
- Markdown pages can't contain Vue components. Built-in tags like `<Badge>` still work.

[Coming from VitePress](./coming-from-vitepress) covers the differences in detail.
