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

test("dogfood docs render the home page through the theme", async () => {
  const html = await readSiteText("index.html");

  expect(html).toContain("Foundatio Theme");
  expect(html).toContain("VPHome");
  expect(html).toContain("VPFeatures");
  expect(html).toContain("Built for technical project sites");
  expect(html).toContain('href="/guide/getting-started/"');
  expect(html).toContain("https://theme.foundatio.dev/");
  expect(html).not.toContain("Dogfood Coverage");
});

test("dogfood docs render guide pages with sidebar, outline, and Shiki code", async () => {
  const html = await readSiteText("guide/getting-started/index.html");

  expect(html).toContain("VPDoc");
  expect(html).toContain("VPSidebar");
  expect(html).toContain("VPDocAsideOutline");
  expect(html).toContain("Install the package");
  expect(html).toContain('class="shiki');
  expect(html).toContain("--shiki-light:#c62739");
  expect(html).toContain('title="Copy code"');
  expect(html).toContain('class="tip custom-block"');
  // `[[toc]]` lists the page's sections.
  expect(html).toContain(
    '<nav class="table-of-contents"><ul><li><a href="#install-the-package">',
  );
  // Heading permalinks match VitePress.
  expect(html).toContain(
    '<a class="header-anchor" href="#install-the-package" aria-label="Permalink to “Install the package”">\u200b</a>',
  );
});
test("dogfood docs render VitePress-style custom containers without swallowing later sections", async () => {
  const html = await readSiteText("guide/components/index.html");
  const warningStart = html.indexOf('class="warning custom-block"');
  const warningEnd = html.indexOf("</div>", warningStart);
  const tablesHeading = html.indexOf('<h2 id="tables"');
  const detailsHeading = html.indexOf('<h2 id="details"');

  expect(warningStart, "warning callout should render").toBeGreaterThanOrEqual(
    0,
  );
  expect(warningEnd, "warning callout should close").toBeGreaterThan(
    warningStart,
  );
  expect(
    tablesHeading,
    "tables section should be outside callout",
  ).toBeGreaterThan(warningEnd);
  expect(
    detailsHeading,
    "details section should follow tables",
  ).toBeGreaterThan(tablesHeading);

  const warningHtml = html.slice(warningStart, warningEnd);
  expect(warningHtml).toContain("Callouts are useful");
  expect(warningHtml).toContain("inside normal markdown content.");
  expect(
    warningHtml,
    "callout should not contain later sections",
  ).not.toContain("Tables");
});

test("dogfood docs render a dedicated demo page with broad markdown coverage", async () => {
  const html = await readSiteText("guide/demo/index.html");

  expect(html).toContain("Theme Demo");
  expect(html).toContain('class="mermaid"');
  expect(html).toContain('class="VPBadge tip"');
  expect(html).toContain('class="info custom-block"');
  expect(html).toContain('class="tip custom-block"');
  expect(html).toContain('class="warning custom-block"');
  expect(html).toContain('class="danger custom-block"');
  expect(html).toContain('class="details custom-block"');
  expect(html).toContain('class="vp-code-group"');
  expect(html).toContain('class="tabs"');
  expect(html).toContain('type="radio"');
  expect(html).toContain('class="blocks"');
  expect(html).toContain('data-title="config.js"');
  expect(html).toContain('data-title="config.ts"');
  expect(html).toContain('data-title="theme.ts"');
  expect(html).toContain('class="line diff add"');
  expect(html).toContain('class="line highlighted"');
  expect(html).toContain('class="line highlighted warning"');
  expect(html).toContain('class="line has-focus"');
  expect(html).toContain('<label data-title="guide/page.md"');
  expect(html).toContain('<label data-title="src/BuildSiteHandler.cs"');
  expect(html).toContain('<label data-title="single.config.ts"');
  expect(
    html.match(/class="vp-code-group"/g)?.length ?? 0,
  ).toBeGreaterThanOrEqual(2);
  expect(html).toContain("--shiki-dark:#818e99");
  expect(html.match(/line-numbers-mode/g)?.length ?? 0).toBeGreaterThanOrEqual(
    4,
  );
  expect(
    html.match(/line-numbers-wrapper/g)?.length ?? 0,
  ).toBeGreaterThanOrEqual(4);
  expect(html).toContain("Local search");
  expect(html).toContain("Footer Navigation");
});

test("authoring directives match VitePress: alerts, snippet regions, and includes", async () => {
  const html = await readSiteText("guide/demo/index.html");

  expect(html).toContain(
    '<div class="note custom-block github-alert"><p class="custom-block-title">NOTE</p>',
  );
  // `<<< file#setup{2}` imports only the region and highlights its second line.
  expect(html).toContain('<span class="line highlighted"><span');
  expect(html).toContain("Snippet Example");
  expect(html).not.toContain("#region setup");
  expect(html).not.toContain("export default site;\n</code>");
  // `<!--@include: file#shared-content-->` includes only that heading's content.
  expect(html).toContain("through an include directive.");
  expect(html).not.toContain("This section stays out");
  expect(html).not.toContain('id="shared-content"');
});

test("theme emits bundled browser assets", async () => {
  await expectSiteFile("assets/vitepress.css");
  await expectSiteFile("assets/site.css");
  await expectSiteFile("assets/site.js");
  await expectSiteFile("assets/client/search.js");
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

  const code = await readSiteText("assets/client/code.js");
  expect(code).toContain("mermaid.run");
});

test("theme emits support outputs for search, llms, markdown mirrors, and legacy redirects", async () => {
  await expectSiteFile("search-index.json");
  await expectSiteFile("llms.txt");
  await expectSiteFile("llms-full.txt");
  await expectSiteFile("guide/getting-started.md");
  await expectSiteFile("guide/demo/index.html");
  await expectSiteFile("guide/getting-started.html");
  await expectSiteFile("sitemap.xml");
  await expectSiteFile("CNAME");

  const cname = await readSiteText("CNAME");
  expect(cname).toContain("theme.foundatio.dev");

  const search = JSON.parse(await readSiteText("search-index.json"));
  expect(search).toBeInstanceOf(Array);
  expect(search).toContainEqual(
    expect.objectContaining({ title: "Getting Started" }),
  );

  const redirect = await readSiteText("guide/getting-started.html");
  expect(redirect).toContain("url=/guide/getting-started/");
});

test("markdown mirrors strip authoring front matter", async () => {
  const markdown = await readSiteText("guide/getting-started.md");
  const generatedFrontMatter = markdown.slice(
    0,
    markdown.indexOf("# Getting Started"),
  );

  expect(generatedFrontMatter).toContain("url: /guide/getting-started.md");
  expect(markdown).toContain("# Getting Started");
  expect(
    generatedFrontMatter,
    "markdown mirrors should not expose authoring navigation metadata",
  ).not.toContain("sectionOrder");
  expect(
    generatedFrontMatter,
    "markdown mirrors should not expose authoring navigation metadata",
  ).not.toContain("nav:");
});

test("nav bar renders the ⋯ menu and only the social icons it uses", async () => {
  const html = await readSiteText("guide/demo/index.html");

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

test("llms.txt lists the sidebar groups without badge text", async () => {
  const llms = await readSiteText("llms.txt");

  expect(llms).toContain("### Reference");
  expect(llms).toContain("- [Components](/guide/components.md)");
});
