/**
 * Regenerates `src/assets/vitepress.css` from the installed `vitepress` package.
 *
 * VitePress styles its default theme with global stylesheets plus scoped
 * `<style>` blocks inside each Vue component. This theme renders the same
 * markup without Vue, so scoped rules are rewritten the way Vue's compiler
 * does it, using the component's root class instead of a `data-v-…`
 * attribute: `.title` in VPNavBarTitle becomes
 * `.title:is(.VPNavBarTitle, .VPNavBarTitle *)`. That matches the component's
 * elements and keeps Vue's specificity, so the cascade resolves the same way.
 *
 * It also copies VitePress's Inter font subsets to `src/assets/fonts/` and
 * vendors MiniSearch, which the search modal uses as VitePress does.
 *
 * Run with `vp run sync:vitepress` after bumping the `vitepress` dev dependency.
 */
import {
  cpSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, relative } from "node:path";
import postcss, { type AtRule, type Rule } from "postcss";

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve("vitepress/package.json"));
const { version } = JSON.parse(
  readFileSync(join(packageDir, "package.json"), "utf8"),
) as { version: string };
const themeDir = join(packageDir, "dist/client/theme-default");
const outputPath = new URL("../src/assets/vitepress.css", import.meta.url);

/** Stylesheets for features this theme doesn't have. */
const excludedStyles = new Set(["styles/components/vp-sponsor.css"]);

/** Components this theme never renders. */
const excludedComponents = new Set([
  "VPAlgoliaSearchBox",
  "VPCarbonAds",
  "VPDocAsideCarbonAds",
  "VPDocAsideSponsors",
  "VPHomeSponsors",
  "VPNavBarAskAiButton",
  "VPNavTranslations",
  "VPSponsors",
  "VPSponsorsGrid",
  "VPTeamMembers",
  "VPTeamMembersItem",
  "VPTeamPage",
  "VPTeamPageSection",
  "VPTeamPageTitle",
]);

/** Components whose root element class differs from the component name. */
const rootClassOverrides: Record<string, string> = {
  VPDocFooterLastUpdated: "VPLastUpdated",
  VPSidebarGroup: "group",
};

/**
 * Walks the theme entry the way Vite orders CSS: each module's imports first
 * (depth-first), then the module itself. Lazily imported components come last.
 */
