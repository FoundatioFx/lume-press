import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { SocialLink } from "./types.ts";

type IconSet = {
  icons: Record<string, { body: string; width?: number; height?: number }>;
  aliases?: Record<string, { parent: string }>;
  width?: number;
  height?: number;
};

let simpleIcons: IconSet | undefined;

/** A social link's Simple Icons name, or `undefined` when its icon is raw SVG. */
export function socialIconName(social: SocialLink): string | undefined {
  if (social.icon?.trimStart().startsWith("<")) {
    return undefined;
  }
  return (
    social.icon ?? social.label.toLowerCase().replace(/[^a-z0-9]/g, "")
  ).toLowerCase();
}

/**
 * CSS for the Simple Icons that social links use by name, like VitePress's
 * `vpi-simple-icons-*` classes. Throws for names Simple Icons doesn't have.
 */
export function socialIconStyles(links: SocialLink[]): string {
  const names = [
    ...new Set(links.map(socialIconName).filter((name) => name !== undefined)),
  ].sort();
  if (names.length === 0) {
    return "";
  }

  simpleIcons ??= JSON.parse(
    readFileSync(
      createRequire(import.meta.url).resolve(
        "@iconify-json/simple-icons/icons.json",
      ),
      "utf8",
    ),
  ) as IconSet;
  const { icons, aliases = {}, width = 24, height = 24 } = simpleIcons;

  return names
    .map((name) => {
      const icon = icons[name] ?? icons[aliases[name]?.parent ?? ""];
      if (!icon) {
        throw new Error(
          `LumePress: Simple Icons has no "${name}" icon for a social link. Use a name from https://simpleicons.org, or set \`icon\` to SVG markup.`,
        );
      }
      const w = icon.width ?? width;
      const h = icon.height ?? height;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}'>${icon.body.replaceAll('"', "'")}</svg>`;
      return `.vpi-simple-icons-${name}{--icon:url("data:image/svg+xml,${encodeSvg(svg)}")}`;
    })
    .join("\n");
}

/** Percent-encodes an SVG for a CSS data URL, keeping it readable. */
function encodeSvg(svg: string) {
  return encodeURIComponent(svg).replace(/%(?:20|3D|3A|2F|27)/g, (code) =>
    decodeURIComponent(code),
  );
}
