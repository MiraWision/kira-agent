import type { IconName } from "@/components/Icons";

export interface DocPage {
  slug: string;
  title: string;
  /** Meta description, 70–160 characters. */
  description: string;
  /** Short label for the index and prev/next navigation. */
  label: string;
  icon: IconName;
}

export const DOC_PAGES: DocPage[] = [
  {
    slug: "quick-start",
    icon: "bolt",
    title: "Quick start",
    label: "Quick start",
    description:
      "Install KIRA, let it propose the areas of your product, extract facts from the code, and ask your first question — in about five minutes, with no database.",
  },
  {
    slug: "areas",
    icon: "map",
    title: "Areas: the map of your product",
    label: "Areas",
    description:
      "An area is a topic someone asks about, not a directory. How kira init proposes them from your router, and what to fix by hand before extracting anything.",
  },
  {
    slug: "knowledge-format",
    icon: "file",
    title: "The knowledge format",
    label: "Knowledge format",
    description:
      "One fact per file: frontmatter, body, and the fields that make it an in-product assistant — route, requires, sources, provenance, confidence, and eight fact types.",
  },
  {
    slug: "configuration",
    icon: "settings",
    title: "Configuration",
    label: "Configuration",
    description:
      "Every key in .kira/config.yaml: the assistant's persona and language, source globs, per-stage models and effort, batching limits, and the area map itself.",
  },
  {
    slug: "cli",
    icon: "terminal",
    title: "Command line",
    label: "CLI",
    description:
      "kira init, extract, status and ask — every flag, what each command writes, and how to wire extraction into CI so knowledge is reviewed in a pull request.",
  },
  {
    slug: "retrieval",
    icon: "search",
    title: "How a question finds a fact",
    label: "Retrieval",
    description:
      "BM25 with no vector store, a rewrite hop that lets a question cross languages, boosting by the reader's current screen, plan gating, and diversity selection.",
  },
  {
    slug: "answering",
    icon: "chat",
    title: "The answering contract",
    label: "Answering",
    description:
      "What KIRA promises when it replies: retrieved facts as the only source, an honest refusal over a plausible walkthrough, verbatim interface labels, and boundaries first.",
  },
  {
    slug: "roadmap",
    icon: "route",
    title: "Status, roadmap & limits",
    label: "Roadmap",
    description:
      "What v0.1 does today, what the eval loop in v0.2 changes about trusting it, the widget in v0.3 — and the three problems you should weigh before adopting it.",
  },
];

export function getDocPage(slug: string): DocPage | undefined {
  return DOC_PAGES.find((d) => d.slug === slug);
}
