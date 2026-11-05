import { htmlToText } from "../html.ts";
import { sidebarLinks, uniqueLinks } from "../navigation.ts";
import type {
  ContentEntry,
  DocsData,
  ResolvedLumePressOptions,
  SidebarItem,
} from "../types.ts";
import { isExternal, markdownMirrorUrl } from "../urls.ts";

/** `llms.txt`: the site description and a table of contents of the docs' markdown mirrors, by sidebar group. */
export function renderLlmsIndex(
  groups: SidebarItem[],
  theme: ResolvedLumePressOptions,
  home?: DocsData,
) {
  const tableOfContents = groups
    .map((group) => {
      const links = pageLinks([group]);
      return links.length
        ? `### ${htmlToText(group.text ?? theme.title)}\n\n${links
            .map(
              (page) =>
                `- [${htmlToText(page.docFooterText ?? page.text)}](${markdownMirrorUrl(page.link)})`,
            )
            .join("\n")}`
        : "";
    })
    .filter(Boolean)
    .join("\n\n");
  const intro = [
    `> ${home?.hero?.text ?? theme.description}`,
    home?.hero?.tagline,
  ]
    .filter(Boolean)
    .join("\n\n");

  return `# ${theme.title} Documentation\n\n${intro}\n\n## Table of Contents\n\n${tableOfContents}\n`;
}

/** `llms-full.txt`: every sidebar page's markdown, in sidebar order. */
export function renderLlmsFull(entries: ContentEntry[], groups: SidebarItem[]) {
  const byUrl = new Map(entries.map((entry) => [entry.data.url, entry]));
  return uniqueLinks(pageLinks(groups))
    .flatMap((page) => {
      const entry = byUrl.get(page.link);
      return entry ? [renderMarkdownMirror(entry)] : [];
    })
    .join("\n---\n\n");
}

/** A page's markdown (with snippets and includes expanded), served beside its HTML. */
export function renderMarkdownMirror(entry: ContentEntry) {
  return `---\nurl: ${markdownMirrorUrl(entry.data.url)}\n---\n${entry.markdown.trim()}\n`;
}

/** The site's own pages in the sidebar, without hash links. */
function pageLinks(items: SidebarItem[]) {
  return sidebarLinks(items).filter(
    (page) => !isExternal(page.link) && !page.link.includes("#"),
  );
}
