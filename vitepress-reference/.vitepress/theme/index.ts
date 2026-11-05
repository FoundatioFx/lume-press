import DefaultTheme from "vitepress/theme";
// LumePress's styles for its extras: home sections, Mermaid, and code group icons.
import "../../../src/assets/site.css";
import Layout from "./Layout.vue";

export default { extends: DefaultTheme, Layout };
