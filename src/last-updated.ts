import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { dirname } from "node:path";
import type { ThemePage } from "./lume.ts";
import { pageData } from "./pages.ts";
import type { ResolvedLumePressOptions } from "./types.ts";

/**
 * Sets `lastUpdatedDate` (and the sitemap's `lastmod`) from `lastmod` front
 * matter, else the file's last git commit or modification time.
 */
export function applyLastUpdated(
  page: ThemePage,
  theme: ResolvedLumePressOptions,
) {
  const file = page.src.entry?.src;
  if (!theme.lastUpdated || !file) {
    return;
  }

  const data = pageData(page);
  const date =
    toDate(data.lastmod) ??
    (theme.lastUpdated.git ? gitLastUpdated(file) : fileModified(file));
  if (date) {
    data.lastUpdatedDate = date;
    data.lastmod = date;
  }
}

const gitDates = new Map<string, Date | undefined>();

function gitLastUpdated(file: string): Date | undefined {
  if (!gitDates.has(file)) {
    try {
      const value = execFileSync(
        "git",
        ["log", "-1", "--format=%aI", "--", file],
        {
          cwd: dirname(file),
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        },
      ).trim();
      gitDates.set(file, value ? new Date(value) : undefined);
    } catch {
      gitDates.set(file, undefined);
    }
  }
  return gitDates.get(file);
}

function fileModified(file: string): Date | undefined {
  return statSync(file, { throwIfNoEntry: false })?.mtime;
}

function toDate(value: Date | string | undefined): Date | undefined {
  if (value === undefined || value instanceof Date) {
    return value;
  }
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}
