/**
 * Compares the LumePress build of `docs/` with the VitePress build in
 * `vitepress-reference/`: every page, at several widths, in light and dark
 * mode, by visible text and by pixels. Writes a report and diff images.
 *
 *   vp run compare:vitepress [--no-build] [--page /guide/markdown] [--out dir]
 *
 * Needs Chromium for Playwright: `vpx playwright install chromium`.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import pixelmatch from "pixelmatch";
import { type Browser, chromium, type Page } from "playwright";
import { PNG } from "pngjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const docsDir = join(root, "docs");
const lumeOut = join(docsDir, "_site");
const vitepressDir = join(root, "vitepress-reference");
const vitepressOut = join(vitepressDir, ".vitepress", "dist");

const { values: args } = parseArgs({
  // `vp run compare:vitepress -- --flag` passes the `--` through.
  args: process.argv.slice(2).filter((arg) => arg !== "--"),
  options: {
    "no-build": { type: "boolean", default: false },
    page: { type: "string", multiple: true },
    out: {
      type: "string",
      default: join(process.env.TMPDIR ?? tmpdir(), "lumepress-compare"),
    },
  },
});

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 800, height: 1024 },
  { name: "phone", width: 390, height: 844 },
];
const schemes = ["light", "dark"] as const;
/** A channel difference above this counts as a changed pixel. */
const threshold = 0.1;

/** Visible text of each layout region, for a readable diff. */
const regions = [
  ".VPNav",
  ".VPSidebar",
  ".VPLocalNav",
  ".VPContent",
  ".VPFooter",
];

type Result = {
  page: string;
  view: string;
  pixels?: number;
  percent?: number;
  sizes?: string;
  text: string[];
  image?: string;
};

if (!args["no-build"]) {
  run(
    "Building the LumePress docs",
    process.execPath,
    [lumeBin(), "build"],
    docsDir,
  );
  run(
    "Building the VitePress reference",
    process.execPath,
    [vitepressBin(), "build", "vitepress-reference"],
    root,
  );
}

const pages = args.page?.length ? args.page : docsPages();
mkdirSync(args.out, { recursive: true });
rmSync(join(args.out, "images"), { recursive: true, force: true });
mkdirSync(join(args.out, "images"));

const [lume, vitepress] = await Promise.all([
  serve(lumeOut),
  serve(vitepressOut),
]);
const browser = await chromium.launch();
const results: Result[] = [];
try {
  for (const page of pages) {
    for (const viewport of viewports) {
      for (const scheme of schemes) {
        const result = await comparePage(browser, page, viewport, scheme);
        results.push(result);
        console.log(summary(result));
      }
    }
  }
} finally {
  await browser.close();
  lume.close();
  vitepress.close();
}

writeFileSync(join(args.out, "report.md"), report(results));
const differing = results.filter(
  (result) => result.text.length || result.sizes || (result.pixels ?? 0) > 0,
);
console.log(
  `\n${differing.length} of ${results.length} views differ. Report: ${join(args.out, "report.md")}`,
);

async function comparePage(
  browser: Browser,
  path: string,
  viewport: (typeof viewports)[number],
  scheme: (typeof schemes)[number],
): Promise<Result> {
  const view = `${viewport.name}-${scheme}`;
  const capture = async (url: string) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: scheme,
    });
    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      await settle(page);
      return {
        text: await page.evaluate(
          (selectors) =>
            selectors.flatMap((selector) => {
              const element = document.querySelector<HTMLElement>(selector);
              // `innerText` of an element that isn't rendered is all of its text.
              return element?.checkVisibility()
                ? [`# ${selector}`, ...element.innerText.split("\n")]
                : [];
            }),
          regions,
        ),
        image: PNG.sync.read(await page.screenshot({ fullPage: true })),
      };
    } finally {
      await context.close();
    }
  };

  // LumePress pages live at pretty URLs (`/guide/page/`), VitePress's at clean ones.
  const [expected, actual] = await Promise.all([
    capture(vitepress.url + path),
    capture(path === "/" ? lume.url : `${lume.url}${path}/`),
  ]);
  const result: Result = {
    page: path,
    view,
    text: textDiff(expected.text, actual.text),
  };
  const { width, height } = expected.image;
  if (width !== actual.image.width || height !== actual.image.height) {
    result.sizes = `VitePress ${width}×${height}, LumePress ${actual.image.width}×${actual.image.height}`;
    return result;
  }

  const diff = new PNG({ width, height });
  result.pixels = pixelmatch(
    expected.image.data,
    actual.image.data,
    diff.data,
    width,
    height,
    { threshold },
  );
  result.percent = (100 * result.pixels) / (width * height);
  if (result.pixels > 0) {
    const name = `images/${slug(path)}-${view}`;
    result.image = `${name}-diff.png`;
    writeFileSync(join(args.out, result.image), PNG.sync.write(diff));
    writeFileSync(
      join(args.out, `${name}-vitepress.png`),
      PNG.sync.write(expected.image),
    );
    writeFileSync(
      join(args.out, `${name}-lumepress.png`),
      PNG.sync.write(actual.image),
    );
  }
  return result;
}

