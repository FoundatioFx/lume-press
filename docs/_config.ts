import lume from "@lumeland/lume";
import lumePress from "../src/mod.ts";

// `vitepress-reference/.vitepress/config.ts` mirrors this configuration, so
// both sites render these docs the same way. Keep the two in sync.

const site = lume({
  location: new URL("https://theme.foundatio.dev/"),
  prettyUrls: true,
  dest: "_site",
});

site.copy("public", ".");

/** Reference pages, which the Reference nav link highlights instead of Guide. */
const reference = "(?:config|navigation|outputs|vitepress-parity)";

site.use(
  lumePress({
    title: "LumePress",
    description: "The VitePress default theme, for Lume",
    brand: {
      label: "LumePress",
      logoLight:
        "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio.svg",
      logoDark:
        "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio-dark-bg.svg",
      icon: "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio-icon.png",
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
    social: [
      {
        label: "GitHub",
        link: "https://github.com/FoundatioFx/lume-press",
        icon: "github",
      },
      {
        label: "npm",
        link: "https://www.npmjs.com/package/@foundatiofx/lume-press",
        icon: "npm",
      },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright 2026 Foundatio",
    },
    editLink: {
      pattern: "https://github.com/FoundatioFx/lume-press/edit/main/docs/:path",
    },
    lastUpdated: { git: true },
    codeHighlight: {
      transformers: [
        {
          // Examples write `[!!code` and `@@include` so they aren't applied;
          // this turns them back into the syntax being shown.
          name: "docs:unescape-examples",
          postprocess: (html) =>
            html
              .replaceAll("[!!code", "[!code")
              .replaceAll("@@include", "@include"),
        },
      ],
    },
  }),
);

export default site;
