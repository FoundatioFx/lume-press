---
title: Getting Started
description: Start using the Foundatio Lume theme
nav:
  section: Introduction
  sectionOrder: 1
  order: 1
---

# Getting Started

Foundatio Theme is a Lume theme for technical project sites. It keeps the site configuration small while the theme handles navigation, outlines, search, code blocks, markdown mirrors, and LLM-friendly output.

[[toc]]

## Install the package

Lume 4 runs on Node 24 or later. Install the theme next to Lume:

```bash
pnpm add @lumeland/lume @foundatiofx/lume-theme
```

Then register it in `_config.ts`:

```ts
import lume from "@lumeland/lume";
import foundatio from "@foundatiofx/lume-theme";

const site = lume({ prettyUrls: true });
site.use(foundatio({
  title: "My Project",
  description: "Project documentation",
  docsRoot: "guide",
}));

export default site;
```

## Configure navigation

Navigation is generated from markdown front matter. Sections are sorted with `sectionOrder`, and pages within a section are sorted with `order`.

```yaml
---
title: Getting Started
nav:
  section: Introduction
  sectionOrder: 1
  order: 1
---
```

To write the sidebar by hand instead, pass `sidebar` to the theme. It takes the same shape as VitePress's `themeConfig.sidebar`: one list of items, or one list per path prefix.

```ts
foundatio({
  sidebar: {
    "/guide/": [
      {
        text: "Introduction",
        items: [{ text: "Getting Started", link: "/guide/getting-started" }],
      },
    ],
  },
});
```

::: tip
Use normal Lume project structure. The theme should be a plugin in your `_config.ts`, not a wrapper around `lume()`.
:::

## Add content

Create markdown files under the docs root, then link between pages with clean URLs such as [Components](/guide/components).

```csharp
public record BuildSite(string Name);

public class BuildSiteHandler
{
    public string Handle(BuildSite command) => $"Built {command.Name}";
}
```

## Next steps

Read the [component reference](/guide/components) to see cards, callouts, code blocks, and generated support files.
