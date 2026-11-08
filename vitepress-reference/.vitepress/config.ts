import { defineConfig } from "vitepress";

// A VitePress build of the LumePress docs, to compare the two themes page by
// page (see docs/guide/vitepress-parity.md). This mirrors docs/_config.ts:
// keep the two in sync. The sidebar is written out to match the one LumePress
// generates from front matter.

const reference = "(?:config|navigation|outputs|vitepress-parity)";
const badge = (text: string, type: string) =>
  `<span class="VPBadge ${type}" dir="auto">${text}</span>`;

export default defineConfig({
  srcDir: "../docs",
  srcExclude: ["_parts/**", "_site/**", "_snippets/**", "node_modules/**"],
  // LumePress generates these; VitePress doesn't.
  ignoreDeadLinks: [/^\/llms(?:-full)?\.txt$/],
  title: "LumePress",
  description: "The VitePress default theme, for Lume",
  cleanUrls: true,
  lastUpdated: true,
  head: [
    [
      "link",
      {
        rel: "icon",
        href: "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio-icon.png",
      },
    ],
    ["meta", { name: "theme-color", content: "#3c8772" }],
  ],
  markdown: {
    codeTransformers: [
      {
        name: "docs:unescape-examples",
        postprocess: (html) =>
          html
            .replaceAll("[!!code", "[!code")
            .replaceAll("@@include", "@include"),
      },
    ],
    config(md) {
      // Mermaid blocks, as LumePress renders them; the theme draws them.
      const fence = md.renderer.rules.fence!;
      md.renderer.rules.fence = (tokens, index, ...rest) =>
        tokens[index].info.trim() === "mermaid"
          ? `<pre class="mermaid" v-pre>${md.utils.escapeHtml(tokens[index].content)}</pre>\n`
          : fence(tokens, index, ...rest);
    },
  },
  vite: {
    // The CSS minifier rounds values (`rgba(…, 0.14)` becomes `#…24`, alpha
    // 0.1412), which shows up as pixel differences that aren't the theme's.
    build: { cssMinify: false },
    // So the dev server can be opened over Tailscale.
    server: { allowedHosts: [".ts.net"] },
  },
  themeConfig: {
    logo: {
      light:
        "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio.svg",
      dark: "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio-dark-bg.svg",
    },
    nav: [
      {
        text: "Guide",
        link: "/guide/what-is-lumepress",
        activeMatch: `^/guide/(?!${reference}\\b)`,
      },
      {
        text: "Reference",
        link: "/guide/config",
        activeMatch: `^/guide/${reference}\\b`,
      },
      {
        text: "Resources",
        items: [
          {
            text: "Built with",
            items: [
              { text: "Lume", link: "https://lume.land/" },
              { text: "VitePress", link: "https://vitepress.dev/" },
              { text: "Shiki", link: "https://shiki.style/" },
            ],
          },
          {
            text: "Project",
            items: [
              {
                text: "Releases",
                link: "https://github.com/FoundatioFx/lume-press/releases",
              },
              {
                text: "Issues",
                link: "https://github.com/FoundatioFx/lume-press/issues",
              },
            ],
          },
        ],
      },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is LumePress?", link: "/guide/what-is-lumepress" },
            { text: "Getting Started", link: "/guide/getting-started" },
            {
              text: "Coming from VitePress",
              link: "/guide/coming-from-vitepress",
            },
          ],
        },
        {
          text: "Writing",
          items: [
            { text: "Markdown Extensions", link: "/guide/markdown" },
            { text: "Front Matter", link: "/guide/frontmatter" },
            { text: "Home Page", link: "/guide/home-page" },
          ],
        },
        {
          text: "Reference",
          items: [
            { text: "Site Config", link: "/guide/config" },
            { text: "Navigation", link: "/guide/navigation" },
            {
              text: `Generated Outputs ${badge("extra", "tip")}`,
              docFooterText: "Generated Outputs",
              link: "/guide/outputs",
            },
            { text: "VitePress Parity", link: "/guide/vitepress-parity" },
          ],
        },
      ],
    },
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/FoundatioFx/lume-press",
        ariaLabel: "GitHub",
      },
      {
        icon: "npm",
        link: "https://www.npmjs.com/package/@foundatiofx/lume-press",
        ariaLabel: "npm",
      },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright 2026 Foundatio",
    },
    editLink: {
      pattern: "https://github.com/FoundatioFx/lume-press/edit/main/docs/:path",
    },
    search: { provider: "local" },
  },
});
