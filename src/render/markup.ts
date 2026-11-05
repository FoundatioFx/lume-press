import { escapeAttribute } from "../html.ts";
import { isExternal, normalizeHref } from "../urls.ts";

type AttributeValue = string | number | boolean | undefined | null;

/** Joins truthy class names, like Vue's `:class` array syntax. */
export function classes(
  ...names: Array<string | false | undefined | null>
): string {
  return names.filter(Boolean).join(" ");
}

/** Renders attributes, skipping `undefined`, `null`, and `false` values. */
export function attrs(values: Record<string, AttributeValue>): string {
  return Object.entries(values)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== false,
    )
    .map(([name, value]) =>
      value === true
        ? ` ${name}`
        : ` ${name}="${escapeAttribute(String(value))}"`,
    )
    .join("");
}

type LinkOptions = {
  href?: string;
  class?: string;
  target?: string;
  rel?: string;
  noIcon?: boolean;
  current?: boolean;
  /** Extra attributes for the link element. */
  attributes?: Record<string, AttributeValue>;
  /** Render a `div` instead of a `span` when there is no `href`. */
  tag?: "span" | "div";
};

/** Mirrors VitePress's `VPLink` component. */
export function link(options: LinkOptions, content: string): string {
  const { href } = options;
  if (!href) {
    const tag = options.tag ?? "span";
    return `<${tag}${attrs({
      class: classes("VPLink", options.noIcon && "no-icon", options.class),
      ...options.attributes,
    })}>${content}</${tag}>`;
  }

  const external = isExternal(href);
  return `<a${attrs({
    class: classes(
      "VPLink",
      "link",
      external && "vp-external-link-icon",
      options.noIcon && "no-icon",
      options.class,
    ),
    href: normalizeHref(href),
    target: options.target ?? (external ? "_blank" : undefined),
    rel: options.rel ?? (external ? "noreferrer" : undefined),
    "aria-current": options.current ? "page" : undefined,
    ...options.attributes,
  })}>${content}</a>`;
}
