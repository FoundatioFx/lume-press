import { expect, test } from "vite-plus/test";
import { buildSearchIndex } from "../src/outputs/search.ts";
import type { ContentEntry } from "../src/types.ts";

test("search index has one section per heading, like VitePress", () => {
  const html = [
    "<p>Skipped intro.</p>",
    '<h1 id="page">Page</h1><p>About the page.</p>',
    '<h2 id="setup">Setup <a class="header-anchor" href="#setup">&#8203;</a></h2><p>Install it.</p>',
    '<h3 id="deep">Deep</h3><p>Details &amp; more.</p>',
  ].join("");
  const entry = { data: { url: "/guide/page/" }, html } as ContentEntry;

  expect(buildSearchIndex([entry])).toEqual([
    {
      id: "/guide/page/#page",
      url: "/guide/page/",
      anchor: "page",
      title: "Page",
      titles: [],
      text: "About the page.",
    },
    {
      id: "/guide/page/#setup",
      url: "/guide/page/",
      anchor: "setup",
      title: "Setup",
      titles: ["Page"],
      text: "Install it.",
    },
    {
      id: "/guide/page/#deep",
      url: "/guide/page/",
      anchor: "deep",
      title: "Deep",
      titles: ["Page", "Setup"],
      text: "Details & more.",
    },
  ]);
});
