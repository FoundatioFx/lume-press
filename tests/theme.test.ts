import { spawnSync } from "node:child_process";
import { readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, expect, test } from "vite-plus/test";

const docsDir = fileURLToPath(new URL("../docs/", import.meta.url));
const siteDir = join(docsDir, "_site");
const lumeBin = fileURLToPath(
  new URL("../bin.js", import.meta.resolve("@lumeland/lume")),
);

beforeAll(async () => {
  await rm(siteDir, { recursive: true, force: true });

  const output = spawnSync(process.execPath, [lumeBin, "build"], {
    cwd: docsDir,
    encoding: "utf8",
  });

  // Lume 4 logs build errors (like check-urls failures) but still exits 0,
  // so treat a reported broken link as a failed build too.
  if (
    output.status !== 0 ||
    /\d+ broken link\(s\)/.test(output.stdout + output.stderr)
  ) {
    throw new Error(
      ["Dogfood docs build failed.", output.stdout, output.stderr].join("\n"),
    );
  }
}, 120_000);

async function readSiteText(path: string): Promise<string> {
  return await readFile(join(siteDir, path), "utf8");
}

async function expectSiteFile(path: string): Promise<void> {
  const info = await stat(join(siteDir, path));
  expect(info.isFile(), `${path} should be a file`).toBe(true);
}

test("the home page renders the hero, features, and home sections", async () => {
  const html = await readSiteText("index.html");

  expect(html).toContain(
    "<title>LumePress | The VitePress default theme, for Lume</title>",
  );
  expect(html).toContain('class="VPHero has-image VPHomeHero"');
  expect(html).toContain('class="VPFeatures VPHomeFeatures"');
  // Image icons, a light/dark pair in the icon box, and emoji.
  expect(html).toContain(
    'src="/icons/vitepress.svg" alt="VitePress logo" width="48" height="48"',
  );
  expect(html).toContain(
    '<div class="icon"><img class="VPImage dark" src="/icons/markdown-dark.svg"',
  );
  expect(html).toContain('<div class="icon">🔎</div>');
  expect(html).toContain(
    '<p class="link-text-value"><bdi>How parity works</bdi>',
  );
  expect(html.match(/class="VPHomeSection"/g)).toHaveLength(2);
  expect(html).toContain("This page is the demo");
  expect(html).toContain('href="https://theme.foundatio.dev/"');
});

test("docs pages render with the sidebar, outline, and Shiki code", async () => {
  const html = await readSiteText("guide/getting-started/index.html");

  expect(html).toContain('class="VPDoc has-sidebar has-aside"');
  expect(html).toContain('<h2 class="text"><bdi>Introduction</bdi></h2>');
  expect(html).toContain("VPDocAsideOutline");
  expect(html).toContain('class="shiki');
  expect(html).toContain('title="Copy code"');
  expect(html).toContain('class="tip custom-block"');
  expect(html).toContain('<label data-title="pnpm"');
  // The snippet import of `_snippets/config.ts#setup`.
  expect(html).toContain("Documentation for My Project");
  expect(html).not.toContain("#region setup");
  // Relative links resolve against the source file, like VitePress.
  expect(html).toContain('href="/guide/config/"');
  // Heading permalinks match VitePress.
  expect(html).toContain(
    '<a class="header-anchor" href="#installation" aria-label="Permalink to “Installation”">​</a>',
  );
});

test("the sidebar is generated from front matter, with badges", async () => {
  const html = await readSiteText("guide/markdown/index.html");
  const sections = [
    ...html.matchAll(/<h2 class="text"><bdi>([^<]+)<\/bdi>/g),
  ].map((match) => match[1]);

  expect(sections).toEqual(["Introduction", "Writing", "Reference"]);
  expect(html).toContain(
    '<p class="text"><bdi>Generated Outputs <span class="VPBadge tip" dir="auto">extra</span></bdi></p>',
  );
  expect(html).toContain(
    'class="VPSidebarItem level-1 is-link is-active has-active"',
  );
});

