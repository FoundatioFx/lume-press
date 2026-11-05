import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { ResolvedLumePressOptions } from "./types.ts";

const assetsDir = new URL("./assets/", import.meta.url);

/** Browser assets (styles, scripts, fonts) served from `/assets/`, as `/`-separated paths. */
export const themeAssets: string[] = readdirSync(assetsDir, {
  recursive: true,
  withFileTypes: true,
})
  .filter((entry) => entry.isFile())
  .map((entry) =>
    relative(
      fileURLToPath(assetsDir),
      join(entry.parentPath, entry.name),
    ).replaceAll("\\", "/"),
  )
  .sort();

/** Reads a theme asset from the package, or from `assets.baseUrl` when configured. */
export async function readThemeAsset(
  theme: ResolvedLumePressOptions,
  name: string,
): Promise<string | Uint8Array> {
  const binary = name.endsWith(".woff2");
  if (!theme.assetBaseUrl) {
    const url = new URL(name, assetsDir);
    return binary
      ? new Uint8Array(await readFile(url))
      : await readFile(url, "utf8");
  }

  const url = new URL(name, theme.assetBaseUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Unable to load LumePress asset ${url.href}: ${response.status} ${response.statusText}`,
    );
  }
  return binary
    ? new Uint8Array(await response.arrayBuffer())
    : await response.text();
}
