import type { Options as CheckUrlsOptions } from "@lumeland/plugin-check-urls";
import type { MetaData } from "@lumeland/plugin-metas";
import type { Options as SitemapOptions } from "@lumeland/plugin-sitemap";
import type { ThemePage } from "./lume.ts";

export type FoundatioThemeOptions = {
  title: string;
  description: string;
  /** Default page language. @default "en-US" */
  lang?: string;
  /** The site URL; defaults to Lume's `location` option. */
  location?: string | URL;
  basePath?: string;
  /** Folder whose pages get the generated sidebar. */
  docsRoot?: string;
  /**
   * The sidebar, like VitePress's `themeConfig.sidebar`: one list of items, or
   * a list per path prefix. Defaults to one generated from `nav` front matter
   * for the pages under `docsRoot`.
   */
  sidebar?: Sidebar;
  /**
   * The page title's suffix, like VitePress's `titleTemplate`: `":title - Docs"`
   * replaces the whole title, a string replaces the site title, and `false`
   * drops the suffix. @default true (`Page | Site`)
   */
  titleTemplate?: string | boolean;
  head?: HeadEntry[];
  metas?: Partial<MetaData>;
  labels?: Partial<ThemeLabels>;
  brand?: {
    label?: string;
    logoLight?: string;
    logoDark?: string;
    icon?: string;
    themeColor?: string;
  };
  nav?: NavLink[];
  social?: SocialLink[];
  footer?: {
    message?: string;
    copyright?: string;
  };
  editLink?: {
    /** URL with a `:path` placeholder for the page's source path. */
    pattern: string;
    text?: string;
  };
  lastUpdated?: boolean | LastUpdatedOptions;
  outline?: OutlineOptions;
  sitemap?: boolean | SitemapOptions;
  checkUrls?: boolean | CheckUrlsOptions;
  codeHighlight?: false | CodeHighlightOptions;
  code?: {
    lineNumbers?: boolean;
  };
  snippets?: false | SnippetOptions;
  redirects?: Record<string, string>;
  llms?: boolean;
  markdownMirrors?: boolean;
  search?: boolean;
  assets?: boolean | { baseUrl?: string | URL };
  rawPagesDir?: string | false;
  ignore?: string[];
};

export type ResolvedFoundatioThemeOptions = Required<
  Pick<FoundatioThemeOptions, "title" | "description" | "docsRoot">
> & {
  lang: string;
  location?: URL;
  basePath: string;
  head: HeadEntry[];
  metas: Partial<MetaData>;
  labels: ThemeLabels;
  brand: Required<NonNullable<FoundatioThemeOptions["brand"]>>;
  sidebar?: Sidebar;
  titleTemplate: string | boolean;
  nav: NavLink[];
  social: SocialLink[];
  /** CSS for the social links' Simple Icons. */
  socialIconStyles: string;
  footer: Required<NonNullable<FoundatioThemeOptions["footer"]>>;
  editLink?: Required<NonNullable<FoundatioThemeOptions["editLink"]>>;
  lastUpdated: false | Required<LastUpdatedOptions>;
  outline: Required<OutlineOptions>;
  sitemap: false | SitemapOptions;
  checkUrls: false | CheckUrlsOptions;
  codeHighlight:
    | false
    | {
        themes: { light: string; dark: string };
        languageAlias: Record<string, string>;
      };
  code: Required<NonNullable<FoundatioThemeOptions["code"]>>;
  snippets: false | Required<SnippetOptions>;
  redirects: Record<string, string>;
  llms: boolean;
  markdownMirrors: boolean;
  search: boolean;
  assets: boolean;
  assetBaseUrl?: URL;
  rawPagesDir: string | false;
  ignore: string[];
};

export type NavLink = {
  text: string;
  link?: string;
  items?: NavLink[];
  activeMatch?: string;
  target?: string;
  rel?: string;
  noIcon?: boolean;
};

export type SocialLink = {
  label: string;
  link: string;
  /** A Simple Icons name (`github`, `discord`, …) or raw SVG markup; defaults to the label. */
  icon?: string;
};

export type Heading = {
  level: number;
  text: string;
  slug: string;
};

export type Badge = {
  text: string;
  type?: "info" | "tip" | "warning" | "danger" | (string & {});
};

export type NavMeta = {
  title?: string;
  section?: string;
  sectionOrder?: number;
  order?: number;
  hidden?: boolean;
  /** Makes a folder group collapsible; `true` starts it collapsed. */
  collapsed?: boolean;
  badge?: string | Badge;
};

export type Feature = {
  /** HTML (like an emoji), or an image; `wrap` puts the image in the icon box. */
  icon?: string | (Exclude<HeroImage, string> & { wrap?: boolean });
  title: string;
  details?: string | string[];
  link?: string;
  linkText?: string;
  target?: string;
  rel?: string;
};

