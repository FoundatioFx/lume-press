import { escapeHtml, inlineJson } from "../html.ts";
import type {
  DocsData,
  HeadEntry,
  ResolvedLumePressOptions,
} from "../types.ts";
import { attrs } from "./markup.ts";

/** The site's social link icons, generated from the icons it uses. */
export const socialIconStylesUrl = "/assets/social-icons.css";

/** VitePress's appearance storage key, shared so a reader's choice carries over (see `client/appearance.js`). */
const appearanceStorageKey = "vitepress-theme-appearance";

export function renderHead(options: {
  title: string;
  data: DocsData;
  theme: ResolvedLumePressOptions;
}): string {
  const { data, theme } = options;
  const entries: HeadEntry[] = [
    ["meta", { charset: "utf-8" }],
    [
      "meta",
      { name: "viewport", content: "width=device-width,initial-scale=1" },
    ],
    ["title", {}, escapeHtml(options.title)],
    [
      "meta",
      { name: "description", content: data.description ?? theme.description },
    ],
    [
      "link",
      {
        rel: "preload",
        href: "/assets/fonts/inter-roman-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: true,
      },
    ],
    ["link", { rel: "stylesheet", href: "/assets/vitepress.css" }],
    ["link", { rel: "stylesheet", href: "/assets/site.css" }],
    ...(theme.socialIconStyles
      ? [
          [
            "link",
            { rel: "stylesheet", href: socialIconStylesUrl },
          ] satisfies HeadEntry,
        ]
      : []),
    ...(theme.brand.icon
      ? [["link", { rel: "icon", href: theme.brand.icon }] satisfies HeadEntry]
      : []),
    ["meta", { name: "theme-color", content: theme.brand.themeColor }],
    ...canonical(data, theme),
    ...theme.head,
    ...(data.head ?? []),
    [
      "script",
      {},
      `window.__LUMEPRESS_BASE_PATH__=${inlineJson(theme.basePath)};window.__LUMEPRESS_LABELS__=${inlineJson(theme.labels)};`,
    ],
    [
      "script",
      { id: "check-dark-mode" },
      `(()=>{const e=localStorage.getItem(${inlineJson(appearanceStorageKey)})||"auto",t=window.matchMedia("(prefers-color-scheme: dark)").matches;(!e||e==="auto"?t:e==="dark")&&document.documentElement.classList.add("dark")})();`,
    ],
    [
      "script",
      { id: "check-mac-os" },
      'document.documentElement.classList.toggle("mac",/Mac|iPhone|iPod|iPad/i.test(navigator.platform));',
    ],
  ];

  return entries.map(renderHeadEntry).join("\n  ");
}

/** The page's absolute URL, including the site's base path. */
function canonical(
  data: DocsData,
  theme: ResolvedLumePressOptions,
): HeadEntry[] {
  if (data.canonical === false || !theme.location) {
    return [];
  }
  const href =
    data.canonical ||
    new URL(`${theme.basePath}${data.url.replace(/^\//, "")}`, theme.location)
      .href;
  return [["link", { rel: "canonical", href }]];
}

const voidTags = new Set(["base", "link", "meta"]);

function renderHeadEntry(entry: HeadEntry): string {
  if (typeof entry === "string") {
    return entry;
  }
  const [tag, attributes = {}, content = ""] = entry;
  return voidTags.has(tag)
    ? `<${tag}${attrs(attributes)}>`
    : `<${tag}${attrs(attributes)}>${content}</${tag}>`;
}
