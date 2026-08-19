import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icons";
import { DOC_PAGES } from "@/lib/docs";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/docs/",
  title: "Documentation",
  description:
    "Everything about running KIRA: the quick start, the area map, the knowledge format, configuration, the CLI, retrieval, the answering contract, and the roadmap.",
  type: "website",
});

export default function DocsIndex() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-3">
        <p className="font-mono font-semibold text-[11px] text-muted uppercase tracking-[0.14em]">
          Documentation
        </p>
        <h1 className="font-semibold text-[clamp(1.8rem,4vw,2.4rem)] tracking-[-0.03em]">
          Running KIRA
        </h1>
        <p className="max-w-[68ch] text-[18px] text-ink-2">
          Start with the quick start; it gets you from an unfamiliar repository to a grounded answer
          in about five minutes. The rest is reference, in the order you tend to need it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DOC_PAGES.map((doc, i) => (
          <Link
            className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5 no-underline transition-colors hover:border-brand"
            href={`/docs/${doc.slug}/`}
            key={doc.slug}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-brand-ink">
                <Icon name={doc.icon} size={20} />
              </span>
              <span className="font-mono text-[11px] text-muted tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="font-semibold text-[17px] text-ink">{doc.title}</h2>
            <p className="text-[14px] text-muted">{doc.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
