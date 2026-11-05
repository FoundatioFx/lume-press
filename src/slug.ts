// oxlint-disable-next-line no-control-regex -- matches VitePress's slugify
const controlCharacters = /[\u0000-\u001f]/g;
const specialCharacters = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g;
const combiningMarks = /[\u0300-\u036F]/g;

/** VitePress's heading slugify (from `@mdit-vue/shared`). */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(combiningMarks, "")
    .replace(controlCharacters, "")
    .replace(specialCharacters, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^(\d)/, "_$1")
    .toLowerCase();
}

/**
 * Other spellings of `slug` that older links may use: percent-encoded, or
 * with `-—-`/`-–-` dash runs collapsed.
 */
export function slugAliases(slug: string): string[] {
  const dashless = slug.replace(/-(?:—|–)-/g, "-");
  const aliases = new Set([
    dashless,
    encodeURIComponent(slug),
    encodeURIComponent(dashless),
  ]);
  aliases.delete(slug);
  return [...aliases];
}