function themeStyles(): string[] {
  const entry = join(themeDir, "index.js");
  const visited = new Set<string>();
  const sections: string[] = [];

  const visit = (file: string) => {
    if (visited.has(file) || excludedComponents.has(basename(file, ".vue"))) {
      return;
    }
    visited.add(file);
    const source = readFileSync(file, "utf8");
    for (const [, specifier] of source.matchAll(
      /^\s*import\s+(?:[^"']+\s+from\s+)?["'](\.{1,2}\/[^"']+\.(?:vue|css|js))["']/gm,
    )) {
      visit(join(dirname(file), specifier));
    }
    sections.push(...styleSections(file, source));
  };

  visit(entry);
  for (const [, specifier] of readFileSync(entry, "utf8").matchAll(
    /import\(["'](\.{1,2}\/[^"']+\.vue)["']\)/g,
  )) {
    visit(join(dirname(entry), specifier));
  }
  for (const file of readdirSync(join(themeDir, "components")).sort()) {
    if (file.endsWith(".vue")) {
      visit(join(themeDir, "components", file));
    }
  }
  return sections;
}

function styleSections(file: string, source: string): string[] {
  const label = relative(themeDir, file);
  if (file.endsWith(".js") || excludedStyles.has(label)) {
    return [];
  }
  if (label === "styles/fonts.css") {
    return [`/* ${label} */\n${fontStyles(source)}`];
  }
  if (file.endsWith(".css")) {
    return [`/* ${label} */\n${source.trim()}`];
  }

  const name = basename(file, ".vue");
  const scope = componentScope(name, source);
  return [...source.matchAll(/<style( scoped)?>([\s\S]*?)<\/style>/g)].map(
    ([, scoped, css]) =>
      `/* ${label} */\n${scoped ? scopeCss(css, scope) : css.trim()}`,
  );
}

const rootClass = (component: string) =>
  rootClassOverrides[component] ?? component;

/**
 * The selector suffix standing in for Vue's scope attribute: the component's
 * root and everything under it, minus the subtrees of child components that
 * render their own template. Children given default-slot content from this
 * component (like a `VPLink` wrapping text) stay in scope, as in Vue. The
 * boundary sits in `:where()` so it adds no specificity.
 */
function componentScope(name: string, source: string): string {
  const root = rootClass(name);
  const template =
    /<template>([\s\S]*)<\/template>\s*(?:<script|<style|$)/.exec(
      source,
    )?.[1] ?? "";
  const boundaries = new Set<string>();
  for (const [tag, child, , content] of template.matchAll(
    /<((?:VP[A-Za-z]+|NotFound))\b(?:[^>"']|"[^"]*"|'[^']*')*?(\/>|>([\s\S]*?)<\/\1>)/g,
  )) {
    const ownTemplate =
      tag.endsWith("/>") ||
      !content.replace(/<template\s+#[\s\S]*?<\/template>/g, "").trim();
    if (ownTemplate && child !== name && !excludedComponents.has(child)) {
      boundaries.add(`.${rootClass(child)} *`);
    }
  }

  const scope = `:is(.${root}, .${root} *)`;
  return boundaries.size
    ? `${scope}:not(:where(${[...boundaries].sort().join(", ")}))`
    : scope;
}

/**
 * VitePress's bundled Inter subsets. Production builds drop the Google Fonts
 * block between the webfont markers, so it's dropped here too.
 */
function fontStyles(source: string): string {
  return source
    .replace(
      /\/\* webfont-marker-begin \*\/[\s\S]*?\/\* webfont-marker-end \*\/\s*/,
      "",
    )
    .replaceAll("../fonts/", "fonts/")
    .trim();
}

function copyFonts() {
  const target = new URL("../src/assets/fonts/", import.meta.url);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(themeDir, "fonts"), target, { recursive: true });
}

/** The browser search uses MiniSearch, like VitePress; vendored so search needs no CDN. */
function copyMiniSearch() {
  // `minisearch` doesn't export its package.json; its main entry is dist/cjs/index.cjs.
  const miniSearchDir = join(dirname(require.resolve("minisearch")), "../..");
  const source = readFileSync(
    join(miniSearchDir, "dist/es/index.js"),
    "utf8",
  ).replace(/\n\/\/# sourceMappingURL=.*\s*$/, "\n");
  const { version: miniSearchVersion } = JSON.parse(
    readFileSync(join(miniSearchDir, "package.json"), "utf8"),
  ) as { version: string };
  writeFileSync(
    new URL("../src/assets/client/vendor/minisearch.js", import.meta.url),
    `// minisearch@${miniSearchVersion} (MIT), copied by scripts/sync-vitepress.ts. Do not edit.\n${source}`,
  );
}

function scopeCss(css: string, scope: string): string {
  const root = postcss.parse(css);
  root.walkRules((rule: Rule) => {
    const parent = rule.parent as AtRule | undefined;
    if (parent?.type === "atrule" && parent.name.endsWith("keyframes")) {
      return;
    }
    rule.selectors = rule.selectors.map((selector) =>
      scopeSelector(selector, scope),
    );
  });
  return root.toString().trim();
}

/**
 * Adds `scope` where Vue adds its scope attribute: on the compound before
 * `:deep(…)`, otherwise on the last compound, ahead of any pseudo-element.
 */
function scopeSelector(selector: string, scope: string): string {
  const deep = /:deep\(((?:[^()]|\([^()]*\))*)\)/.exec(selector);
  if (deep) {
    // Like Vue: `.a > :deep(b)` becomes `.a[scope] > b`.
    const [, compound, combinator] = /^(.*?)\s*([>+~]?)\s*$/.exec(
      selector.slice(0, deep.index),
    )!;
    return `${compound}${scope} ${combinator ? `${combinator} ` : ""}${deep[1]}${selector.slice(deep.index + deep[0].length)}`;
  }

  const pseudoElement = selector.search(/::[\w-]+(\([^)]*\))?$/);
  return pseudoElement === -1
    ? `${selector}${scope}`
    : `${selector.slice(0, pseudoElement)}${scope}${selector.slice(pseudoElement)}`;
}

const sections = themeStyles();

copyFonts();
copyMiniSearch();
writeFileSync(
  outputPath,
  `/*
 * Generated by scripts/sync-vitepress.ts from vitepress@${version}. Do not edit.
 * VitePress is MIT licensed: Copyright (c) 2019-present Evan You & VitePress contributors.
 */

${sections.join("\n\n")}
`,
);

console.log(`Wrote ${outputPath.pathname} from vitepress@${version}`);
