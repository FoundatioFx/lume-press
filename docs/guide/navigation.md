---
title: Navigation
description: The nav bar, social links, and the sidebar, generated or configured.
nav:
  section: Reference
  sectionOrder: 3
  order: 2
---

# Navigation

## Nav bar

`nav` sets the links in the nav bar, with the same shape as VitePress's `themeConfig.nav`.

```ts
lumePress({
  nav: [
    { text: "Guide", link: "/guide/getting-started" },
    { text: "Reference", link: "/guide/config" },
  ],
});
```

A link is highlighted when its page, or a page whose URL matches `activeMatch`, is open. `activeMatch` is a regular expression for the page URL:

```ts
{ text: "Guide", link: "/guide/getting-started", activeMatch: "^/guide/" }
```

External links open in a new tab and get an arrow icon. `target`, `rel`, and `noIcon` override that.

### Dropdown menus

Items with `items` instead of `link` become dropdown menus, and a nested item with its own `items` becomes a titled group. The Resources menu on this site is built this way:

```ts
lumePress({
  nav: [
    {
      text: "Resources",
      items: [
        {
          text: "Built with",
          items: [
            { text: "Lume", link: "https://lume.land/" },
            { text: "VitePress", link: "https://vitepress.dev/" },
          ],
        },
        {
          text: "Project",
          items: [
            { text: "Releases", link: "https://github.com/org/repo/releases" },
          ],
        },
      ],
    },
  ],
});
```

### The ⋯ menu

When the nav bar runs out of room, items move into a "⋯" menu at the end, like VitePress: the social links first, then the appearance switch, then menu items from the right. Make your window narrower to watch this site's nav bar do it. On small screens, everything moves into the menu behind the hamburger button instead.

## Social links

`social` adds icon links to the nav bar.

```ts
lumePress({
  social: [
    { label: "GitHub", link: "https://github.com/org/repo", icon: "github" },
    { label: "Discord", link: "https://discord.gg/invite" },
    {
      label: "Website",
      link: "https://example.com",
      icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
    },
  ],
});
```

- `icon` is any [Simple Icons](https://simpleicons.org/) name, or SVG markup. It defaults to the label in lowercase, so `Discord` needs no icon.
- `label` is the link's accessible name.

Only the icons the site uses are included, in `/assets/social-icons.css`. A name Simple Icons doesn't have stops the build with an error.

## Sidebar

The sidebar lists the docs pages. It can be generated from each page's front matter, or written out in the config.

### Generated from front matter

By default, the pages in the [docs folder](./config#docsroot) (`guide`) make up the sidebar. Each page's `nav` front matter sets where it goes:

```yaml
---
title: Generated Outputs
nav:
  section: Reference # the group it's in
  sectionOrder: 3 # where the group goes
  order: 3 # where the page goes in the group
  badge:
    text: extra
    type: tip
---
```

Pages in subfolders are nested under a group named after the folder. This site's sidebar is generated this way, and [`nav`](./frontmatter#nav) lists every key.

### Configured sidebar

To write the sidebar by hand, pass `sidebar` with the same shape as VitePress's `themeConfig.sidebar`. This replaces the generated one.

```ts
lumePress({
  sidebar: [
    {
      text: "Guide",
      items: [
        { text: "Introduction", link: "/guide/introduction" },
        { text: "Getting Started", link: "/guide/getting-started" },
      ],
    },
  ],
});
```

Items nest with `items`. `collapsed` makes a group collapsible, and `true` starts it collapsed (it opens anyway when it holds the current page). `docFooterText` changes the text of the item's prev/next link, and item `text` may contain HTML.

Different parts of a site can have different sidebars. Key them by path prefix; the longest match wins, and `base` prefixes the links in that sidebar:

```ts
lumePress({
  sidebar: {
    "/guide/": [
      { text: "Guide", items: [{ text: "Getting Started", link: "/guide/getting-started" }] },
    ],
    "/reference/": {
      base: "/reference/",
      items: [
        { text: "Reference", items: [{ text: "Config", link: "config" }] },
      ],
    },
  },
});
```

## Prev and next links

The doc footer links to the previous and next pages in the sidebar. A page can change or hide them with [`prev` and `next`](./frontmatter#prev-and-next) front matter.
