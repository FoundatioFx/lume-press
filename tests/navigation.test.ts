import { describe, expect, test } from "vite-plus/test";
import {
  resolveSidebar,
  sidebarGroups,
  sidebarLinks,
  uniqueLinks,
} from "../src/navigation.ts";
import type { Sidebar } from "../src/types.ts";

const multi: Sidebar = {
  "/guide/": [
    { text: "Intro", items: [{ text: "Start", link: "/guide/start" }] },
  ],
  "/guide/api/": {
    base: "/guide/api/",
    items: [
      {
        text: "API",
        items: [
          { text: "Client", link: "client" },
          {
            text: "Nested",
            base: "/other/",
            items: [{ text: "X", link: "/x.md" }],
          },
        ],
      },
    ],
  },
  reference: [{ text: "Ref", link: "/reference/" }],
};

describe("resolveSidebar", () => {
  test("picks the longest matching prefix", () => {
    expect(resolveSidebar(multi, "/guide/api/client/")[0].text).toBe("API");
    expect(resolveSidebar(multi, "/guide/start/")[0].text).toBe("Intro");
    expect(resolveSidebar(multi, "/reference/")[0].text).toBe("Ref");
    expect(resolveSidebar(multi, "/blog/")).toEqual([]);
  });

  test("applies base and normalizes links", () => {
    expect(
      sidebarLinks(resolveSidebar(multi, "/guide/api/")).map((l) => l.link),
    ).toEqual(["/guide/api/client/", "/other/x/"]);
  });

  test("leaves external links alone", () => {
    const [item] = resolveSidebar(
      [{ text: "Out", link: "https://example.com/a.md" }],
      "/",
    );
    expect(item.link).toBe("https://example.com/a.md");
  });
});

test("sidebarGroups puts runs of top-level links in untitled groups", () => {
  const groups = sidebarGroups([
    { text: "A", link: "/a/" },
    { text: "B", link: "/b/" },
    { text: "Group", items: [{ text: "C", link: "/c/" }] },
    { text: "D", link: "/d/" },
  ]);
  expect(groups.map((group) => [group.text, group.items?.length])).toEqual([
    [undefined, 2],
    ["Group", 1],
    [undefined, 1],
  ]);
});

test("uniqueLinks keeps the first of repeated links", () => {
  expect(
    uniqueLinks([
      { text: "One", link: "/a/" },
      { text: "Two", link: "/a/" },
      { text: "Three", link: "/b/" },
    ]).map((l) => l.text),
  ).toEqual(["One", "Three"]);
});
