/** Dark mode switch, matching VitePress's `useDark` behavior and storage key. */
import { labels } from "./utils.js";

const root = document.documentElement;
const storageKey = "vitepress-theme-appearance";
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
const switches = document.querySelectorAll(".VPSwitchAppearance");

function sync() {
  const dark = root.classList.contains("dark");
  for (const button of switches) {
    button.setAttribute("aria-checked", String(dark));
    button.title = dark
      ? labels.lightModeSwitchTitle
      : labels.darkModeSwitchTitle;
  }
}

function setDark(dark) {
  // Suppress transitions while colors flip, as VitePress does.
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.append(style);
  root.classList.toggle("dark", dark);
  localStorage.setItem(
    storageKey,
    dark === prefersDark.matches ? "auto" : dark ? "dark" : "light",
  );
  void window.getComputedStyle(style).opacity;
  style.remove();
  sync();
}

for (const button of switches) {
  button.addEventListener("click", () =>
    setDark(!root.classList.contains("dark")),
  );
}

prefersDark.addEventListener("change", (event) => {
  if ((localStorage.getItem(storageKey) ?? "auto") === "auto") {
    root.classList.toggle("dark", event.matches);
    sync();
  }
});

sync();
