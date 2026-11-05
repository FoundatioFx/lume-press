<script setup lang="ts">
// LumePress's `homeSections` extra (src/render/home.ts), built from VitePress's own components.
import { VPButton } from "vitepress/theme";
import VPFeature from "vitepress/dist/client/theme-default/components/VPFeature.vue";

defineProps<{ sections: any[] }>();
</script>

<template>
  <section
    v-for="(section, index) in sections"
    :key="index"
    class="VPHomeSection"
  >
    <div class="container">
      <h2 v-if="section.title" v-html="section.title" />
      <p v-if="section.text" class="text" v-html="section.text" />
      <div v-if="section.links?.length" class="actions">
        <div v-for="action in section.links" :key="action.link" class="action">
          <VPButton
            tag="a"
            size="medium"
            :theme="action.theme ?? 'brand'"
            :text="action.text"
            :href="action.link"
            :target="action.target"
            :rel="action.rel"
          />
        </div>
      </div>
      <ul v-if="section.features?.length" class="items">
        <li
          v-for="feature in section.features"
          :key="feature.title"
          class="item"
        >
          <VPFeature v-bind="feature" />
        </li>
      </ul>
    </div>
  </section>
</template>
