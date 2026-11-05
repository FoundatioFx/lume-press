/** Highlights the aside outline link for the section in view (port of VitePress's `useActiveAnchor`). */
import { throttleAndDebounce } from "./utils.js";

const container = document.querySelector(".VPDocAsideOutline");
const marker = container?.querySelector(".outline-marker");
const asideVisible = window.matchMedia("(min-width: 80rem)");
const headers = [...(container?.querySelectorAll(".outline-link") ?? [])]
  .map((link) => ({
    link: link.hash,
    element: document.getElementById(decodeURIComponent(link.hash.slice(1))),
  }))
  .filter((header) => header.element);

let activeLink = null;
let ignoreNextScroll = false;

function absoluteTop(element) {
  let top = 0;
  for (
    let current = element;
    current && current !== document.body;
    current = current.offsetParent
  ) {
    top += current.offsetTop;
  }
  return top;
}

function activate(hash) {
  const link = hash
    ? (container?.querySelector(
        `a[href$="${CSS.escape(decodeURIComponent(hash))}"]`,
      ) ?? null)
    : null;
  if (link === activeLink) {
    return;
  }
  activeLink?.classList.remove("active");
  activeLink = link;
  if (link) {
    link.classList.add("active");
    if (marker) {
      marker.style.top = `${link.offsetTop + (link.offsetParent?.offsetTop ?? 0) + (link.offsetHeight - marker.offsetHeight) / 2}px`;
      marker.style.opacity = "1";
    }
    link.scrollIntoView({ block: "nearest", behavior: "smooth" });
  } else if (marker) {
    marker.style.top = "";
    marker.style.opacity = "0";
  }
}

function update() {
  if (!asideVisible.matches) {
    return;
  }
  if (ignoreNextScroll) {
    ignoreNextScroll = false;
    return;
  }

  const scrollY = window.scrollY;
  if (scrollY < 1 || headers.length === 0) {
    activate(null);
    return;
  }
  if (scrollY + window.innerHeight - document.body.offsetHeight >= 0) {
    activate(headers.at(-1).link);
    return;
  }

  let current = null;
  for (const { link, element } of headers) {
    const scrollMarginTop =
      Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
    if (absoluteTop(element) > scrollY + scrollMarginTop + 4) {
      break;
    }
    current = link;
  }
  activate(current);
}

if (container) {
  container.addEventListener("click", (event) => {
    const hash =
      event.target instanceof Element ? event.target.closest("a")?.hash : null;
    if (hash && asideVisible.matches) {
      ignoreNextScroll = true;
      activate(hash);
    }
  });
  window.addEventListener("scroll", throttleAndDebounce(update, 100), {
    passive: true,
  });
  requestAnimationFrame(update);
}
