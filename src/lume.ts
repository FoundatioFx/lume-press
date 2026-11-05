import { Page } from "@lumeland/core/file.ts";
import type Site from "@lumeland/core/site.ts";

export type ThemePage = Page;
export type ThemeSite = Site;

type GeneratedPageData = {
  url: string;
  content?: string | Uint8Array;
  unlisted?: boolean;
  search?: boolean;
  [key: string]: unknown;
};

export function createGeneratedPage(data: GeneratedPageData): ThemePage {
  return Page.create(data);
}
