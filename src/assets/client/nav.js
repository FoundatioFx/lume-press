/**
 * Nav bar, mobile nav screen, flyout menus, sidebar, and the mobile outline
 * dropdown, mirroring the VitePress default theme's behavior.
 */
import { setScrollLocked, transition } from "./utils.js";

const navBar = document.querySelector(".VPNavBar");
const hamburger = document.querySelector(".VPNavBarHamburger");
const navScreen = document.querySelector(".VPNavScreen");
const sidebar = document.querySelector(".VPSidebar");
const sidebarButton = document.querySelector(".VPLocalNav .menu");
const backdrop = document.querySelector(".VPBackdrop");
const outlineDropdown = document.querySelector(".VPLocalNavOutlineDropdown");

// Open state lives in `aria-expanded`; `hidden` lags behind while a menu fades out.
const isExpanded = (button) => button?.getAttribute("aria-expanded") === "true";

// The bar is transparent at the top of the home page and opaque once scrolled.
const syncTop = () => navBar?.classList.toggle("top", window.scrollY === 0);
window.addEventListener("scroll", syncTop, { passive: true });
syncTop();

function setNavScreenOpen(open) {
  if (!navScreen || !hamburger || open === isExpanded(hamburger)) {
    return;
  }
  hamburger.classList.toggle("active", open);
  hamburger.setAttribute("aria-expanded", String(open));
  navBar?.classList.toggle("screen-open", open);
  transition(navScreen, "fade", open);
  setScrollLocked(open);
}

hamburger?.addEventListener("click", () =>
  setNavScreenOpen(!isExpanded(hamburger)),
);
navScreen?.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("a")) {
    setNavScreenOpen(false);
  }
});

for (const group of document.querySelectorAll(".VPNavScreenMenuGroup")) {
  const button = group.querySelector(".button");
  const items = group.querySelector(".items");
  button?.addEventListener("click", () => {
    const open = !group.classList.contains("open");
    group.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    if (items) {
      items.hidden = !open;
    }
  });
}

function setSidebarOpen(open) {
  if (!sidebar || open === sidebar.classList.contains("open")) {
    return;
  }
  sidebar.classList.toggle("open", open);
  sidebarButton?.setAttribute("aria-expanded", String(open));
  if (backdrop) {
    transition(backdrop, "fade", open);
  }
  if (open) {
    sidebar.querySelector(".nav")?.focus({ preventScroll: true });
  }
}

sidebarButton?.addEventListener("click", () => setSidebarOpen(true));
backdrop?.addEventListener("click", () => setSidebarOpen(false));
sidebar?.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("a")) {
    setSidebarOpen(false);
    return;
  }

  // Collapsible items toggle from their caret, or from the whole row when it isn't a link.
  const caret = target?.closest(".caret");
  const row = target?.closest(".VPSidebarItem.collapsible > .item");
  const item = (caret ?? row)?.closest(".VPSidebarItem.collapsible");
  if (item && (caret || !row?.querySelector(":scope > .link"))) {
    const collapsed = item.classList.toggle("collapsed");
    item
      .querySelector(":scope > .item > .caret")
      ?.setAttribute("aria-expanded", String(!collapsed));
  }
});

// Flyouts, like VitePress's `VPFlyout`: a mouse opens them on hover (and the
// click that follows doesn't close them again), others toggle on click.
// Escape, a tap outside, or focus leaving closes them.
for (const flyout of document.querySelectorAll(".VPFlyout")) {
  const button = flyout.querySelector(":scope > .button");
  const panel = flyout.querySelector(":scope > .menu");
  if (!button) {
    continue;
  }
  let openedByHover = false;
  const setOpen = (open) => {
    button.setAttribute("aria-expanded", String(open));
    if (!open) {
      openedByHover = false;
    }
  };
  const onPointerLeave = (event) => {
    const to = event.relatedTarget;
    if (
      event.pointerType === "mouse" &&
      !(to instanceof Node && (button.contains(to) || panel?.contains(to)))
    ) {
      setOpen(false);
    }
  };

  button.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse" && !isExpanded(button)) {
      setOpen(true);
      openedByHover = true;
    }
  });
  button.addEventListener("pointerleave", onPointerLeave);
  panel?.addEventListener("pointerleave", onPointerLeave);
  button.addEventListener("click", () => {
    if (openedByHover) {
      openedByHover = false;
      return;
    }
    setOpen(!isExpanded(button));
  });
  flyout.addEventListener("focusout", (event) => {
    if (!flyout.contains(event.relatedTarget)) {
      setOpen(false);
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (isExpanded(button) && !flyout.contains(event.target)) {
      setOpen(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isExpanded(button)) {
      const hadFocus = flyout.contains(document.activeElement);
      setOpen(false);
      if (hadFocus) {
        button.focus();
      }
    }
  });
}

// Mobile "On this page" dropdown.
const outlineButton = outlineDropdown?.querySelector(
  ":scope > button[aria-controls]",
);
const outlineItems = outlineDropdown?.querySelector(".items");

function setOutlineOpen(open) {
  if (!outlineButton || !outlineItems || open === isExpanded(outlineButton)) {
    return;
  }
  if (open) {
    const navHeight = outlineDropdown.getBoundingClientRect().top;
    outlineDropdown.style.setProperty(
      "--vp-vh",
      `${window.innerHeight - navHeight}px`,
    );
  }
  outlineButton.classList.toggle("open", open);
  outlineButton.setAttribute("aria-expanded", String(open));
  transition(outlineItems, "flyout", open);
}

outlineButton?.addEventListener("click", () =>
  setOutlineOpen(!isExpanded(outlineButton)),
);
outlineItems?.addEventListener("click", (event) => {
  const link =
    event.target instanceof Element ? event.target.closest("a") : null;
  if (link?.classList.contains("top-link")) {
    event.preventDefault();
    window.scrollTo({ top: 0 });
  }
  setOutlineOpen(false);
});
document.addEventListener("click", (event) => {
  if (
    outlineDropdown &&
    event.target instanceof Node &&
    !outlineDropdown.contains(event.target)
  ) {
    setOutlineOpen(false);
  }
});
document
  .querySelector(".VPLocalNav .return-top")
  ?.addEventListener("click", () => window.scrollTo({ top: 0 }));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setSidebarOpen(false);
    setNavScreenOpen(false);
    setOutlineOpen(false);
  }
});

window.addEventListener(
  "resize",
  () => {
    if (window.innerWidth >= 768) {
      setNavScreenOpen(false);
    }
    if (window.innerWidth >= 960) {
      setSidebarOpen(false);
    }
  },
  { passive: true },
);
