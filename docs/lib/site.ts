/**
 * Served from GitHub Project Pages, so every absolute URL and every static
 * asset carries the repository name. Keep `BASE_PATH` in sync with
 * `next.config.ts`; a custom domain later means emptying both and adding a
 * CNAME to `public/`.
 */
/**
 * Empty behind the custom domain. Kept as a constant rather than deleted so a
 * move back to Project Pages is one edit here plus one in `next.config.ts`.
 */
export const BASE_PATH = "";
export const SITE_ORIGIN = "https://askkira.dev";
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

export const SITE_NAME = "KIRA";
export const SITE_TITLE = "KIRA — answers about your product, read from your code";
export const SITE_DESCRIPTION =
  "KIRA turns a codebase into a maintained knowledge base about your product, then answers your users' questions from it — in their language, grounded in what the code does, and never invented.";

export const REPO = "https://github.com/MiraWision/askkira";
/** Prefix a `public/` asset with the base path; Next does not do this for us. */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}

/** Absolute canonical URL for a route path ("/", "/docs/quick-start/"). */
export function canonical(path: string): string {
  const p = path.endsWith("/") ? path : `${path}/`;
  return `${SITE_URL}${p}`;
}

/**
 * Per-page social metadata. The root layout's openGraph values are defaults and
 * Next replaces only the keys a page sets, so a page declaring just a title
 * would otherwise share as the home page's URL. Every page restates them.
 */
export function pageMetadata(options: {
  path: string;
  title: string;
  description: string;
  type?: "article" | "website";
}) {
  const url = canonical(options.path);
  // The layout's title template applies to <title> only — og:title is not
  // templated, so the suffix is added by hand here.
  const social = options.path === "/" ? options.title : `${options.title} — ${SITE_NAME}`;
  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: url },
    openGraph: {
      type: options.type ?? "article",
      url,
      title: social,
      description: options.description,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: social,
      description: options.description,
    },
  };
}
