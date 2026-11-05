/**
 * VitePress-compatible authoring directives, expanded in the markdown source
 * before rendering:
 *
 * - `<<< path#region{1,3-5 lang attrs} [title]` imports a code snippet.
 * - `<!--@include: path#region-or-heading{start,end}-->` includes markdown.
 *
 * Paths starting with `@/` resolve from the docs root, `~/` from the repo
 * root, configured aliases from their targets, and anything else relative to
 * the file. `#L10-L20` selects a GitHub-style line range. Directives inside
 * fenced code are left alone, so docs can show the syntax.
 */
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, normalize, relative, resolve } from "node:path";
import type { ResolvedFoundatioThemeOptions } from "./types.ts";
import { slugify } from "./slug.ts";

/** Snippet settings with the roots resolved to absolute paths. */
type Roots = {
  docsRoot: string;
  repoRoot: string;
  aliases: Array<[prefix: string, target: string]>;
};

const snippetPattern = /^[ \t]{0,3}<<<[ \t]+(.+?)[ \t]*$/gm;
const includePattern = /<!--\s*@include:\s*(.*?)\s*-->/g;
const maxIncludeDepth = 10;

/**
 * Expands snippets and includes in `markdown`, the source of `file`. Relative
 * snippet roots and aliases resolve from `srcDir`, the site's source folder.
 */
export function expandAuthoringDirectives(
  markdown: string,
  file: string,
  srcDir: string,
  theme: ResolvedFoundatioThemeOptions,
): string {
  if (!theme.snippets) {
    return markdown;
  }

  const roots: Roots = {
    docsRoot: resolve(srcDir, theme.snippets.docsRoot),
    repoRoot: resolve(srcDir, theme.snippets.repoRoot),
    aliases: Object.entries(theme.snippets.aliases).map(([prefix, target]) => [
      prefix,
      resolve(srcDir, target),
    ]),
  };
  return expandSnippets(expandIncludes(markdown, file, roots, 0), file, roots);
}

/** Applies `transform` to the parts of `markdown` outside fenced code blocks. */
function outsideFences(
  markdown: string,
  transform: (text: string) => string,
): string {
  const lines = markdown.split("\n");
  const fenced = fencedLines(lines);
  const parts: string[] = [];
  let start = 0;
  for (let index = 1; index <= lines.length; index++) {
    if (index === lines.length || fenced[index] !== fenced[start]) {
      const text = lines.slice(start, index).join("\n");
      parts.push(fenced[start] ? text : transform(text));
      start = index;
    }
  }
  return parts.join("\n");
}

