---
layout: home
title: LumePress
titleTemplate: The VitePress default theme, for Lume
description: A Lume theme that renders like VitePress's default theme, with generated navigation, local search, and LLM-ready outputs.
hero:
  name: LumePress
  text: The VitePress look, built by Lume
  tagline: Markdown docs that render like VitePress's default theme, with a sidebar from front matter, local search, and LLM-ready outputs. No Vue required.
  image:
    src: https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio-icon.png
    alt: Foundatio logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: What is LumePress?
      link: /guide/what-is-lumepress
    - theme: alt
      text: View on GitHub
      link: https://github.com/FoundatioFx/lume-theme
features:
  - icon:
      src: /icons/vitepress.svg
      alt: VitePress logo
    title: Matches VitePress
    details: Same markup and styles as the VitePress default theme, generated from VitePress itself and checked against a VitePress build of these docs.
    link: /guide/vitepress-parity
    linkText: How parity works
  - icon:
      light: /icons/markdown-light.svg
      dark: /icons/markdown-dark.svg
      alt: Markdown logo
      wrap: true
    title: VitePress markdown
    details: Custom containers, GitHub alerts, code groups, Shiki highlighting with focus and diffs, snippet imports, and file includes.
    link: /guide/markdown
    linkText: See every extension
  - icon: 🧭
    title: Navigation from front matter
    details: Sections, order, and badges live in each page's front matter, or hand-write the sidebar like you would in VitePress.
    link: /guide/navigation
    linkText: Navigation reference
  - icon: 🔎
    title: Local search
    details: A section-level MiniSearch index with VitePress's search box, keyboard shortcuts, and detailed results.
  - icon:
      src: /icons/mermaid.svg
      alt: Mermaid logo
      wrap: true
    title: Mermaid diagrams
    details: Mermaid code blocks render as diagrams, loaded only on pages that use them and redrawn for dark mode.
  - icon: 🤖
    title: Ready for LLMs
    details: Every docs page gets a markdown mirror, plus llms.txt and llms-full.txt generated from the sidebar.
    link: /guide/outputs
    linkText: Generated outputs
homeSections:
  - title: Just a Lume plugin
    text: Add <code>site.use(lumePress({ ... }))</code> to an ordinary Lume site. Your <code>_config.ts</code>, your folders, your other plugins; LumePress only renders the markdown pages.
    links:
      - text: Install it
        link: /guide/getting-started
      - theme: alt
        text: Coming from VitePress
        link: /guide/coming-from-vitepress
  - title: Built for more than docs
    text: Home page sections like these are a LumePress extra, for project sites that outgrow a hero and a feature grid.
    features:
      - title: Home sections
        details: Titled blocks with text, buttons, and cards, written in front matter.
        link: /guide/home-page#home-sections
        linkText: Add a section
      - title: Raw pages
        details: Drop finished HTML into <code>pages/</code> and it's copied as is.
        link: /guide/config#rawpagesdir
        linkText: Raw pages
      - title: Redirects
        details: Static redirect pages that keep the URL hash, plus old <code>.html</code> URLs redirected for free.
        link: /guide/outputs#redirects
        linkText: Redirects
---

## This page is the demo

Everything above comes from this page's front matter: the hero, the six features (with image, light/dark, and emoji icons), and the two home sections. The [Home Page](/guide/home-page) guide shows how each part is written.

Markdown after the front matter renders here, below the home page's sections, styled like any docs page.
