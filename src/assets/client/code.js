/** Code block copy buttons, code group tabs, and Mermaid diagrams (ported from VitePress where it has them). */
const shellLanguages = ["shellscript", "shell", "bash", "sh", "zsh"];
const copyTimeouts = new WeakMap();

window.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (target.matches('div[class*="language-"] > button.copy')) {
    void copyCode(target);
  } else if (target.matches(".vp-code-group input")) {
    activateCodeGroupTab(target);
  }
});

async function copyCode(button) {
  const wrapper = button.parentElement;
  const pre = wrapper?.querySelector("pre");
  if (!wrapper || !pre) {
    return;
  }

  const clone = pre.cloneNode(true);
  clone
    .querySelectorAll(".vp-copy-ignore, .diff.remove")
    .forEach((node) => node.remove());
  clone.innerHTML = clone.innerHTML.replace(/\n+/g, "\n");
  let text = clone.textContent ?? "";
  const language = /language-(\w+)/.exec(wrapper.className)?.[1] ?? "";
  if (shellLanguages.includes(language)) {
    text = text.replace(/^ *(\$|>) /gm, "").trim();
  }

  await copyToClipboard(text);
  button.classList.add("copied");
  clearTimeout(copyTimeouts.get(button));
  copyTimeouts.set(
    button,
    setTimeout(() => {
      button.classList.remove("copied");
      button.blur();
      copyTimeouts.delete(button);
    }, 2000),
  );
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const element = document.createElement("textarea");
    const focused = document.activeElement;
    element.value = text;
    element.setAttribute("readonly", "");
    element.style.cssText =
      "contain:strict;position:absolute;inset-inline-start:-9999px;font-size:12pt";
    const selection = document.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    document.body.append(element);
    element.select();
    document.execCommand("copy");
    element.remove();
    if (range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    focused?.focus();
  }
}

function activateCodeGroupTab(input) {
  const group = input.parentElement?.parentElement;
  const blocks = group?.querySelector(".blocks");
  if (!group || !blocks) {
    return;
  }

  const index = [...group.querySelectorAll("input")].indexOf(input);
  const current = [...blocks.children].find((child) =>
    child.classList.contains("active"),
  );
  const next = blocks.children[index];
  if (!current || !next || current === next) {
    return;
  }

  current.classList.remove("active");
  next.classList.add("active");
  group
    .querySelector(`label[for="${input.id}"]`)
    ?.scrollIntoView({ block: "nearest" });
}

// Mermaid loads only on pages with diagrams, and re-renders when the appearance changes.
const mermaidUrl =
  "https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs";
const diagrams = [...document.querySelectorAll(".mermaid")].map((node) => ({
  node,
  source: node.textContent ?? "",
}));

async function renderDiagrams() {
  const { default: mermaid } = await import(mermaidUrl);
  mermaid.initialize({
    startOnLoad: false,
    theme: document.documentElement.classList.contains("dark")
      ? "dark"
      : "default",
  });
  for (const { node, source } of diagrams) {
    node.removeAttribute("data-processed");
    node.textContent = source;
  }
  await mermaid.run({ nodes: diagrams.map(({ node }) => node) });
}

if (diagrams.length > 0) {
  const root = document.documentElement;
  let dark = root.classList.contains("dark");
  const render = () =>
    renderDiagrams().catch((error) =>
      console.error("Failed to render Mermaid diagrams.", error),
    );
  void render();
  new MutationObserver(() => {
    if (dark !== root.classList.contains("dark")) {
      dark = !dark;
      void render();
    }
  }).observe(root, { attributeFilter: ["class"] });
}