export type HomeSection = {
  title?: string;
  text?: string;
  links?: Action[];
  features?: Feature[];
};

export type HeroImage =
  | string
  | { src: string; alt?: string; width?: number; height?: number }
  | {
      light: string;
      dark: string;
      alt?: string;
      width?: number;
      height?: number;
    };

export type PageLink =
  | string
  | { text?: string; link?: string; rel?: string; target?: string };

export type Action = {
  theme?: "brand" | "alt" | "sponsor";
  text: string;
  link: string;
  target?: string;
  rel?: string;
};

/** Page layouts, named like VitePress's `layout` front matter. */
export type PageLayout = "home" | "doc" | "page" | false;

export type DocsData = {
  url: string;
  title?: string;
  titleTemplate?: string | boolean;
  description?: string;
  lang?: string;
  image?: string;
  head?: HeadEntry[];
  metas?: Partial<MetaData>;
  canonical?: string | false;
  navbar?: boolean;
  sidebar?: boolean;
  aside?: boolean;
  footer?: boolean;
  editLink?: boolean;
  lastUpdated?: boolean;
  outline?: false | OutlineLevel | OutlineOptions;
  pageClass?: string;
  unlisted?: boolean;
  date?: Date | string;
  lastmod?: Date | string;
  lastUpdatedDate?: Date;
  nav?: NavMeta;
  headings?: Heading[];
  /** Markdown source, until Lume renders the page. */
  content?: unknown;
  /** Read from `layout` front matter during preprocessing, so Lume doesn't treat it as a template. */
  docsLayout?: PageLayout;
  layout?: string | false;
  search?: boolean;
  hero?: {
    name?: string;
    text?: string;
    tagline?: string;
    image?: HeroImage;
    actions?: Action[];
  };
  features?: Feature[];
  homeSections?: HomeSection[];
  prev?: false | PageLink;
  next?: false | PageLink;
  page?: ThemePage;
};

/** A sidebar entry, like VitePress's `DefaultTheme.SidebarItem`. */
export type SidebarItem = {
  /** HTML. */
  text?: string;
  link?: string;
  items?: SidebarItem[];
  /** Makes the item collapsible; `true` starts it collapsed. */
  collapsed?: boolean;
  /** Prefix for the links of this item and its children. */
  base?: string;
  /** Text for the prev/next links, instead of `text`. */
  docFooterText?: string;
  rel?: string;
  target?: string;
};

/** One sidebar, or one per path prefix (the longest matching prefix wins). */
export type Sidebar =
  | SidebarItem[]
  | Record<string, SidebarItem[] | { base: string; items: SidebarItem[] }>;

/** A sidebar entry that links to a page, for prev/next links and LLM files. */
export type SidebarLink = {
  text: string;
  link: string;
  docFooterText?: string;
  rel?: string;
  target?: string;
};

export type ContentEntry = {
  page: ThemePage;
  data: DocsData;
  sourcePath: string;
  html: string;
  markdown: string;
};

export type OutlineLevel = number | [number, number] | "deep";

export type OutlineOptions = {
  level?: OutlineLevel;
  label?: string;
};

export type LastUpdatedOptions = {
  git?: boolean;
  text?: string;
};

export type SnippetOptions = {
  docsRoot?: string;
  repoRoot?: string;
  aliases?: Record<string, string>;
};

export type CodeHighlightOptions = {
  themes?: {
    light?: string;
    dark?: string;
  };
  /** Extra language aliases, like VitePress's `markdown.languageAlias`. */
  languageAlias?: Record<string, string>;
};

/** UI text. Defaults match VitePress's English strings. */
export type ThemeLabels = {
  search: string;
  searchPlaceholder: string;
  searchNoResults: string;
  searchReset: string;
  searchBack: string;
  searchDetailedList: string;
  searchNavigate: string;
  searchSelect: string;
  searchClose: string;
  navMenu: string;
  /** The `⋯` menu's label. */
  extraMenu: string;
  sidebarMenu: string;
  sidebar: string;
  returnTop: string;
  previousPage: string;
  nextPage: string;
  pager: string;
  darkModeSwitch: string;
  darkModeSwitchTitle: string;
  lightModeSwitchTitle: string;
  skipToContent: string;
  codeCopy: string;
  codeCopied: string;
  tip: string;
  info: string;
  warning: string;
  danger: string;
  details: string;
  note: string;
  important: string;
  caution: string;
  notFoundTitle: string;
  notFoundQuote: string;
  notFoundLink: string;
  notFoundLinkLabel: string;
};

export type HeadEntry =
  | string
  | [tag: string, attrs?: HeadAttrs, content?: string];

export type HeadAttrs = Record<string, string | number | boolean | undefined>;