test("markdown extensions render like VitePress", async () => {
  const html = await readSiteText("guide/markdown/index.html");

  for (const type of ["info", "tip", "warning", "danger", "details"]) {
    expect(html).toContain(`class="${type} custom-block"`);
  }
  for (const type of ["note", "tip", "important", "warning", "caution"]) {
    expect(html).toContain(`class="${type} custom-block github-alert"`);
  }
  expect(html).toContain('<details open="" class="details custom-block">');
  expect(html).toContain('class="vp-code-group"');
  expect(html).toContain('class="line highlighted"');
  expect(html).toContain('class="line has-focus"');
  expect(html).toContain('class="line diff add"');
  expect(html).toContain('class="line highlighted error"');
  expect(html).toContain("line-numbers-wrapper");
  expect(html).toContain('class="mermaid"');
  expect(html).toContain('class="task-list-item"');
  expect(html.match(/<section class="footnotes">/g)).toHaveLength(1);
  // Escaped notation and include examples show their syntax.
  expect(html).toContain("[!code focus]");
  expect(html).toContain("@include: @/_parts/basics.md");
  // The include itself, without the part's front matter.
  expect(html).toContain("Some getting started stuff.");
  expect(html).toContain('<h3 id="configuration" tabindex="-1">Configuration');
  // `[[toc]]` keeps badges but not code formatting, like VitePress.
  expect(html).toContain('<a href="#raw">raw</a>');
  expect(html).toContain(
    '<a href="#mermaid-diagrams">Mermaid Diagrams <span class="VPBadge tip" dir="auto">LumePress</span></a>',
  );
});

test("snippet imports keep region markers only when importing the whole file", async () => {
  const markdown = await readSiteText("guide/markdown.md");

  expect(markdown).toContain(
    "```js [snippet.js]\nexport default function (src) {\n  // #region snippet\n",
  );
  expect(markdown).toContain(
    "```js {2} [snippet.js]\nif (src) {\n  return src.trim();\n}\n```",
  );
});

test("front matter overrides the outline and prev/next links", async () => {
  const html = await readSiteText("guide/frontmatter/index.html");

  expect(html).toContain(
    '<span class="title"><bdi>Set up the home page</bdi></span>',
  );
  expect(html).toContain('href="#prev-and-next"');
});

test("theme emits bundled browser assets", async () => {
  await expectSiteFile("assets/vitepress.css");
  await expectSiteFile("assets/site.css");
  await expectSiteFile("assets/site.js");
  await expectSiteFile("assets/client/search.js");
  await expectSiteFile("assets/client/nav-overflow.js");
  await expectSiteFile("assets/client/vendor/minisearch.js");
  await expectSiteFile("assets/fonts/inter-roman-latin.woff2");

  const vitepressCss = await readSiteText("assets/vitepress.css");
  expect(vitepressCss).toContain("Generated by scripts/sync-vitepress.ts");
  // Vue-scoped rules keep their scope, specificity, and child-component boundaries.
  expect(vitepressCss).toContain(
    ".content:is(.VPDoc, .VPDoc *):not(:where(.VPDocAside *, .VPDocFooter *))",
  );
  expect(vitepressCss).toContain("src: url('fonts/inter-roman-latin.woff2')");

  const css = await readSiteText("assets/site.css");
  expect(css).toContain(
    '.vp-code-group .tabs label[data-title$=".ts"]::before',
  );
  expect(css).toContain(".VPHomeSection .items");
});

test("theme emits search, llms, markdown mirrors, redirects, and a sitemap", async () => {
  for (const file of [
    "search-index.json",
    "llms.txt",
    "llms-full.txt",
    "guide/getting-started.md",
    "guide/getting-started.html",
    "sitemap.xml",
    "404.html",
    "CNAME",
  ]) {
    await expectSiteFile(file);
  }

  const search = JSON.parse(await readSiteText("search-index.json"));
  expect(search).toContainEqual(
    expect.objectContaining({ title: "Installation" }),
  );

  const redirect = await readSiteText("guide/getting-started.html");
  expect(redirect).toContain("url=/guide/getting-started/");

  const llms = await readSiteText("llms.txt");
  expect(llms).toContain("### Reference");
  // Sidebar badges stay out of the LLM index.
  expect(llms).toContain("- [Generated Outputs](/guide/outputs.md)");
});

test("markdown mirrors expand directives and strip authoring front matter", async () => {
  const markdown = await readSiteText("guide/getting-started.md");
  const frontMatter = markdown.slice(0, markdown.indexOf("# Getting Started"));

  expect(frontMatter).toContain("url: /guide/getting-started.md");
  expect(frontMatter).not.toContain("nav:");
  expect(markdown).toContain('description: "Documentation for My Project"');
});

test("nav bar renders dropdowns, the ⋯ menu, and only the social icons it uses", async () => {
  const html = await readSiteText("guide/markdown/index.html");

  expect(html).toContain('<p class="title">Built with</p>');
  expect(html).toContain('class="VPFlyout VPNavBarExtra extra" hidden');
  expect(html).toContain('aria-label="More options"');
  expect(html).toContain('<span class="vpi-simple-icons-npm"></span>');
  expect(html).toContain('href="/assets/social-icons.css"');

  const icons = await readSiteText("assets/social-icons.css");
  expect(icons.match(/\.vpi-simple-icons-[\w-]+/g)).toEqual([
    ".vpi-simple-icons-github",
    ".vpi-simple-icons-npm",
  ]);
});
