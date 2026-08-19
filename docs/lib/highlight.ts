import { createHighlighter, type Highlighter } from "shiki";

/**
 * One highlighter for the whole build. Loading is memoised because `marked`'s
 * renderer hooks are synchronous — the highlighter has to exist before parsing
 * starts, and building it per file would dominate build time.
 */
let loading: Promise<Highlighter> | null = null;

const LANGS = ["bash", "yaml", "json", "typescript", "tsx", "markdown", "text"];

function normalise(lang: string | undefined): string {
  if (!lang) return "text";
  const l = lang.toLowerCase();
  if (l === "sh" || l === "shell" || l === "console") return "bash";
  if (l === "yml") return "yaml";
  if (l === "ts") return "typescript";
  if (l === "md") return "markdown";
  return LANGS.includes(l) ? l : "text";
}

export async function syncHighlighter(): Promise<(code: string, lang?: string) => string> {
  loading ??= createHighlighter({
    // Two themes, switched by CSS variables, so code follows the page theme.
    themes: ["github-light", "github-dark"],
    langs: LANGS,
  });
  const highlighter = await loading;
  return (code: string, lang?: string) =>
    highlighter.codeToHtml(code.replace(/\n$/, ""), {
      lang: normalise(lang),
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    });
}
