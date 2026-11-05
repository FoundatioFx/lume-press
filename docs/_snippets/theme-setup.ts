import lume from "@lumeland/lume";
import foundatio from "@foundatiofx/lume-theme";

// #region setup
const site = lume({ prettyUrls: true });
site.use(
  foundatio({ title: "Snippet Example", description: "Imported snippet" }),
);
// #endregion setup

export default site;
