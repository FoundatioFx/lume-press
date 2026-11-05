import { expect, test } from "vite-plus/test";
import {
  decodeHtml,
  escapeHtml,
  extractHeadings,
  inlineJson,
} from "../src/html.ts";
import { transformBadgeTags } from "../src/render/badge.ts";
import { slugify } from "../src/slug.ts";

test("decodeHtml reverses escapeHtml without double-decoding", () => {
  const text = `a & b < "c" 'd' &quot;`;
  expect(decodeHtml(escapeHtml(text))).toBe(text);
  expect(decodeHtml("&amp;quot;")).toBe("&quot;");
});

test("inlineJson can't close a script tag", () => {
  expect(inlineJson({ label: "</script>" })).not.toContain("</script>");
});

test("extractHeadings drops anchors, and badges from the outline text", () => {
  expect(
    extractHeadings(
      '<h2 id="a-b" tabindex="-1">A &amp; <code>B</code> <span class="VPBadge tip">new</span> <a class="header-anchor" href="#a-b">&#8203;</a></h2>',
    ),
  ).toEqual([
    {
      level: 2,
      slug: "a-b",
      text: "A & B",
      html: 'A &amp; B <span class="VPBadge tip">new</span>',
    },
  ]);
});

test("slugify matches VitePress", () => {
  expect(slugify("Hello, World! (v2)")).toBe("hello-world-v2");
  expect(slugify("Café déjà vu")).toBe("cafe-deja-vu");
  expect(slugify("2 Columns")).toBe("_2-columns");
});

test("badge tags keep quoted text", () => {
  expect(transformBadgeTags(`<Badge type="warning" text="Don't" />`)).toBe(
    '<span class="VPBadge warning" dir="auto">Don&#39;t</span>',
  );
  expect(transformBadgeTags(`<Badge data-text="x" text='New' />`)).toContain(
    ">New<",
  );
});