/** Which lines belong to fenced code blocks (including the fences), also inside blockquotes. */
function fencedLines(lines: string[]): boolean[] {
  let fence: string | undefined;
  return lines.map((line) => {
    const marker = /^(?:[ \t]*>)*[ \t]{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (!fence) {
      fence = marker;
      return Boolean(marker);
    }
    if (
      marker?.[0] === fence[0] &&
      marker.length >= fence.length &&
      !/\S/.test(line.slice(line.indexOf(marker) + marker.length))
    ) {
      fence = undefined;
    }
    return true;
  });
}

function expandIncludes(
  markdown: string,
  filePath: string,
  roots: Roots,
  depth: number,
): string {
  if (depth > maxIncludeDepth) {
    throw new Error(
      `Includes nest deeper than ${maxIncludeDepth} levels in ${filePath}`,
    );
  }

  return outsideFences(markdown, (text) =>
    text.replace(includePattern, (_match, request: string) => {
      let value = request.trim();
      const range = /\{(\d*),(\d*)\}$/.exec(value);
      if (range) {
        value = value.slice(0, range.index);
      }
      const region = /#([^\s{]+)$/.exec(value);
      if (region) {
        value = value.slice(0, region.index);
      }

      const target = resolvePath(value, filePath, roots);
      let lines = stripFrontMatter(readFileSync(target, "utf8")).split(/\r?\n/);
      if (region) {
        lines =
          selectRegion(lines, region[1]) ??
          selectHeadingSection(lines, region[1]) ??
          fail(`Include region "${region[1]}" not found in ${target}`);
      }
      if (range) {
        const start = Math.max(Number(range[1] || 1), 1);
        const end = range[2] ? Number(range[2]) : lines.length;
        lines = lines.slice(start - 1, end);
      }

      return expandIncludes(lines.join("\n"), target, roots, depth + 1);
    }),
  );
}

function expandSnippets(
  markdown: string,
  filePath: string,
  roots: Roots,
): string {
  return outsideFences(markdown, (text) =>
    text.replace(snippetPattern, (_match, request: string) => {
      const snippet = parseSnippet(request);
      const target = resolvePath(snippet.path, filePath, roots);
      let lines = readFileSync(target, "utf8")
        .replace(/\r\n/g, "\n")
        .split("\n");

      const lineRange = /^L(\d+)(?:-L?(\d+))?$/.exec(snippet.region);
      if (lineRange) {
        lines = lines.slice(
          Number(lineRange[1]) - 1,
          Number(lineRange[2] ?? lineRange[1]),
        );
      } else if (snippet.region) {
        const region = selectRegion(lines, snippet.region);
        lines = dedent(
          region ??
            fail(
              `Code snippet region "${snippet.region}" not found in ${target}`,
            ),
        );
      }

      const content = stripRegionMarkers(lines).join("\n").replace(/\s+$/, "");
      const fence = "`".repeat(
        Math.max(
          3,
          ...[...content.matchAll(/`{3,}/g)].map((m) => m[0].length + 1),
        ),
      );
      const info = [
        snippet.lang || extension(target),
        snippet.lines && `{${snippet.lines}}`,
        snippet.attrs,
        `[${snippet.title || target.split(/[\\/]/).pop()}]`,
      ]
        .filter(Boolean)
        .join(" ");
      return `${fence}${info}\n${content}\n${fence}`;
    }),
  );
}

/** Parses `path[#region][{[lines] [lang] [attrs]}][ [title]]`, right to left like VitePress. */
function parseSnippet(raw: string) {
  let rest = raw.trim();
  let title = "";
  const titleMatch = /\s*\[(.+)\]$/.exec(rest);
  if (titleMatch) {
    title = titleMatch[1];
    rest = rest.slice(0, titleMatch.index).trimEnd();
  }

  let lines = "";
  let lang = "";
  let attrs = "";
  const braceStart = rest.lastIndexOf("{");
  if (rest.endsWith("}") && braceStart > 0) {
    let meta = rest.slice(braceStart + 1, -1).trim();
    rest = rest.slice(0, braceStart).trimEnd();
    const first = /^\S+/.exec(meta)?.[0] ?? "";
    if (/^[\d\s,-]+$/.test(meta)) {
      lines = meta.replace(/\s+/g, "");
      meta = "";
    } else if (/^\d+(?:[,-]\d+)*$/.test(first)) {
      lines = first;
      meta = meta.slice(first.length).trimStart();
    }
    lang = /^\S+/.exec(meta)?.[0] ?? "";
    attrs = meta.slice(lang.length).trim();
  }

  let region = "";
  const regionMatch = /#([\w.-]+)$/.exec(rest);
  if (regionMatch) {
    region = regionMatch[1];
    rest = rest.slice(0, regionMatch.index);
  }

  return { path: rest.trim(), region, lines, lang, attrs, title };
}

function resolvePath(value: string, fromFile: string, roots: Roots): string {
  const alias = roots.aliases.find(([prefix]) => value.startsWith(prefix));
  const resolved = normalize(
    alias
      ? resolve(alias[1], value.slice(alias[0].length))
      : value.startsWith("@/")
        ? resolve(roots.docsRoot, value.slice(2))
        : value.startsWith("~/")
          ? resolve(roots.repoRoot, value.slice(2))
          : resolve(dirname(fromFile), value),
  );

  if (
    !isInside(resolved, roots.repoRoot) &&
    !isInside(resolved, roots.docsRoot)
  ) {
    throw new Error(
      `Refusing to read ${value}; snippets must stay under ${roots.repoRoot} or ${roots.docsRoot}.`,
    );
  }
  return resolved;
}

/** VitePress's region markers, covering `//`, `#`, `<!-- -->`, `/* *\/`, `(* *)`, and JSON styles. */
const regionMarkers = [
  {
    start: /^\s*(?:\/\/\s*#?|(?:--|::|@?[rR][eE][mM])\s*#)region\b\s*(.*?)\s*$/,
    end: /^\s*(?:\/\/\s*#?|(?:--|::|@?[rR][eE][mM])\s*#)endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*#\s*(?:#\s*|pragma\s+)?[rR]egion\b\s*(.*?)\s*$/,
    end: /^\s*#\s*(?:#\s*|pragma\s+)?[eE]nd ?[rR]egion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*<!--\s*#?region\b\s*(.*?)\s*-->/,
    end: /^\s*<!--\s*#?endregion\b\s*(.*?)\s*-->/,
  },
  {
    start: /^\s*\/\*\s*#region\b\s*(.*?)\s*\*\//,
    end: /^\s*\/\*\s*#endregion\b\s*(.*?)\s*\*\//,
  },
  {
    start: /^\s*\(\*\s*#region\b\s*(.*?)\s*\*\)/,
    end: /^\s*\(\*\s*#endregion\b\s*(.*?)\s*\*\)/,
  },
  {
    start: /^\s*"\/{2,}\s*#region\b\s*(.*?)":\s*"",?\s*$/,
    end: /^\s*"\/{2,}\s*#endregion\b\s*(.*?)":\s*"",?\s*$/,
  },
];

/** Returns the lines of every region named `name` (outermost when nested), or `undefined`. */
function selectRegion(lines: string[], name: string): string[] | undefined {
  const open: Array<{
    name: string;
    start: number;
    marker: (typeof regionMarkers)[number];
  }> = [];
  const selected: string[] = [];
  let found = false;

  lines.forEach((line, index) => {
    const start = regionMarkers.find((marker) => marker.start.test(line));
    if (start) {
      open.push({
        name: unquote(start.start.exec(line)![1]),
        start: index + 1,
        marker: start,
      });
      return;
    }

    for (const marker of regionMarkers) {
      const end = marker.end.exec(line);
      if (!end) {
        continue;
      }
      const endName = unquote(end[1]);
      const openIndex = endName
        ? open.findLastIndex((region) => region.name === endName)
        : open.findLastIndex((region) => region.marker === marker);
      if (openIndex === -1) {
        continue;
      }
      const [closed] = open.splice(openIndex);
      if (
        closed.name === name &&
        !open.some((region) => region.name === name)
      ) {
        selected.push(...lines.slice(closed.start, index));
        found = true;
      }
      break;
    }
  });

  return found ? selected : undefined;
}

/** VitePress includes can also target the content under a heading, by its slug. */
function selectHeadingSection(
  lines: string[],
  slug: string,
): string[] | undefined {
  const fenced = fencedLines(lines);
  const headingLevel = (index: number) =>
    fenced[index] ? undefined : /^(#{1,6})\s/.exec(lines[index])?.[1].length;
  const start = lines.findIndex(
    (line, index) =>
      headingLevel(index) !== undefined &&
      slugify(
        line
          .replace(/^#+\s+/, "")
          .replace(/\s*\{#[^}]+\}\s*$/, "")
          .trim(),
      ) === slug,
  );
  if (start === -1) {
    return undefined;
  }

  const level = headingLevel(start)!;
  const end = lines.findIndex(
    (_line, index) => index > start && (headingLevel(index) ?? 7) <= level,
  );
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

function stripRegionMarkers(lines: string[]) {
  return lines.filter(
    (line) =>
      !regionMarkers.some(
        (marker) => marker.start.test(line) || marker.end.test(line),
      ),
  );
}

function dedent(lines: string[]) {
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => /^[ \t]*/.exec(line)![0].length),
  );
  return Number.isFinite(indent) && indent > 0
    ? lines.map((line) => line.slice(indent))
    : lines;
}

function unquote(value: string) {
  return value.replace(/^(['"])(.*)\1$/, "$2");
}

function extension(path: string) {
  return /\.([a-zA-Z0-9]+)$/.exec(path)?.[1] ?? "";
}

/** Removes a leading `---` front matter block. */
export function stripFrontMatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function isInside(path: string, root: string) {
  const child = relative(root, path);
  return (
    path === root ||
    (child !== "" && !child.startsWith("..") && !isAbsolute(child))
  );
}

function fail(message: string): never {
  throw new Error(message);
}
