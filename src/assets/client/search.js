/**
 * Local search modal with VitePress's `VPLocalSearchBox` markup and keyboard
 * behavior, backed by the theme's `/search-index.json`.
 */
import MiniSearch from "./vendor/minisearch.js";
import {
  escapeHtml,
  escapeRegExp,
  labels,
  setScrollLocked,
  withBase,
} from "./utils.js";

const filterKey = "vitepress:local-search-filter";
const detailedKey = "vitepress:local-search-detailed-list";
const maxResults = 16;
const searchButton = document.querySelector(".VPNavBarSearchButton");

let indexPromise;
const pagePromises = new Map();
let box = null;
let returnFocus = null;

/** Builds the MiniSearch index with VitePress's local search options. */
function searchIndex() {
  indexPromise ??= fetch(withBase("/search-index.json"))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Search index request failed: ${response.status}`);
      }
      return response.json();
    })
    .then((sections) => {
      const search = new MiniSearch({
        fields: ["title", "titles", "text"],
        storeFields: ["title", "titles", "url", "anchor", "text"],
        searchOptions: {
          fuzzy: 0.2,
          prefix: true,
          boost: { title: 4, text: 2, titles: 1 },
        },
      });
      search.addAll(sections);
      return search;
    })
    .catch((error) => {
      // Let the next search retry instead of caching the failure.
      indexPromise = undefined;
      throw error;
    });
  return indexPromise;
}

function open() {
  if (box) {
    box.querySelector(".search-input")?.focus();
    return;
  }

  returnFocus = document.activeElement;
  box = document.createElement("div");
  box.className = "VPLocalSearchBox";
  box.setAttribute("role", "button");
  box.setAttribute("aria-expanded", "true");
  box.setAttribute("aria-haspopup", "listbox");
  box.setAttribute("aria-labelledby", "localsearch-label");
  box.innerHTML = `<div class="backdrop"></div><div class="shell"><form class="search-bar"><label title="${escapeHtml(
    labels.search,
  )}" id="localsearch-label" for="localsearch-input"><span aria-hidden="true" class="vpi-search search-icon local-search-icon"></span></label><div class="search-actions before"><button class="back-button" type="button" title="${escapeHtml(
    labels.searchBack,
  )}"><span class="vpi-arrow-left local-search-icon"></span></button></div><input aria-autocomplete="both" aria-labelledby="localsearch-label" autocapitalize="off" autocomplete="off" autocorrect="off" class="search-input" id="localsearch-input" enterkeyhint="go" maxlength="64" placeholder="${escapeHtml(
    labels.searchPlaceholder,
  )}" spellcheck="false" type="search"><div class="search-actions"><span class="search-loading" aria-live="polite"></span><button class="toggle-layout-button" type="button" title="${escapeHtml(
    labels.searchDetailedList,
  )}"><span class="vpi-layout-list local-search-icon"></span></button><button class="clear-button" type="reset" title="${escapeHtml(
    labels.searchReset,
  )}"><span class="vpi-delete local-search-icon"></span></button></div></form><ul class="results" aria-busy="false"></ul><div class="search-keyboard-shortcuts"><span><kbd aria-label="up arrow"><span class="vpi-arrow-up navigate-icon"></span></kbd><kbd aria-label="down arrow"><span class="vpi-arrow-down navigate-icon"></span></kbd> ${escapeHtml(
    labels.searchNavigate,
  )}</span><span><kbd aria-label="enter"><span class="vpi-corner-down-left navigate-icon"></span></kbd> ${escapeHtml(
    labels.searchSelect,
  )}</span><span><kbd aria-label="escape">esc</kbd> ${escapeHtml(labels.searchClose)}</span></div></div>`;
  document.body.append(box);
  setScrollLocked(true);

  const input = box.querySelector(".search-input");
  const results = box.querySelector(".results");
  const clearButton = box.querySelector(".clear-button");
  const layoutButton = box.querySelector(".toggle-layout-button");
  let matches = [];
  let selected = -1;
  let detailed = localStorage.getItem(detailedKey) === "true";
  let renderId = 0;
  let mouseMoved = false;

  const select = (index, scroll = true) => {
    selected = index;
    results.querySelectorAll("li").forEach((item, current) => {
      item.setAttribute("aria-selected", String(current === index));
      item
        .querySelector(".result")
        ?.classList.toggle("selected", current === index);
    });
    input.setAttribute(
      "aria-activedescendant",
      index > -1 ? `localsearch-item-${index}` : "",
    );
    if (scroll && index > -1) {
      results
        .querySelector(`#localsearch-item-${index}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  };

  const render = async () => {
    const query = input.value.trim();
    let tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const id = ++renderId;
    clearButton.disabled = !input.value;
    sessionStorage.setItem(filterKey, input.value);
    layoutButton.classList.toggle("detailed-list", detailed);

    if (tokens.length === 0) {
      matches = [];
      results.innerHTML = "";
      results.removeAttribute("role");
      select(-1);
      return;
    }

    const index = await searchIndex();
    if (id !== renderId) {
      return;
    }

    matches = index.search(query).slice(0, maxResults);
    const terms = new Set(
      matches.flatMap((result) => Object.keys(result.match)),
    );
    tokens = [...terms].sort((left, right) => right.length - left.length);

    if (matches.length === 0) {
      results.removeAttribute("role");
      results.innerHTML = `<li class="no-results">${escapeHtml(labels.searchNoResults)} "<strong>${escapeHtml(
        query,
      )}</strong>"</li>`;
      select(-1);
      return;
    }

    results.id = "localsearch-list";
    results.setAttribute("role", "listbox");
    results.innerHTML = matches
      .map((result, position) =>
        renderResult(result, tokens, position, detailed),
      )
      .join("");
    select(0, false);
    if (detailed) {
      void loadExcerpts(matches, tokens, results, () => id === renderId);
    }
  };

  const close = () => {
    box?.remove();
    box = null;
    setScrollLocked(false);
    returnFocus?.focus?.();
  };

  box.querySelector(".backdrop").addEventListener("click", close);
  box.querySelector(".back-button").addEventListener("click", close);
  box
    .querySelector(".search-bar")
    .addEventListener("submit", (event) => event.preventDefault());
  clearButton.addEventListener("click", (event) => {
    event.preventDefault();
    input.value = "";
    void render();
    input.focus();
  });
  layoutButton.addEventListener("click", () => {
    if (selected < 0) {
      return;
    }
    detailed = !detailed;
    localStorage.setItem(detailedKey, String(detailed));
    void render();
  });
  input.addEventListener("input", () => void render());
  results.addEventListener("mousemove", () => (mouseMoved = true));
  results.addEventListener("mouseover", (event) => {
    const item =
      event.target instanceof Element
        ? event.target.closest("li[id^='localsearch-item-']")
        : null;
    if (mouseMoved && item) {
      select(Number(item.id.replace("localsearch-item-", "")), false);
    }
  });
  results.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest(".result")) {
      close();
    }
  });
  box.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      if (matches.length > 0) {
        const step = event.key === "ArrowUp" ? -1 : 1;
        select((selected + step + matches.length) % matches.length);
        mouseMoved = false;
      }
    } else if (event.key === "Enter" && !event.isComposing && selected > -1) {
      event.preventDefault();
      const link = results.querySelector(
        `#localsearch-item-${selected} .result`,
      );
      close();
      if (link) {
        window.location.href = link.href;
      }
    }
  });

  input.value = sessionStorage.getItem(filterKey) ?? "";
  input.focus();
  input.select();
  void render();
}

