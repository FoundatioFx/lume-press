---
title: Components
nav:
  section: Reference
  sectionOrder: 2
  order: 1
badge:
  text: Theme
  type: info
---

# Components

The dogfood site includes common page features so tests can verify the rendered
theme output.

## Code blocks

Code blocks are highlighted with Shiki and receive the same chrome as docs pages
in consuming projects.

```csharp
public sealed class ThemeOptions
{
    public required string Title { get; init; }
    public string DocsRoot { get; init; } = "guide";
}
```

```bash
vp run docs:build
```

## Callouts

::: warning Callouts are useful for project-specific notes and should render
inside normal markdown content.
:::

## Tables

| Feature          | Output                             |
| ---------------- | ---------------------------------- |
| Search           | `search-index.json`                |
| LLM index        | `llms.txt`                         |
| Markdown mirrors | `.md` files beside clean docs URLs |

## Details

The theme is expected to provide consistent typography, generated page outlines,
and footer navigation without each site copying renderer code.
