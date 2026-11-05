---
title: VitePress Parity
description: How LumePress stays identical to VitePress, and how to bring in a new VitePress version.
nav:
  section: Reference
  sectionOrder: 3
  order: 4
---

# VitePress Parity

LumePress aims to render anything it supports exactly as VitePress's default theme does, down to the pixel. It currently tracks VitePress `2.0.0-alpha.21`.

## Generated styles

`src/assets/vitepress.css` isn't written by hand. `scripts/sync-vitepress.ts` builds it from the installed `vitepress` package:

- the theme's global stylesheets, in the order Vite would load them, and
- every component's `<style scoped>` block, with Vue's scoping attribute turned into selectors that match the component's markup, so rules keep their reach and specificity.

The same script copies VitePress's Inter fonts and the MiniSearch build it uses. Styles for LumePress's own extras live separately, in `src/assets/site.css`.

## The reference site

`vitepress-reference/` is a VitePress site that builds these same docs: its `srcDir` is the `docs` folder, and its config mirrors `docs/_config.ts`. A small custom theme there adds the two LumePress extras VitePress lacks (home sections and Mermaid), so every page has the same content on both sites.

```sh
$ vp run vitepress:dev # serve the VitePress build of these docs
$ vp run docs:serve # serve the LumePress build
```

## Comparing the two

`scripts/compare-vitepress.ts` builds both sites, opens every page in Chromium at desktop, tablet, and phone widths in light and dark mode, and compares the screenshots pixel by pixel. It also compares each page's text, and writes a report with images of every difference.

```sh
$ vp run compare:vitepress
```

The only expected difference today is the space after "Last updated:", which VitePress's current alpha drops.

## Upgrading VitePress

1. Bump `vitepress` in `package.json` and run `vp install`.
2. Run `vp run sync:vitepress` to regenerate the styles, fonts, and MiniSearch.
3. Run `vp run compare:vitepress` and fix what differs. Changes to VitePress's markup, markdown plugins, or client behavior show up here.
4. Read the VitePress changelog for new features worth porting, then add them to these docs so the comparison covers them.
