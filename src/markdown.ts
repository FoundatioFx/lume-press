/**
 * markdown-it setup matching VitePress's markdown pipeline: the same
 * `@mdit` plugins and ports of its container, code fence, and alert plugins,
 * so rendered HTML lines up with the VitePress default theme's CSS.
 */
import { anchor } from "@mdit/plugin-anchor";
import { attrs } from "@mdit/plugin-attrs";
import { container } from "@mdit/plugin-container";
import { fullEmoji } from "@mdit/plugin-emoji";
import { footnote } from "@mdit/plugin-footnote";
import { tasklist } from "@mdit/plugin-tasklist";
import type { Options as MarkdownOptions } from "@lumeland/plugin-markdown";
import type { MarkdownIt, StateCore, Token } from "markdown-it";
import cjkFriendly from "markdown-it-cjk-friendly";
import { createHighlight } from "./code.ts";
import { isExternal } from "./urls.ts";
import type { ResolvedLumePressOptions, ThemeLabels } from "./types.ts";
import { escapeAttribute, escapeHtml } from "./html.ts";
import { slugAliases, slugify } from "./slug.ts";

type RenderRule = NonNullable<MarkdownIt["renderer"]["rules"]["fence"]>;

/** Options for Lume's markdown plugin. */
export function markdownOptions(
  theme: ResolvedLumePressOptions,
): MarkdownOptions {
  return {
    options: {
      html: true,
      linkify: true,
      highlight: createHighlight(theme),
    },
    useDefaultPlugins: false,
    plugins: [
      (md: MarkdownIt) => md.linkify.set({ fuzzyLink: false }),
      (md: MarkdownIt) => preWrapperPlugin(md, theme),
      (md: MarkdownIt) => lineNumberPlugin(md, theme.code.lineNumbers),
      (md: MarkdownIt) => containerPlugin(md, theme),
      (md: MarkdownIt) => gitHubAlertsPlugin(md, theme),
      externalLinkPlugin,
      tableTabIndexPlugin,
      [
        attrs,
        {
          rule: [
            "inline",
            "table",
            "list",
            "heading",
            "hr",
            "softbreak",
            "blockInfo",
            "blockEnd",
            "tasklist",
          ],
        },
      ],
      fullEmoji,
      tasklist,
      footnote,
      cjkFriendly,
      [
        anchor,
        {
          slugify,
          tabIndex: -1,
          getTokensText: (tokens: Token[]) =>
            tokens
              .filter((token) => !["html_inline", "emoji"].includes(token.type))
              .map((token) => token.content)
              .join(""),
          permalink: headerAnchor,
        },
      ],
      headingAliasPlugin,
      tocPlugin,
      componentBlockPlugin,
    ],
  };
}

/** VitePress's permalink: ` <a class="header-anchor" …>&#8203;</a>` inside the heading. */
function headerAnchor(
  slug: string,
  _options: unknown,
  state: StateCore,
  index: number,
) {
  const inline = state.tokens[index + 1];
  const title = (inline?.children ?? [])
    .filter(
      (token: Token) => token.type === "text" || token.type === "code_inline",
    )
    .map((token: Token) => token.content)
    .join("")
    .trim();

  inline?.children?.push(
    Object.assign(new state.Token("text", "", 0), { content: " " }),
    Object.assign(new state.Token("link_open", "a", 1), {
      attrs: [
        ["class", "header-anchor"],
        ["href", `#${slug}`],
        ["aria-label", `Permalink to “${title}”`],
      ],
    }),
    Object.assign(new state.Token("html_inline", "", 0), {
      content: "&#8203;",
    }),
    new state.Token("link_close", "a", -1),
  );
}

/**
 * Theme extension: keeps older anchor spellings (encoded or with dash runs)
 * working by adding empty targets ahead of the heading.
 */
function headingAliasPlugin(md: MarkdownIt) {
  const open = md.renderer.rules.heading_open;
  md.renderer.rules.heading_open = (tokens, index, options, env, self) => {
    const id = String(tokens[index].attrGet("id") ?? "");
    const aliases = slugAliases(id)
      .map((alias) => `<span id="${escapeAttribute(alias)}"></span>`)
      .join("");
    return (
      aliases +
      (open
        ? open(tokens, index, options, env, self)
        : self.renderToken(tokens, index, options))
    );
  };
}

/**
 * Like VitePress (`@mdit-vue/plugin-component`), a line starting with a
 * component tag such as `<Badge … />` is an HTML block, not a paragraph.
 */
function componentBlockPlugin(md: MarkdownIt) {
  const componentTag = /^<\/?(?:[A-Z][\w-]*|[a-z][a-z0-9]*-[\w-]*)(?=[\s/>]|$)/;
  md.block.ruler.before(
    "html_block",
    "component_block",
    (state, startLine, endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      if (
        state.sCount[startLine] - state.blkIndent >= 4 ||
        !componentTag.test(state.src.slice(start, state.eMarks[startLine]))
      ) {
        return false;
      }
      if (silent) {
        return true;
      }

      let nextLine = startLine + 1;
      while (nextLine < endLine && !state.isEmpty(nextLine)) {
        nextLine++;
      }
      state.line = nextLine;
      const token = state.push("html_block", "", 0);
      token.map = [startLine, nextLine];
      token.content = state.getLines(
        startLine,
        nextLine,
        state.blkIndent,
        true,
      );
      return true;
    },
    { alt: ["paragraph", "reference", "blockquote"] },
  );
}

