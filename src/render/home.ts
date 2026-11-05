import type {
  Action,
  DocsData,
  Feature,
  HeroImage,
  HomeSection,
} from "../types.ts";
import { escapeAttribute, escapeHtml } from "../html.ts";
import { attrs, classes, link } from "./markup.ts";
import { isExternal, normalizeHref } from "../urls.ts";

/** Mirrors VitePress's `VPHome`: hero, features, then the page's markdown. */
export function renderHome(data: DocsData, content: string): string {
  return `<div class="VPHome">${renderHero(data.hero)}${renderFeatures(
    data.features ?? [],
    "VPFeatures VPHomeFeatures",
  )}${renderHomeSections(data.homeSections ?? [])}${
    content.trim()
      ? `<div class="VPHomeContent vp-doc container"><div style="position:relative;"><div>${content}</div></div></div>`
      : ""
  }</div>`;
}

function renderHero(hero: DocsData["hero"]) {
  if (!hero) {
    return "";
  }

  const heading =
    hero.name || hero.text
      ? `<h1 class="heading">${
          hero.name
            ? `<span dir="auto" class="name clip">${hero.name}</span>`
            : ""
        }${hero.text ? `<span dir="auto" class="text">${hero.text}</span>` : ""}</h1>`
      : "";
  const tagline = hero.tagline
    ? `<p class="tagline"><bdi>${hero.tagline}</bdi></p>`
    : "";
  const actions = hero.actions?.length
    ? `<div class="actions">${hero.actions.map(renderAction).join("")}</div>`
    : "";
  const image = hero.image
    ? `<div class="image"><div class="image-container"><div class="image-bg"></div>${renderImage(
        hero.image,
        "image-src",
      )}</div></div>`
    : "";

  return `<div class="${classes("VPHero", hero.image && "has-image", "VPHomeHero")}"><div class="container"><div class="main">${heading}${tagline}${actions}</div>${image}</div></div>`;
}

/** Mirrors `VPImage`, including `{ light, dark }` image pairs. */
function renderImage(image: HeroImage, className?: string): string {
  if (typeof image === "string") {
    return `<img class="${classes("VPImage", className)}" src="${escapeAttribute(image)}" alt="">`;
  }

  if ("src" in image) {
    return `<img class="${classes("VPImage", className)}"${attrs({
      src: image.src,
      alt: image.alt ?? "",
      width: image.width,
      height: image.height,
    })}>`;
  }

  const { light, dark, ...rest } = image;
  return [
    renderImage({ ...rest, src: dark }, classes("dark", className)),
    renderImage({ ...rest, src: light }, classes("light", className)),
  ].join("");
}

/** Mirrors `VPButton` inside a hero action. */
function renderAction(action: Action) {
  const external = isExternal(action.link);
  return `<div class="action"><a class="${classes(
    "VPButton",
    "no-icon",
    "medium",
    action.theme === "alt" || action.theme === "sponsor"
      ? action.theme
      : "brand",
  )}"${attrs({
    href: normalizeHref(action.link),
    target: action.target ?? (external ? "_blank" : undefined),
    rel: action.rel ?? (external ? "noreferrer" : undefined),
  })}>${escapeHtml(action.text)}</a></div>`;
}

/** Mirrors `VPFeatures` + `VPFeature`. */
function renderFeatures(features: Feature[], className: string) {
  if (features.length === 0) {
    return "";
  }

  return `<div class="${className}"><div class="container"><ul class="items">${features
    .map(
      (feature) =>
        `<li class="${classes(featureGrid(features.length), "item")}">${renderFeature(feature)}</li>`,
    )
    .join("")}</ul></div></div>`;
}

function featureGrid(count: number) {
  if (count === 2) return "grid-2";
  if (count === 3) return "grid-3";
  if (count % 3 === 0) return "grid-6";
  return count > 3 ? "grid-4" : undefined;
}

function renderFeature(feature: Feature) {
  const icon = renderFeatureIcon(feature.icon);
  const details = Array.isArray(feature.details)
    ? `<ul class="details">${feature.details.map((item) => `<li><bdi>${item}</bdi></li>`).join("")}</ul>`
    : feature.details
      ? `<p class="details"><bdi>${feature.details}</bdi></p>`
      : "";
  const linkText = feature.linkText
    ? `<div class="link-text"><p class="link-text-value"><bdi>${escapeHtml(
        feature.linkText,
      )}</bdi> <span class="vpi-arrow-right link-text-icon"></span></p></div>`
    : "";

  return link(
    {
      href: feature.link,
      class: "VPFeature",
      noIcon: true,
      tag: "div",
      target: feature.target,
      rel: feature.rel,
    },
    `<article class="box">${icon}<h2 class="title"><bdi>${feature.title}</bdi></h2>${details}${linkText}</article>`,
  );
}

/** HTML goes in the icon box; images default to 48px and sit in the box only with `wrap`. */
function renderFeatureIcon(icon: Feature["icon"]) {
  if (!icon) {
    return "";
  }
  if (typeof icon === "string") {
    return `<div class="icon">${icon}</div>`;
  }

  const { wrap, ...image } = icon;
  const html = renderImage({
    ...image,
    width: image.width ?? 48,
    height: image.height ?? 48,
  });
  return wrap ? `<div class="icon">${html}</div>` : html;
}

/** Theme extension: extra home page sections from `homeSections` front matter. Text may contain HTML, like the hero. */
function renderHomeSections(sections: HomeSection[]) {
  return sections
    .map(
      (section) =>
        `<section class="VPHomeSection"><div class="container">${
          section.title ? `<h2>${section.title}</h2>` : ""
        }${section.text ? `<p class="text">${section.text}</p>` : ""}${
          section.links?.length
            ? `<div class="actions">${section.links.map(renderAction).join("")}</div>`
            : ""
        }${
          section.features?.length
            ? `<ul class="items">${section.features
                .map(
                  (feature) =>
                    `<li class="item">${renderFeature(feature)}</li>`,
                )
                .join("")}</ul>`
            : ""
        }</div></section>`,
    )
    .join("");
}