/**
 * Mirrors a `VPLocalSearchBox` result. `item` is a MiniSearch result whose
 * `titles` (the parent headings) become breadcrumbs before its `title`.
 */
function renderResult(item, tokens, position, detailed) {
  const parents = item.titles ?? [];
  const { title } = item;
  const href = withBase(item.anchor ? `${item.url}#${item.anchor}` : item.url);
  const crumbs = parents
    .map(
      (text) =>
        `<span class="title"><span class="text" dir="auto">${highlight(text, tokens)}</span><span class="vpi-chevron-right local-search-icon"></span></span>`,
    )
    .join("");
  const excerpt = detailed
    ? `<div class="excerpt-wrapper" data-excerpt="${position}"><div class="excerpt" inert><div class="vp-doc"><p>${highlight(
        excerptText(item.text ?? "", tokens),
        tokens,
      )}</p></div></div><div class="excerpt-gradient-bottom"></div><div class="excerpt-gradient-top"></div></div>`
    : "";

  return `<li id="localsearch-item-${position}" aria-selected="false" role="option"><a href="${escapeHtml(
    href,
  )}" class="result" aria-label="${escapeHtml([...parents, title].join(" > "))}" data-index="${position}"><div><div class="titles"><span class="title-icon">#</span>${crumbs}<span class="title main"><span class="text" dir="auto">${highlight(
    title,
    tokens,
  )}</span></span></div>${excerpt}</div></a></li>`;
}

