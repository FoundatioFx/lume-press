/**
 * Priority+ nav bar overflow, ported from VitePress's `nav-overflow`: under
 * space pressure social links, then the appearance switch, then menu items
 * (right to left) move into the `⋯` menu. Collapsed units stay in the bar,
 * hidden but measurable, so expanding again never works from stale widths.
 */

/** Collapse order of the bar's clusters. */
const clusterUnits = ["appearance", "socialLinks"];
const allVisible = {
  visibleItemCount: Infinity,
  appearance: true,
  socialLinks: true,
};
/** Headroom against sub-pixel rounding and the dividers between units. */
const slack = 24;

const contentBody = document.querySelector(".VPNavBar .content-body");
const menu = contentBody?.querySelector(":scope > .menu");
const extra = contentBody?.querySelector(":scope > .VPNavBarExtra");

if (contentBody && extra) {
  const items = [...(menu?.querySelectorAll(":scope > .list > li") ?? [])];
  const clusters = {
    appearance: contentBody.querySelector(":scope > .appearance"),
    socialLinks: contentBody.querySelector(":scope > .social-links"),
  };
  // The menu's content is detached and re-added as units collapse, like
  // VitePress's `v-if`s, so `.group + .group` and `:last-child` styles apply.
  const extraMenu = extra.querySelector(".VPMenu");
  const extraItemList = extra.querySelector(".overflow-items");
  const extraItems = [...(extraItemList?.children ?? [])];
  const extraGroups = {
    appearance: extra.querySelector('[data-overflow="appearance"]'),
    socialLinks: extra.querySelector('[data-overflow="socialLinks"]'),
  };
  const isWide = window.matchMedia("(min-width: 48rem)");
  // Until the `⋯` button has been measured once.
  let extraWidth = 48;
  let scheduled = false;

  const measure = (element) =>
    Math.max(element.offsetWidth, element.scrollWidth);

  function recompute() {
    if (!isWide.matches) {
      apply(allVisible);
      return;
    }
    if (extra.offsetWidth > 0) {
      extraWidth = extra.offsetWidth;
    }

    const units = new Set([menu, extra, ...Object.values(clusters)]);
    let fixed = 0;
    for (const child of contentBody.children) {
      if (child instanceof HTMLElement && !units.has(child)) {
        fixed += child.offsetWidth;
      }
    }
    apply(
      computeNavFit({
        itemWidths: items.map(measure),
        appearance: clusters.appearance ? measure(clusters.appearance) : null,
        socialLinks: clusters.socialLinks
          ? measure(clusters.socialLinks)
          : null,
        available: contentBody.clientWidth - fixed - slack,
        extraWidth,
      }),
    );
  }

  function apply(result) {
    items.forEach((item, index) =>
      item.classList.toggle("collapsed", index >= result.visibleItemCount),
    );
    const overflowItems = extraItems.slice(result.visibleItemCount);
    extraItemList?.replaceChildren(...overflowItems);
    const groups = [
      overflowItems.length > 0 && extraItemList,
      ...clusterUnits.map((unit) => {
        clusters[unit]?.classList.toggle("collapsed", !result[unit]);
        return !result[unit] && extraGroups[unit];
      }),
    ].filter(Boolean);
    extraMenu?.replaceChildren(...groups);
    extra.hidden = groups.length === 0;
  }

  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        recompute();
      });
    }
  }

  const observer = new ResizeObserver(schedule);
  for (const element of [contentBody, menu, extra, ...items]) {
    if (element) {
      observer.observe(element);
    }
  }
  for (const element of Object.values(clusters)) {
    if (element) {
      observer.observe(element);
    }
  }
  isWide.addEventListener("change", schedule);
  document.fonts?.ready.then(schedule).catch(() => {});
  recompute();
}

/** VitePress's `computeNavFit`: which units fit in the space available. */
function computeNavFit({ itemWidths, available, extraWidth, ...widths }) {
  const itemsTotal = itemWidths.reduce((sum, width) => sum + width, 0);
  const clustersTotal = clusterUnits.reduce(
    (sum, unit) => sum + (widths[unit] ?? 0),
    0,
  );
  if (itemsTotal + clustersTotal <= available) {
    return allVisible;
  }

  const budget = available - extraWidth;
  if (itemsTotal > budget) {
    let used = 0;
    let visibleItemCount = 0;
    for (const width of itemWidths) {
      if (used + width > budget) {
        break;
      }
      used += width;
      visibleItemCount++;
    }
    return {
      visibleItemCount,
      appearance: widths.appearance == null,
      socialLinks: widths.socialLinks == null,
    };
  }

  const result = { ...allVisible };
  let used = itemsTotal;
  let dropRest = false;
  for (const unit of clusterUnits) {
    const width = widths[unit];
    if (width == null) {
      continue;
    }
    if (dropRest || used + width > budget) {
      dropRest = true;
      result[unit] = false;
    } else {
      used += width;
    }
  }
  return result;
}
