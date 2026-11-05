# Foundatio Lume Theme

A Lume theme for Foundatio technical sites that renders like the
[VitePress](https://vitepress.dev/) default theme: same markup, same styles, and
the same markdown extensions (containers, GitHub alerts, code groups, Shiki code
blocks with line highlights and focus/diff notation, snippets, includes). On top
of that it generates navigation from front matter, local search, LLM files,
markdown mirrors, redirects, and GitHub Pages-friendly pretty URLs.

The package is intentionally named as a broader site theme, not a docs-only
theme, so it can grow into blog, news, and other Foundatio site sections over
time.

## Usage

Requires [Lume 4](https://lume.land/) on Node 24 or later.

```bash
pnpm add @lumeland/lume @foundatiofx/lume-theme
```

```ts
// _config.ts
import lume from "@lumeland/lume";
import foundatio from "@foundatiofx/lume-theme";

const location = new URL("https://example.com");
const site = lume({
  location,
  prettyUrls: true,
});

site.use(foundatio({
  title: "Foundatio Project",
  description: "Documentation and project site",
  location,
  brand: {
    label: "Project",
    logoLight: "https://example.com/logo.svg",
    logoDark: "https://example.com/logo-dark.svg",
    icon: "https://example.com/icon.png",
  },
  docsRoot: "guide",
  nav: [
    { text: "Guide", link: "/guide/getting-started", activeMatch: "^/guide/" },
  ],
  // Any Simple Icons name, or SVG markup.
  social: [{ label: "GitHub", link: "https://github.com/org/repo", icon: "github" }],
}));

export default site;
```

Options follow VitePress's `themeConfig` where they overlap. For example,
`sidebar` takes VitePress's sidebar shape and replaces the one generated from
front matter, and `titleTemplate` works like VitePress's.

## Dogfood Docs

```bash
vp run docs:build
vp run docs:serve
```

## Development

Uses [Vite+](https://viteplus.dev/) (`vp`) and pnpm.

```bash
vp install
vp check --fix  # format, lint, and type check
vp test
vp pack         # build the package into build/
```

### Keeping up with VitePress

`src/assets/vitepress.css`, the Inter fonts, and the vendored MiniSearch are
generated from the `vitepress` dev dependency. After bumping it, regenerate them
and compare the docs against a VitePress build of the same content:

```bash
vp run sync:vitepress
```

## License

MIT
