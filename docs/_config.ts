import lume from "@lumeland/lume";
import foundatio from "../src/mod.ts";

const site = lume({
  location: new URL("https://theme.foundatio.dev/"),
  prettyUrls: true,
  dest: "_site",
});

site.copy("public", ".");

site.use(
  foundatio({
    title: "Foundatio Theme",
    description: "Dogfood site for the Foundatio Lume theme",
    brand: {
      label: "Theme",
      logoLight:
        "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio.svg",
      logoDark:
        "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio-dark-bg.svg",
      icon: "https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio-icon.png",
    },
    nav: [
      {
        text: "Guide",
        link: "/guide/getting-started",
        activeMatch: "^/guide/",
      },
      {
        text: "Reference",
        items: [
          { text: "Components", link: "/guide/components" },
          { text: "Theme Demo", link: "/guide/demo" },
        ],
      },
      {
        text: "GitHub",
        link: "https://github.com/FoundatioFx/lume-theme",
      },
    ],
    social: [
      {
        label: "GitHub",
        link: "https://github.com/FoundatioFx/lume-theme",
        icon: "github",
      },
      {
        label: "npm",
        link: "https://www.npmjs.com/package/@foundatiofx/lume-theme",
        icon: "npm",
      },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright 2026 Foundatio",
    },
    editLink: {
      pattern: "https://github.com/FoundatioFx/lume-theme/edit/main/docs/:path",
    },
    lastUpdated: { git: true },
  }),
);

export default site;
