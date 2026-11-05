import { describe, expect, test } from "vite-plus/test";
import {
  legacyHtmlUrl,
  markdownMirrorUrl,
  normalizeHref,
  normalizeInternalLinks,
  titleFromPath,
} from "../src/urls.ts";

describe("normalizeHref", () => {
  test.each([
    ["/guide/intro.md", undefined, "/guide/intro/"],
    ["/guide/index.md", undefined, "/guide/"],
    ["intro.md#setup", "/guide/start/", "/guide/start/intro/#setup"],
    ["./intro", "/guide/start.md", "/guide/intro/"],
    ["../api.md", "/guide/deep/page.md", "/guide/api/"],
    ["../api.md?tab=1#x", "/guide/start/", "/guide/api/?tab=1#x"],
    ["/files/data.json", undefined, "/files/data.json"],
    ["#anchor", "/guide/", "#anchor"],
    ["https://example.com/a.md", undefined, "https://example.com/a.md"],
    ["mailto:hi@example.com", undefined, "mailto:hi@example.com"],
  ])("%s from %s", (href, from, expected) => {
    expect(normalizeHref(href, from)).toBe(expected);
  });
});

test("normalizeInternalLinks keeps escaped query separators intact", () => {
  expect(normalizeInternalLinks('<a href="/a.md?x=1&amp;y=2">', "/")).toBe(
    '<a href="/a/?x=1&amp;y=2">',
  );
});

test("page URL helpers", () => {
  expect(markdownMirrorUrl("/guide/intro/")).toBe("/guide/intro.md");
  expect(markdownMirrorUrl("/")).toBe("/index.md");
  expect(legacyHtmlUrl("/guide/intro/")).toBe("/guide/intro.html");
  expect(legacyHtmlUrl("/")).toBeUndefined();
  expect(titleFromPath("/guide/getting-started/")).toBe("Getting Started");
});
