---
title: Front Matter
description: Page options set in front matter, from layout and outline to sidebar placement.
outline: [2, 3]
nav:
  section: Writing
  sectionOrder: 2
  order: 2
next:
  text: Set up the home page
  link: /guide/home-page
---

# Front Matter

Front matter is the YAML block at the top of a markdown page. Lume reads it into the page's data, and LumePress uses these keys. Names and values match VitePress unless marked otherwise.

```md
---
title: Docs with LumePress
outline: deep
---
```

This page sets `outline: [2, 3]` and a custom [`next`](#prev-and-next) link in its own front matter.

## title

- Type: `string`

The page's title, used in the `<title>`, the sidebar, and prev/next links. Defaults to the page's first `#` heading.

## titleTemplate

- Type: `string | boolean`

Overrides the site's [`titleTemplate`](./config#titletemplate) for this page. `false` uses the title alone.

```yaml
---
title: Getting Started
titleTemplate: ":title - My Project"
---
```

## description

- Type: `string`

The page's meta description. Defaults to the site description.

## head

- Type: `HeadEntry[]`

Extra tags for the page's `<head>`, after the site's [`head`](./config#head).

```yaml
---
head:
  - - meta
    - name: keywords
      content: lume, docs
---
```

## layout

- Type: `doc | page | home | false`
- Default: `doc`

- `doc` is the docs layout: sidebar, outline, and the doc footer.
- `page` keeps the nav bar and styles but none of the docs chrome, for custom content.
- `home` renders the [home page](./home-page) from `hero`, `features`, and `homeSections`.
- `false` renders the markdown with no layout at all.

## navbar, sidebar, aside, footer

- Type: `boolean`
- Default: `true`

Set any of these to `false` to hide that part of the layout on the page.

## outline

- Type: `number | [number, number] | "deep" | false`
- Default: `2`

The heading levels shown in the "On this page" outline: one level, a range, `"deep"` for 2 through 6, or `false` to hide it. The site-wide default is [`outline`](./config#outline).

## editLink, lastUpdated

- Type: `boolean`

Set to `false` to hide the [edit link](./config#editlink) or the [last updated](./config#lastupdated) time on the page.

## lastmod

- Type: `Date | string`

Sets the page's last updated time instead of reading it from git or the file. It's also the sitemap's `lastmod`.

## prev and next

- Type: `string | false | { text?: string; link?: string; rel?: string; target?: string }`

Overrides the previous and next links in the doc footer, which otherwise follow the sidebar. A string replaces the text, an object can change the link too, and `false` hides it.

```yaml
---
prev: false
next:
  text: Set up the home page
  link: /guide/home-page
---
```

## pageClass

- Type: `string`

A class added to the layout's root element, for page-specific styles.

## search

- Type: `boolean`

Set to `false` to leave the page out of [local search](./outputs#local-search).

## nav <Badge type="tip" text="LumePress" />

- Type: `{ section?, sectionOrder?, order?, title?, badge?, hidden?, collapsed? }`

Places the page in the [generated sidebar](./navigation#generated-from-front-matter). Ignored when the site configures its own [`sidebar`](./navigation#configured-sidebar).

| Key            | Description                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| `section`      | The sidebar group to put the page in. Defaults to the name of the docs folder. |
| `sectionOrder` | Sorts the groups; the lowest value among a group's pages wins. Default `100`.  |
| `order`        | Sorts pages within their group. Default `100`, then by title.                  |
| `title`        | The page's sidebar text, if it should differ from `title`.                     |
| `badge`        | A badge after the sidebar text: a string or `{ text, type }`.                  |
| `hidden`       | `true` leaves the page out of the sidebar.                                     |
| `collapsed`    | Makes the entry collapsible; `true` starts it collapsed.                       |

```yaml
---
title: Generated Outputs
nav:
  section: Reference
  sectionOrder: 3
  order: 3
  badge:
    text: extra
    type: tip
---
```

## Home page keys

`hero`, `features`, and `homeSections` (a LumePress extra) build the home page. See [Home Page](./home-page).