/** `[[toc]]` becomes a placeholder that the layout fills from the page's headings. */
function tocPlugin(md: MarkdownIt) {
  md.block.ruler.before(
    "paragraph",
    "toc",
    (state, startLine, _endLine, silent) => {
      const start = state.bMarks[startLine] + state.tShift[startLine];
      if (
        state.src.slice(start, state.eMarks[startLine]).trim() !== "[[toc]]"
      ) {
        return false;
      }
      if (!silent) {
        const token = state.push("html_block", "", 0);
        token.content = '<nav class="table-of-contents" data-toc></nav>\n';
        token.map = [startLine, startLine + 1];
        state.line = startLine + 1;
      }
      return true;
    },
  );
}

/** Port of VitePress's `preWrapperPlugin`, plus Mermaid fences. */
function preWrapperPlugin(md: MarkdownIt, theme: ResolvedLumePressOptions) {
  const fence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (...args) => {
    const [tokens, index] = args;
    const token = tokens[index];
    if (extractLang(token.info) === "mermaid") {
      return `<pre class="mermaid">${escapeHtml(token.content)}</pre>\n`;
    }

    token.info = token.info.replace(/\[.*\]/, "");
    const active = / active( |$)/.test(token.info) ? " active" : "";
    token.info = token.info.replace(/ active$/, "").replace(/ active /, " ");
    const lang = extractLang(token.info);
    const label = escapeHtml(lang.replace(/_/g, " "));
    return `<div class="language-${lang}${active}" dir="ltr"><button title="${escapeAttribute(
      theme.labels.codeCopy,
    )}" data-copied="${escapeAttribute(theme.labels.codeCopied)}" class="copy"></button><span class="lang">${label}</span>${fence(...args)}</div>`;
  };
}

function extractLang(info: string) {
  return (
    /^[a-zA-Z0-9-_]+/
      .exec(info)?.[0]
      .replace(/-vue$/, "")
      .replace(/^vue-html$/, "template")
      .replace(/^ansi$/, "") ?? ""
  );
}

function extractTitle(info: string, html = false) {
  if (html) {
    return (
      info.replace(/<!--[\s\S]*?-->/g, "").match(/data-title="(.*?)"/)?.[1] ??
      ""
    );
  }
  return info.match(/\[(.*)\]/)?.[1] || extractLang(info) || "txt";
}

/** Port of VitePress's `lineNumberPlugin` (`:line-numbers`, `:line-numbers=N`, `:no-line-numbers`). */
function lineNumberPlugin(md: MarkdownIt, enabled: boolean) {
  const fence = md.renderer.rules.fence!;
  md.renderer.rules.fence = (...args) => {
    const rawCode = fence(...args);
    const info = args[0][args[1]].info;
    if (
      (!enabled && !/:line-numbers\b/.test(info)) ||
      (enabled && /:no-line-numbers\b/.test(info))
    ) {
      return rawCode;
    }

    const start = Number(/=(\d+)/.exec(info)?.[1] ?? 1);
    const lines = rawCode
      .slice(rawCode.indexOf("<code>"), rawCode.indexOf("</code>"))
      .split("\n");
    const numbers = lines
      .map(
        (_, index) => `<span class="line-number">${index + start}</span><br>`,
      )
      .join("");
    return rawCode
      .replace(
        /<\/div>$/,
        `<div class="line-numbers-wrapper" aria-hidden="true">${numbers}</div></div>`,
      )
      .replace(/"(language-[^"]*?)"/, '"$1 line-numbers-mode"');
  };
}

/** Custom block types; each one's default title is the label of the same name. */
const containerTypes = [
  "tip",
  "info",
  "warning",
  "danger",
  "details",
  "note",
  "important",
  "caution",
] as const satisfies Array<keyof ThemeLabels>;

