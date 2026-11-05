<script setup lang="ts">
import { useData, useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { nextTick, onMounted, watch } from "vue";
import HomeSections from "./HomeSections.vue";

const { frontmatter, isDark } = useData();
const route = useRoute();
const sources = new WeakMap<Element, string>();

// Mermaid, as LumePress renders it (src/assets/client/code.js).
async function renderDiagrams() {
  const nodes = [...document.querySelectorAll(".mermaid")];
  if (!nodes.length) return;
  const { default: mermaid } = await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs"
  );
  mermaid.initialize({ startOnLoad: false, theme: isDark.value ? "dark" : "default" });
  for (const node of nodes) {
    if (!sources.has(node)) sources.set(node, node.textContent ?? "");
    node.removeAttribute("data-processed");
    node.textContent = sources.get(node)!;
  }
  await mermaid.run({ nodes });
}

onMounted(renderDiagrams);
watch(() => route.path, () => nextTick(renderDiagrams));
watch(isDark, renderDiagrams);
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-features-after>
      <HomeSections :sections="frontmatter.homeSections ?? []" />
    </template>
  </DefaultTheme.Layout>
</template>
