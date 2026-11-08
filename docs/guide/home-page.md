---
title: Home Page
description: Build a home page with a hero, features, and home sections in front matter.
nav:
  section: Writing
  sectionOrder: 2
  order: 3
---

# Home Page

`layout: home` turns a page into a home page built from front matter, like VitePress. [This site's home page](/) uses every option on this page.

## Hero

The hero is the top of the home page: a name, a headline, a tagline, buttons, and an image.

```yaml
---
layout: home
hero:
  name: LumePress
  text: The VitePress look, built by Lume
  tagline: Markdown docs that render like VitePress's default theme.
  image:
    src: /logo.svg
    alt: LumePress
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/FoundatioFx/lume-press
---
```

`name` is shown in the brand color, and `text` and `tagline` may contain HTML. Each action is a button: `theme` is `brand` (the default), `alt`, or `sponsor`, and external links open in a new tab.

The image is a path, `{ src, alt, width, height }`, or a light and dark pair:

```yaml
image:
  light: /logo-light.svg
  dark: /logo-dark.svg
  alt: LumePress
```

## Features

Features are cards below the hero. The grid fits the number of cards: two, three, or four across.

```yaml
---
features:
  - icon: 🔎
    title: Local search
    details: A section-level index with VitePress's search box.
  - icon:
      src: /icons/vitepress.svg
    title: Matches VitePress
    details: Same markup and styles as the default theme.
    link: /guide/vitepress-parity
    linkText: How parity works
  - icon:
      light: /icons/markdown-light.svg
      dark: /icons/markdown-dark.svg
      wrap: true
    title: VitePress markdown
    details: Containers, alerts, code groups, and more.
---
```

- `icon` is HTML (like an emoji), or an image with `src` or `light` and `dark`. Images are 48px unless `width` and `height` say otherwise, and `wrap: true` puts them in the same box as emoji icons.
- `details` is HTML. A list of strings renders as a bulleted list.
- `link` makes the whole card a link, and `linkText` adds a call to action at the bottom.

## Home sections <Badge type="tip" text="LumePress" />

Home sections are blocks after the features, for project sites that need more than a hero and a grid. Each has an optional title and text (both may contain HTML), buttons, and feature cards.

```yaml
---
homeSections:
  - title: Just a Lume plugin
    text: Add <code>site.use(lumePress({ ... }))</code> to an ordinary Lume site.
    links:
      - text: Install it
        link: /guide/getting-started
      - theme: alt
        text: Coming from VitePress
        link: /guide/coming-from-vitepress
  - title: Built for more than docs
    features:
      - title: Raw pages
        details: Drop finished HTML into <code>pages/</code>.
        link: /guide/config#rawpagesdir
        linkText: Raw pages
---
```

`links` take the same options as hero actions, and `features` the same options as features.

## Content

Markdown after the front matter renders below everything else, with the docs styles. The [home page](/) of this site ends with a short section written that way.
