---
title: Getting Started
description: Install LumePress, add it to a Lume site, and write your first pages.
nav:
  section: Introduction
  sectionOrder: 1
  order: 2
---

# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) 24 or later.
- A [Lume 4](https://lume.land/) site, or an empty folder to start one in.

## Installation

Add Lume and LumePress to your project:

::: code-group

```sh [pnpm]
$ pnpm add -D @lumeland/lume @foundatiofx/lume-press
```

```sh [npm]
$ npm add -D @lumeland/lume @foundatiofx/lume-press
```

```sh [yarn]
$ yarn add -D @lumeland/lume @foundatiofx/lume-press
```

```sh [bun]
$ bun add -D @lumeland/lume @foundatiofx/lume-press
```

:::

Then register the plugin in your Lume config. The code below is a real file in this repo, pulled in with a [snippet import](./markdown#import-code-snippets):

<<< @/_snippets/config.ts#setup [_config.ts]

`title` and `description` are the only required options. [Site Config](./config) lists the rest.

## File structure

A typical docs site keeps its guide pages in a folder (`guide` by default) next to the home page:

```
.
├─ _config.ts
├─ index.md
├─ guide
│  ├─ getting-started.md
│  └─ configuration.md
├─ public
│  └─ logo.svg
└─ package.json
```

Markdown pages under `guide/` get the docs layout with a generated sidebar. `index.md` with `layout: home` becomes the [home page](./home-page). Files in `public/` need a `site.copy("public", ".")` in your config to be served from the site root.

## Writing pages

Each page is ordinary markdown with front matter. The `nav` key places it in the sidebar:

```md [guide/configuration.md]
---
title: Configuration
nav:
  section: Guide
  order: 2
---

# Configuration

Pages support every [markdown extension](/guide/markdown).
```

Pages are grouped into sidebar sections by `nav.section` and sorted by `nav.order`. [Navigation](./navigation#sidebar) covers the details, including how to write the sidebar by hand instead.

## Up and running

Add scripts to `package.json`:

```json [package.json]
{
  "scripts": {
    "docs:dev": "lume build --serve",
    "docs:build": "lume build"
  }
}
```

`docs:dev` starts a live-reloading server at `http://localhost:3000`. `docs:build` writes the site to `_site/`, ready to deploy to any static host.

::: tip Pretty URLs
Set `prettyUrls: true` in `lume()` so pages build to `guide/page/index.html`. Static hosts like GitHub Pages then serve `/guide/page/` without extra configuration, and LumePress adds redirects from the old `.html` URLs.
:::

## What's next

- See what markdown can do in [Markdown Extensions](./markdown).
- Set up the [home page](./home-page) and the [navigation](./navigation).
- Moving a VitePress site? Read [Coming from VitePress](./coming-from-vitepress).
