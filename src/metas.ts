import type { MetaData } from "@lumeland/plugin-metas";
import { firstHeading } from "./pages.ts";
import type { DocsData, ResolvedFoundatioThemeOptions } from "./types.ts";

/** The page `<title>`, like VitePress's `createTitle` with `titleTemplate`. */
export function pageTitle(
  data: DocsData,
  theme: ResolvedFoundatioThemeOptions,
): string {
  const title = data.title ?? firstHeading(data) ?? theme.title;
  const template = data.titleTemplate ?? theme.titleTemplate;
  if (typeof template === "string" && template.includes(":title")) {
    return template.replaceAll(":title", title);
  }

  const suffix =
    template === false || template === theme.title
      ? ""
      : ` | ${template === true ? theme.title : template}`;
  return title === suffix.slice(3) ? title : `${title}${suffix}`;
}

/** Values for Lume's metas plugin, which writes the Open Graph and Twitter tags. */
export function pageMetas(
  data: DocsData,
  theme: ResolvedFoundatioThemeOptions,
): Partial<MetaData> {
  return {
    site: theme.title,
    title: pageTitle(data, theme),
    description: data.description ?? theme.description,
    icon: theme.brand.icon,
    image: data.image,
    color: theme.brand.themeColor,
    lang: data.lang ?? theme.lang,
    generator: true,
    ...theme.metas,
    ...data.metas,
  };
}
