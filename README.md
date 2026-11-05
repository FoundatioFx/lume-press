# LumePress

The [VitePress](https://vitepress.dev/) default theme, for [Lume](https://lume.land/).

LumePress renders markdown sites with the same markup, styles, and markdown
extensions as VitePress's default theme: custom containers, GitHub alerts, code
groups, Shiki code blocks with highlighting, focus, and diffs, snippet imports,
and includes. On top of that it generates the sidebar from front matter, and
builds local search, LLM files, markdown mirrors, redirects, and a sitemap.

**Docs:** <https://theme.foundatio.dev/>. They're built with LumePress from
[`docs/`](docs), and double as a showcase of every feature.

## Usage

Requires Lume 4 on Node 24 or later.

```sh
pnpm add -D @lumeland/lume @foundatiofx/lume-press
```

```ts
// _config.ts
import lume from "@lumeland/lume";
import lumePress from "@foundatiofx/lume-press";

const site = lume({
  location: new URL("https://example.com/"),
  prettyUrls: true,
});

site.use(
  lumePress({
    title: "My Project",
    description: "Documentation for My Project",
    nav: [{ text: "Guide", link: "/guide/getting-started" }],
    // Any Simple Icons name, or SVG markup.
    social: [{ label: "GitHub", link: "https://github.com/org/repo", icon: "github" }],
  }),
);

export default site;
```

Options follow VitePress's `themeConfig` where they overlap. See
[Getting Started](https://theme.foundatio.dev/guide/getting-started/) and
[Coming from VitePress](https://theme.foundatio.dev/guide/coming-from-vitepress/).

## Development

Uses [Vite+](https://viteplus.dev/) (`vp`) and pnpm.

```sh
vp install
vp check --fix         # format, lint, and type check
vp test                # unit tests and a build of the docs
vp run docs:serve      # the docs, built with LumePress
vp run vitepress:dev   # the same docs, built with VitePress
vp pack                # build the package into build/
```

### Tracking VitePress

LumePress tracks the `vitepress` dev dependency (currently
`2.0.0-alpha.21`):

- `vp run sync:vitepress` regenerates `src/assets/vitepress.css`, the Inter
  fonts, and the vendored MiniSearch from the installed VitePress.
- [`vitepress-reference/`](vitepress-reference) builds `docs/` with VitePress,
  with its config mirroring `docs/_config.ts`.
- `vp run compare:vitepress` builds both sites and compares every page by text
  and pixels, at three widths in light and dark mode. It needs Chromium:
  `vpx playwright install chromium`.

[VitePress Parity](https://theme.foundatio.dev/guide/vitepress-parity/)
describes the upgrade steps.

## License

MIT
