/** Shared browser helpers. The page sets the base path and labels before loading `site.js`. */
export const labels = window.__LUME_DOCS_LABELS__ ?? {};
const basePath = window.__LUME_DOCS_BASE_PATH__ ?? "/";

export function withBase(path) {
  if (basePath === "/" || !path.startsWith("/") || path.startsWith(basePath)) {
    return path;
  }
  return `${basePath.slice(0, -1)}${path}`;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Locks page scrolling while an overlay (nav screen, sidebar, search) is open. */
export function setScrollLocked(locked) {
  document.body.style.overflow = locked ? "hidden" : "";
}

/**
 * Runs `callback` at most every `delay` ms, with a trailing call, like VitePress's throttleAndDebounce.
 * @param {() => void} callback
 * @param {number} delay
 */
export function throttleAndDebounce(callback, delay) {
  let timeout;
  let called = false;
  return () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    if (!called) {
      callback();
      called = true;
      setTimeout(() => (called = false), delay);
    } else {
      timeout = setTimeout(callback, delay);
    }
  };
}

/** Cleanup for each element's in-flight transition, so a new one cancels it. */
const runningTransitions = new WeakMap();

/**
 * Shows or hides `element` with Vue `<Transition>` classes (`name-enter-from`,
 * `name-enter-active`, …) so VitePress's transition CSS applies unchanged.
 * Starting a transition finishes any one still running on the element.
 */
export function transition(element, name, show) {
  runningTransitions.get(element)?.();
  const phase = show ? "enter" : "leave";
  const from = `${name}-${phase}-from`;
  const active = `${name}-${phase}-active`;
  const to = `${name}-${phase}-to`;

  if (show) {
    element.hidden = false;
  }
  element.classList.add(from, active);
  const frame = requestAnimationFrame(() => {
    element.classList.remove(from);
    element.classList.add(to);
  });

  const finish = () => {
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
    element.removeEventListener("transitionend", onEnd);
    element.classList.remove(from, active, to);
    element.hidden = !show;
    runningTransitions.delete(element);
  };
  const onEnd = (event) => event.target === element && finish();
  const timeout = setTimeout(finish, 300);
  element.addEventListener("transitionend", onEnd);
  runningTransitions.set(element, finish);
}