/** Port of VitePress's `containerPlugin`: custom blocks, `details`, `raw`, `v-pre`, and `code-group`. */
function containerPlugin(md: MarkdownIt, theme: ResolvedLumePressOptions) {
  md.use(container, {
    name: "v-pre",
    openRenderer: () => "<div v-pre>\n",
    closeRenderer: () => "</div>\n",
  })
    .use(container, {
      name: "raw",
      openRenderer: () => '<div class="vp-raw">\n',
      closeRenderer: () => "</div>\n",
    })
    .use(container, {
      name: "code-group",
      openRenderer: codeGroupOpenRender(md),
      closeRenderer: () => "</div></div>\n",
    });

  for (const name of containerTypes) {
    md.use(container, {
      name,
      openRenderer: (
        tokens: Token[],
        index: number,
        _options: unknown,
        env: unknown,
      ) => {
        const token = tokens[index];
        const info = token.info.trim().slice(name.length).trim();
        const noTitle = popAttr(token, "no-title") === "" && name !== "details";
        token.attrJoin("class", `${name} custom-block`);
        const rendered = md.renderer.renderAttrs(token).trim();
        if (noTitle) {
          return `<div ${rendered}>\n`;
        }

        // Only the link references, like VitePress: the whole env would
        // make plugins like footnotes render their output into the title.
        const title = md.renderInline(info || theme.labels[name], {
          references: (env as Parameters<MarkdownIt["renderInline"]>[1])
            ?.references,
        });
        return name === "details"
          ? `<details ${rendered}><summary>${title}</summary>\n`
          : `<div ${rendered}><p class="custom-block-title${info ? "" : " custom-block-title-default"}">${title}</p>\n`;
      },
      closeRenderer: () => (name === "details" ? "</details>\n" : "</div>\n"),
    });
  }
}

function popAttr(token: Token, name: string) {
  const index = token.attrIndex(name);
  return index < 0 ? null : token.attrs!.splice(index, 1)[0][1];
}

function codeGroupOpenRender(md: MarkdownIt) {
  return (tokens: Token[], index: number) => {
    let tabs = "";
    let checked = "checked";
    for (
      let i = index + 1;
      !(
        tokens[i].nesting === -1 &&
        tokens[i].type === "container_code-group_close"
      );
      ++i
    ) {
      const isHtml = tokens[i].type === "html_block";
      if ((tokens[i].type === "fence" && tokens[i].tag === "code") || isHtml) {
        const title = extractTitle(
          isHtml ? tokens[i].content : tokens[i].info,
          isHtml,
        );
        if (title) {
          tabs += `<input type="radio" name="group-${index}" id="tab-${i}" ${checked}><label data-title="${md.utils.escapeHtml(
            title,
          )}" for="tab-${i}">${title}</label>`;
          if (checked && !isHtml) {
            tokens[i].info += " active";
          }
          checked = "";
        }
      }
    }
    return `<div class="vp-code-group"><div class="tabs">${tabs}</div><div class="blocks">\n`;
  };
}

function isContainerType(
  type: string,
): type is (typeof containerTypes)[number] {
  return (containerTypes as readonly string[]).includes(type);
}

const alertMarker = /^\[!([\w-]+)\]([^\n\r]*)/;

/** Port of VitePress's `gitHubAlertsPlugin` (`> [!NOTE]` and friends). */
function gitHubAlertsPlugin(md: MarkdownIt, theme: ResolvedLumePressOptions) {
  md.core.ruler.after("block", "github-alerts", (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== "blockquote_open") {
        continue;
      }

      const open = tokens[i];
      let end = i + 1;
      while (
        end < tokens.length &&
        (tokens[end].type !== "blockquote_close" ||
          tokens[end].level !== open.level)
      ) {
        end++;
      }
      if (end === tokens.length) {
        continue;
      }

      const firstContent = tokens
        .slice(i, end + 1)
        .find((token) => token.type === "inline");
      const match = firstContent?.content.match(alertMarker);
      if (!firstContent || !match) {
        continue;
      }

      const type = match[1].toLowerCase();
      if (type === "details" || !isContainerType(type)) {
        continue;
      }

      firstContent.content = firstContent.content
        .slice(match[0].length)
        .trimStart();
      open.type = "github_alert_open";
      open.tag = "div";
      open.meta = {
        title: match[2].trim() || theme.labels[type],
        type,
      };
      tokens[end].type = "github_alert_close";
      tokens[end].tag = "div";
    }
  });

  md.renderer.rules.github_alert_open = (tokens, index) => {
    const { title, type } = tokens[index].meta as {
      title: string;
      type: string;
    };
    return `<div class="${type} custom-block github-alert"><p class="custom-block-title">${title}</p>\n`;
  };
}

/** Like VitePress, external links open in a new tab. */
function externalLinkPlugin(md: MarkdownIt) {
  const open: RenderRule =
    md.renderer.rules.link_open ??
    ((tokens, index, options, _env, self) =>
      self.renderToken(tokens, index, options));
  md.renderer.rules.link_open = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const href = String(token.attrGet("href") ?? "");
    if (isExternal(href)) {
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noreferrer");
    }
    return open(tokens, index, options, env, self);
  };
}

/** Like VitePress, tables are keyboard-focusable so wide tables can scroll. */
function tableTabIndexPlugin(md: MarkdownIt) {
  const open: RenderRule =
    md.renderer.rules.table_open ??
    ((tokens, index, options, _env, self) =>
      self.renderToken(tokens, index, options));
  md.renderer.rules.table_open = (tokens, index, options, env, self) => {
    if (tokens[index].attrIndex("tabindex") < 0) {
      tokens[index].attrSet("tabindex", "0");
    }
    return open(tokens, index, options, env, self);
  };
}