/** Waits for web fonts and Mermaid diagrams, then for transitions to finish. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll(".mermaid")].every((node) =>
          node.querySelector("svg"),
        ),
      undefined,
      { timeout: 10_000 },
    )
    .catch(() => {});
  await page.waitForTimeout(300);
}

/** Lines only one side has, marked `-` for VitePress and `+` for LumePress. */
function textDiff(expected: string[], actual: string[]): string[] {
  const counts = new Map<string, number>();
  for (const line of expected) counts.set(line, (counts.get(line) ?? 0) + 1);
  for (const line of actual) counts.set(line, (counts.get(line) ?? 0) - 1);
  return [
    ...expected
      .filter((line) => (counts.get(line) ?? 0) > 0)
      .map((line) => `- ${line}`),
    ...actual
      .filter((line) => (counts.get(line) ?? 0) < 0)
      .map((line) => `+ ${line}`),
  ].filter((line, index, lines) => lines.indexOf(line) === index);
}

function summary(result: Result) {
  const pixels =
    result.sizes ??
    (result.pixels
      ? `${result.pixels} px (${result.percent!.toFixed(2)}%)`
      : "identical");
  const text = result.text.length
    ? `, ${result.text.length} text lines differ`
    : "";
  return `${result.page.padEnd(32)} ${result.view.padEnd(14)} ${pixels}${text}`;
}

function report(results: Result[]) {
  const sections = results
    .filter((result) => result.text.length || result.sizes || result.pixels)
    .map((result) =>
      [
        `## ${result.page} (${result.view})`,
        result.sizes
          ? `Page size differs: ${result.sizes}.`
          : `${result.pixels} pixels differ (${result.percent!.toFixed(2)}%).`,
        result.image ? `![diff](${result.image})` : "",
        result.text.length ? ["```diff", ...result.text, "```"].join("\n") : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  return `# LumePress vs VitePress\n\n${sections.length ? sections.join("\n\n") : "Every view matches."}\n`;
}

/** Every markdown page in `docs/`, as a URL path. */
function docsPages(): string[] {
  return (readdirSync(docsDir, { recursive: true }) as string[])
    .map((file) => file.replaceAll("\\", "/"))
    .filter(
      (file) =>
        file.endsWith(".md") &&
        !file.split("/").some((part) => part.startsWith("_")),
    )
    .map(
      (file) =>
        `/${file.replace(/(?:^|\/)index\.md$/, "").replace(/\.md$/, "")}`,
    )
    .sort();
}

/** A static server for a built site, resolving clean URLs like both hosts do. */
function serve(dir: string): Promise<{ url: string; close: () => void }> {
  if (!existsSync(dir)) {
    throw new Error(
      `${relative(root, dir)} doesn't exist; build without --no-build first.`,
    );
  }
  const types: Record<string, string> = {
    ".css": "text/css",
    ".html": "text/html",
    ".js": "text/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
  };
  const server: Server = createServer((request, response) => {
    const path = decodeURIComponent(
      new URL(request.url ?? "/", "http://x").pathname,
    );
    const file = [path, `${path}.html`, join(path, "index.html")]
      .map((candidate) => join(dir, candidate))
      .find(
        (candidate) =>
          candidate.startsWith(dir) &&
          existsSync(candidate) &&
          statSync(candidate).isFile(),
      );
    response.writeHead(file ? 200 : 404, {
      "content-type":
        types[extname(file ?? ".html")] ?? "application/octet-stream",
    });
    const notFound = join(dir, "404.html");
    response.end(
      file
        ? readFileSync(file)
        : existsSync(notFound)
          ? readFileSync(notFound)
          : "Not found",
    );
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        close: () => server.close(),
      }),
    ),
  );
}

function run(
  label: string,
  command: string,
  commandArgs: string[],
  cwd: string,
) {
  console.log(`${label}...`);
  const output = spawnSync(command, commandArgs, { cwd, encoding: "utf8" });
  if (output.status !== 0) {
    throw new Error(`${label} failed:\n${output.stdout}\n${output.stderr}`);
  }
}

function lumeBin() {
  return fileURLToPath(
    new URL("../bin.js", import.meta.resolve("@lumeland/lume")),
  );
}

function vitepressBin() {
  return join(root, "node_modules", "vitepress", "bin", "vitepress.js");
}

function slug(path: string) {
  return path.replace(/^\/|\/$/g, "").replaceAll("/", "-") || "home";
}
