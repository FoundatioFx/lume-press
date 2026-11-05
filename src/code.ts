/**
 * Shiki highlighting, ported from VitePress's `highlight()` so code blocks
 * render the same: same transformers, color replacements, and language rules.
 *
 * markdown-it renders synchronously, so languages are loaded up front for each
 * page (`loadPageLanguages`) and `highlight` then runs without awaiting.
 */
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import {
  type BundledLanguage,
  bundledLanguages,
  createHighlighter,
  guessEmbeddedLanguages,
  type Highlighter,
  isSpecialLang,
  type ShikiTransformer,
} from "shiki";
import type { ResolvedLumePressOptions } from "./types.ts";

type CodeHighlightOptions = Exclude<
  ResolvedLumePressOptions["codeHighlight"],
  false
>;

const defaultLanguage = "txt";
const languagePattern = /^[a-zA-Z0-9-_]+/;
/** An opening code fence, also inside blockquotes and alerts: captures the language. */
const fenceLanguagePattern =
  /^(?:[ \t]*>)*[ \t]*(?:`{3,}|~{3,})[ \t]*([\w-]+)/gm;

type HighlighterEntry = { ready: Promise<Highlighter>; instance?: Highlighter };
const highlighters = new WeakMap<CodeHighlightOptions, HighlighterEntry>();

/** One Shiki highlighter per resolved options object. */
function highlighterFor(options: CodeHighlightOptions): HighlighterEntry {
  let entry = highlighters.get(options);
  if (!entry) {
    const created: HighlighterEntry = {
      ready: createHighlighter({
        themes: [options.themes.light, options.themes.dark],
        langs: [],
        langAlias: options.languageAlias,
      }).then((instance) => (created.instance = instance)),
    };
    highlighters.set(options, (entry = created));
  }
  return entry;
}

/** Loads every language (and embedded language) used by fenced code in `markdown`. */
export async function loadPageLanguages(
  markdown: string,
  options: CodeHighlightOptions,
) {
  const shiki = await highlighterFor(options).ready;
  const languages = new Set(
    [...markdown.matchAll(fenceLanguagePattern)].map(([, language]) =>
      resolveLanguage(language.toLowerCase(), options),
    ),
  );
  for (const language of languages) {
    for (const name of [
      language,
      ...guessEmbeddedLanguages(markdown, language, shiki),
    ]) {
      if (
        isBundledLanguage(name) &&
        !shiki.getLoadedLanguages().includes(name)
      ) {
        await shiki.loadLanguage(name);
      }
    }
  }
}

function isBundledLanguage(name: string): name is BundledLanguage {
  return name in bundledLanguages;
}

function resolveLanguage(language: string, options: CodeHighlightOptions) {
  return options.languageAlias[language] ?? language;
}

/**
 * markdown-it `highlight` function. Returns `""` when highlighting is off so
 * markdown-it falls back to escaped `<pre><code>`.
 */
export function createHighlight(theme: ResolvedLumePressOptions) {
  const options = theme.codeHighlight;
  if (!options) {
    return undefined;
  }

  const entry = highlighterFor(options);
  return (code: string, rawLanguage: string, attrs: string): string => {
    const shiki = entry.instance;
    if (!shiki) {
      throw new Error(
        "Shiki is not ready; call loadPageLanguages() before rendering markdown.",
      );
    }

    let language = rawLanguage;
    const match = languagePattern.exec(language);
    if (match) {
      attrs =
        `${language.slice(match[0].length).replace(/(?<!=)\{/g, " {")} ${attrs}`
          .trim()
          .replace(/\s+/g, " ");
      language = match[0].toLowerCase();
    }
    language = resolveLanguage(language || defaultLanguage, options);
    if (
      !isSpecialLang(language) &&
      !shiki.getLoadedLanguages().includes(language)
    ) {
      language = defaultLanguage;
    }

    return shiki.codeToHtml(code.trimEnd(), {
      lang: language,
      themes: options.themes,
      defaultColor: false,
      meta: { __raw: attrs },
      transformers: [...transformers, ...options.transformers],
      colorReplacements,
    });
  };
}

/** Matches VitePress: prevents shell prompt symbols from being selected or copied. */
const disableShellSymbolSelect: ShikiTransformer = {
  name: "vitepress:disable-shell-symbol-select",
  tokens(lines) {
    if (!/^(?:shellscript|shell|bash|sh|zsh)$/.test(this.options.lang)) {
      return;
    }
    for (const tokens of lines) {
      if (tokens.length < 2) {
        continue;
      }
      const first = tokens[0].content.trim();
      if ((first === "$" || first === ">") && tokens[1].content[0] === " ") {
        tokens[0].content = `${first} `;
        tokens[0].htmlStyle ??= {};
        tokens[0].htmlStyle["user-select"] = "none";
        tokens[0].htmlStyle["-webkit-user-select"] = "none";
        tokens[1].content = tokens[1].content.slice(1);
      }
    }
  },
};

const transformers: ShikiTransformer[] = [
  transformerMetaHighlight(),
  transformerNotationDiff(),
  transformerNotationFocus({
    classActiveLine: "has-focus",
    classActivePre: "has-focused-lines",
  }),
  transformerNotationHighlight(),
  transformerNotationErrorLevel(),
  disableShellSymbolSelect,
  {
    name: "vitepress:add-dir",
    pre(node) {
      node.properties.dir = "ltr";
    },
  },
  {
    name: "vitepress:empty-line",
    code(hast) {
      for (const line of hast.children) {
        if (
          line.type === "element" &&
          line.tagName === "span" &&
          Array.isArray(line.properties.class) &&
          line.properties.class.includes("line") &&
          line.children.length === 0
        ) {
          line.children.push({
            type: "element",
            tagName: "wbr",
            properties: {},
            children: [],
          });
        }
      }
    },
  },
];

/** VitePress's contrast tweaks for the GitHub themes. */
const colorReplacements = {
  "github-light": {
    "#959da5": "#6c676f",
    "#28a745": "#0e790b",
    "#b08800": "#846312",
    "#e36209": "#c13617",
    "#3192aa": "#05728b",
    "#d73a49": "#c62739",
    "#22863a": "#11782a",
    "#6a737d": "#62687b",
    "#1b7c83": "#06747a",
    "#0366d6": "#0663d0",
    "#cb2431": "#c82430",
  },
  "github-dark": {
    "#586069": "#5b93a3",
    "#6a737d": "#818e99",
    "#ea4a5a": "#ef5564",
    "#2188ff": "#268bf9",
  },
};