/** Replaces plain-text excerpts with the matching section's rendered HTML. */
async function loadExcerpts(matches, tokens, results, isCurrent) {
  await Promise.all(
    matches.map(async (item, position) => {
      try {
        const html = await sectionHtml(item, tokens);
        const target = results.querySelector(
          `[data-excerpt="${position}"] .vp-doc`,
        );
        if (html && target && isCurrent()) {
          target.innerHTML = html;
        }
      } catch {
        // Keep the plain-text excerpt.
      }
    }),
  );
}

async function sectionHtml(item, tokens) {
  const url = withBase(item.url);
  if (!pagePromises.has(url)) {
    pagePromises.set(
      url,
      fetch(url)
        .then((response) => response.text())
        .then((html) => new DOMParser().parseFromString(html, "text/html")),
    );
  }

  const content = (await pagePromises.get(url)).querySelector(".vp-doc > div");
  if (!content) {
    return "";
  }

  const heading = item.anchor
    ? content.querySelector(`[id="${CSS.escape(item.anchor)}"]`)
    : null;
  const level = heading ? Number(heading.tagName.slice(1)) : 1;
  const fragment = document.createElement("div");
  for (
    let node = heading ? heading.nextElementSibling : content.firstElementChild;
    node;
    node = node.nextElementSibling
  ) {
    const nodeLevel = /^H([1-6])$/.exec(node.tagName)?.[1];
    if (nodeLevel && Number(nodeLevel) <= level) {
      break;
    }
    fragment.append(node.cloneNode(true));
    if (fragment.textContent.length > 900) {
      break;
    }
  }

  fragment
    .querySelectorAll("script, style, iframe, .copy, [hidden], .header-anchor")
    .forEach((node) => node.remove());
  markText(fragment, tokens);
  return fragment.innerHTML;
}

function markText(root, tokens) {
  const source = `(${tokens.map(escapeRegExp).join("|")})`;
  const matches = new RegExp(source, "i");
  const pattern = new RegExp(source, "gi");
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  for (const node of nodes) {
    if (!matches.test(node.nodeValue ?? "")) {
      continue;
    }
    const span = document.createElement("span");
    span.innerHTML = escapeHtml(node.nodeValue ?? "").replace(
      pattern,
      "<mark>$1</mark>",
    );
    node.replaceWith(...span.childNodes);
  }
}

function excerptText(text, tokens) {
  const lower = text.toLowerCase();
  const first = Math.min(
    ...tokens
      .map((token) => lower.indexOf(token))
      .filter((index) => index >= 0),
  );
  const start = Number.isFinite(first) ? Math.max(0, first - 64) : 0;
  const excerpt = text.slice(start, start + 220).trim();
  return `${start > 0 ? "…" : ""}${excerpt}${start + 220 < text.length ? "…" : ""}`;
}

/** Escapes `value` and wraps matches of `tokens` in `<mark>`, matching the raw text (not entities). */
function highlight(value, tokens) {
  if (tokens.length === 0) {
    return escapeHtml(value);
  }
  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  return String(value)
    .split(pattern)
    .map((part, index) =>
      index % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part),
    )
    .join("");
}

searchButton?.addEventListener("click", open);
window.addEventListener("keydown", (event) => {
  const editable =
    event.target instanceof HTMLElement &&
    (event.target.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName));
  if (
    (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) ||
    (event.key === "/" && !editable)
  ) {
    event.preventDefault();
    open();
  }
});
