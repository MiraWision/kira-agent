import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { DOC_PAGES, getDocPage } from "@/lib/docs";
import { renderMarkdownFile } from "@/lib/markdown";
import { pageMetadata, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return DOC_PAGES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocPage(slug);
  if (!doc) return {};
  return pageMetadata({
    path: `/docs/${doc.slug}/`,
    title: doc.title,
    description: doc.description,
  });
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getDocPage(slug);
  if (!doc) notFound();

  const html = await renderMarkdownFile(`content/docs/${doc.slug}.md`, { repoLinks: true });
  const index = DOC_PAGES.findIndex((d) => d.slug === doc.slug);
  const prev = DOC_PAGES[index - 1];
  const next = DOC_PAGES[index + 1];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: doc.title,
          description: doc.description,
          url: `${SITE_URL}/docs/${doc.slug}/`,
          author: { "@id": `${SITE_URL}/#org` },
          about: { "@id": `${SITE_URL}/#software` },
        }}
      />
      <nav className="mb-6 font-mono text-[13px] text-muted">
        <Link className="hover:text-ink" href="/docs/">
          Docs
        </Link>{" "}
        / {doc.label}
      </nav>
      <h1 className="mb-8 font-semibold text-[clamp(1.7rem,3.5vw,2.2rem)] tracking-[-0.03em]">
        {doc.title}
      </h1>
      <article
        className="prose prose-site max-w-none"
        // Build-time render of our own markdown content.
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <nav className="mt-14 flex justify-between gap-4 border-line border-t pt-6 font-mono text-[13px]">
        {prev ? (
          <Link className="text-muted hover:text-ink" href={`/docs/${prev.slug}/`}>
            ← {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="text-muted hover:text-ink" href={`/docs/${next.slug}/`}>
            {next.label} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
