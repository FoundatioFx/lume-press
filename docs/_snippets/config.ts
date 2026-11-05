import lume from "@lumeland/lume";
import lumePress from "@foundatiofx/lume-press";

// #region setup
const site = lume({
  location: new URL("https://example.com/"),
  prettyUrls: true,
});

site.use(
  lumePress({
    title: "My Project",
    description: "Documentation for My Project",
    nav: [{ text: "Guide", link: "/guide/getting-started" }],
  }),
);

export default site;
// #endregion setup
