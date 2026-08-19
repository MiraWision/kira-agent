import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import { syncHighlighter } from "./highlight";

/**
 * Markdown → HTML at build time: Shiki-highlighted fences plus callouts for the
 * lines a reader must not skim past.
 *
 * Callouts use GitHub's alert syntax — a blockquote whose first line is
 * `[!WARNING]` — so a docs file still reads correctly in the repository, not
 * only on the site.
 */
const CALLOUTS = {
  note: { label: "Note", tint: "tint-brand" },
  tip: { label: "Tip", tint: "tint-brand" },
  important: { label: "Important", tint: "tint-brand" },
  warning: { label: "Warning", tint: "tint-flag" },
  caution: { label: "Caution", tint: "tint-flag" },
} as const;

type CalloutType = keyof typeof CALLOUTS;

const MARKER = /^<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/i;

function blockquote(inner: string): string {
  const match = MARKER.exec(inner);
  if (!match) {
    return `<div class="callout callout-quote"><div class="callout-body">${inner}</div></div>`;
  }
  const type = match[1]!.toLowerCase() as CalloutType;
  const { label, tint } = CALLOUTS[type];
  const body = inner.replace(MARKER, "<p>");
  return [
    `<div class="callout ${tint}">`,
    `<div class="callout-label">${label}</div>`,
    `<div class="callout-body">${body}</div>`,
    "</div>",
  ].join("");
}

const REPO_BLOB = "https://github.com/MiraWision/askkira/blob/main/";

interface RenderOptions {
  /** Rewrite repo-relative links (`SPEC.md`) to the file on GitHub. */
  repoLinks?: boolean;
}

async function parser(opts: RenderOptions = {}): Promise<Marked> {
  const highlight = await syncHighlighter();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      // Shiki emits the whole `<pre><code>` wrapper, so the default renderer is
      // replaced rather than wrapped.
      code({ text, lang }) {
        return highlight(text, lang);
      },
      blockquote({ tokens }) {
        return blockquote(this.parser.parse(tokens) as string);
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        // A repo file (`SPEC.md`) should point at GitHub; a cross-link between doc
        // pages (`../retrieval/`) must stay on the site. Routes are folder-style
        // with a trailing slash and repo files never are, so that is the test.
        const isRepoFile =
          !/^([a-z]+:|\/|#)/i.test(href) && !href.endsWith("/");
        const target = opts.repoLinks && isRepoFile ? `${REPO_BLOB}${href}` : href;
        const titleAttr = title ? ` title="${title}"` : "";
        return `<a href="${target}"${titleAttr}>${inner}</a>`;
      },
    },
  });
  return marked;
}

/** Render a markdown file (path relative to the docs app root) to HTML. */
export async function renderMarkdownFile(
  relPath: string,
  opts: RenderOptions = {},
): Promise<string> {
  const raw = fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
  return (await parser(opts)).parse(raw) as string;
}
