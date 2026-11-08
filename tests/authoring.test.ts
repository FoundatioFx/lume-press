import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, expect, test } from "vite-plus/test";
import { expandAuthoringDirectives } from "../src/authoring.ts";
import { resolveOptions } from "../src/options.ts";

const theme = resolveOptions({
  title: "Test",
  description: "Test",
  snippets: { docsRoot: ".", repoRoot: "." },
});
let root = "";
let page = "";

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "lume-press-authoring-"));
  mkdirSync(join(root, "guide"));
  page = join(root, "guide", "page.md");
  writeFileSync(
    join(root, "code.ts"),
    [
      "const before = 1;",
      "// #region main",
      "  const inside = 2;",
      "  const also = 3;",
      "// #endregion main",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(root, "part.md"),
    ["## One", "", "First.", "", "## Two", "", "Second.", ""].join("\n"),
  );
});

const expand = (markdown: string) =>
  expandAuthoringDirectives(markdown, page, root, theme);

test("snippets import a dedented region with highlighted lines and a file name title", () => {
  expect(expand("<<< @/code.ts#main{2}")).toBe(
    "```ts {2} [code.ts]\nconst inside = 2;\nconst also = 3;\n```",
  );
});

test("snippets resolve relative to the page and support GitHub line ranges", () => {
  expect(expand("<<< ../code.ts#L1 [Start]")).toBe(
    "```ts [Start]\nconst before = 1;\n```",
  );
});

test("includes can target the content under a heading", () => {
  expect(expand("<!--@include: @/part.md#two-->").trim()).toBe("Second.");
});

test("snippets inside fenced code are left alone", () => {
  const markdown = "````md\n<<< @/missing.ts\n````";
  expect(expand(markdown)).toBe(markdown);
});

test("includes expand inside fenced code too, like VitePress", () => {
  expect(expand("```ts\n<!--@include: @/code.ts{1,1}-->\n```")).toBe(
    "```ts\nconst before = 1;\n```",
  );
});

test("snippets can't escape the configured roots", () => {
  expect(() => expand("<<< @/../../etc/passwd")).toThrow(/Refusing to read/);
});
