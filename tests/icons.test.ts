import { expect, test } from "vite-plus/test";
import { socialIconName, socialIconStyles } from "../src/icons.ts";

test("generates styles for any Simple Icons name, once each", () => {
  const css = socialIconStyles([
    { label: "Codeberg", link: "https://codeberg.org" },
    { label: "Docker", link: "https://hub.docker.com", icon: "docker" },
    { label: "Docker again", link: "https://hub.docker.com", icon: "docker" },
  ]);
  expect(css.match(/\.vpi-simple-icons-[\w-]+/g)).toEqual([
    ".vpi-simple-icons-codeberg",
    ".vpi-simple-icons-docker",
  ]);
  expect(css).toContain("data:image/svg+xml,");
});

test("skips raw SVG icons", () => {
  const social = { label: "Custom", link: "/", icon: "<svg></svg>" };
  expect(socialIconName(social)).toBeUndefined();
  expect(socialIconStyles([social])).toBe("");
});

test("throws for unknown icon names", () => {
  expect(() =>
    socialIconStyles([{ label: "Nope", link: "/", icon: "not-a-real-icon" }]),
  ).toThrow(/no "not-a-real-icon" icon/);
});
