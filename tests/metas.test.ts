import { expect, test } from "vite-plus/test";
import { pageTitle } from "../src/metas.ts";
import { resolveOptions } from "../src/options.ts";

const theme = (titleTemplate?: string | boolean) =>
  resolveOptions({ title: "Site", description: "", titleTemplate });

test.each([
  [undefined, "Page", "Page | Site"],
  [undefined, "Site", "Site"],
  [undefined, undefined, "Site"],
  [false, "Page", "Page"],
  ["Docs", "Page", "Page | Docs"],
  ["Site", "Page", "Page"],
  [":title - Custom", "Page", "Page - Custom"],
])("titleTemplate %s with title %s", (template, title, expected) => {
  expect(pageTitle({ url: "/", title }, theme(template))).toBe(expected);
});

test("page front matter overrides titleTemplate", () => {
  expect(
    pageTitle({ url: "/", title: "Page", titleTemplate: false }, theme()),
  ).toBe("Page");
});
