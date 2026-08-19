import type { Metadata } from "next";
import Link from "next/link";
import { Demo } from "@/components/Demo";
import { Icon } from "@/components/Icons";
import { RUN_STATS } from "@/lib/demo-data";
import { DOC_PAGES } from "@/lib/docs";
import { pageMetadata, REPO, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  path: "/",
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  type: "website",
});

const WEDGE = [
  {
    chip: "route",
    title: "It knows where things are",
    body: "Routes come out of your router, so a fact carries the path it lives at. The assistant hands the reader a working link instead of describing where to click — and it knows the same question means different things on different screens.",
  },
  {
    chip: "requires",
    title: "It knows who can see them",
    body: "When the code gates something behind a plan or a role, the fact carries that gate. Telling a Free user how to use a Business feature is worse than silence, and no help-centre article has a field for this.",
  },
  {
    chip: "boundary",
    flag: true,
    title: "It knows what you can't do",
    body: "Code is full of guards, plan checks and unsupported branches. The costliest wrong answer here is not an invented feature — it is a confident yes to something the product refuses. So refusals are a first-class fact type.",
  },
  {
    chip: "git",
    title: "It leaves a paper trail",
    body: "Every fact records the files it came from, the commit, and the model that wrote it. Knowledge lives in your repo, so what you now tell users is a git diff — and nothing reaches a customer without review.",
  },
];

const PIPELINE = [
  {
    cmd: "kira init",
    title: "Propose the map",
    body: "Scans the repo and proposes an area per user-facing page and per behaviour module, deriving routes from the router. You edit it: an area is a topic, not a directory.",
  },
  {
    cmd: "kira extract",
    title: "Read the code",
    body: "Reads each area and writes what it means for the people who use the product. Incremental — an area whose sources have not changed is skipped entirely.",
  },
  {
    cmd: "kira ask",
    title: "Answer from facts",
    body: "Retrieves, filters by who is asking and where they are, and answers from those facts only — with an honest “I don't have that” when they don't cover it.",
  },
  {
    cmd: "kira eval",
    soon: true,
    title: "Prove it",
    body: "Generates questions per area, answers them through the real pipeline, judges the answers, and turns the weak ones into a documentation backlog.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="border-line border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 md:py-24">
          <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.08em]">
            <span className="rounded-full border border-brand bg-brand/10 px-2.5 py-1 text-brand-ink">
              v0.1 · in development
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-muted">MIT</span>
            <span className="rounded-full border border-line px-2.5 py-1 text-muted">
              Node ≥ 20
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 text-muted">
              3 dependencies
            </span>
          </div>

          <h1 className="max-w-4xl font-semibold text-[clamp(2rem,5vw,3.1rem)] leading-[1.12] tracking-[-0.035em]">
            Your help center goes stale the day you ship.{" "}
            <span className="text-brand-ink">KIRA reads your code instead.</span>
          </h1>

          <p className="max-w-[54ch] text-[19px] text-ink-2">{SITE_DESCRIPTION}</p>

          <div className="flex flex-wrap items-center gap-3">
            <code className="overflow-x-auto whitespace-nowrap rounded-md border border-line bg-surface px-3.5 py-2.5 font-mono text-[14px] text-ink">
              <span className="select-none text-muted">$ </span>npm install -g askkira
            </code>
            <Link
              className="rounded-md bg-brand px-4 py-2.5 font-mono text-[13px] text-on-brand no-underline transition-[filter] hover:brightness-110"
              href="/docs/quick-start/"
            >
              Quickstart
            </Link>
            <a
              className="rounded-md border border-line px-4 py-2.5 font-mono text-[13px] text-ink-2 no-underline transition-colors hover:border-brand hover:text-ink"
              href={REPO}
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </div>

          {/* One fact, made */}
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between gap-3 border-line border-b bg-canvas px-3 py-2 font-mono text-[12px] text-muted">
                <span className="uppercase tracking-[0.1em] text-[11px]">Input</span>
                <span>src/app/domains/page.tsx</span>
              </div>
              <pre className="overflow-x-auto p-3.5 font-mono text-[13px] text-muted leading-[1.6]">{`// the router, the guards, the copy,
// the disabled states, the errors —
// whatever the product actually is`}</pre>
            </div>

            <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-muted uppercase tracking-[0.1em] md:flex-col md:self-center">
              kira extract <span aria-hidden="true">→</span>
            </div>

            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between gap-3 border-line border-b bg-canvas px-3 py-2 font-mono text-[12px] text-muted">
                <span className="uppercase tracking-[0.1em] text-[11px]">Output</span>
                <span className="truncate">.knowledge/domains/no-transfer.md</span>
              </div>
              <div className="flex flex-col gap-2.5 p-3.5">
                <pre className="font-mono text-[13px] leading-[1.6] text-muted">{`type: boundary
route: /project/:id/domains
confidence: high`}</pre>
                <p className="text-[15px] text-ink">
                  Domain registration stays with your current registrar — there is no way to
                  transfer it here.
                </p>
              </div>
            </div>
          </div>
          <p className="text-[15px] text-muted">
            One fact per file, committed to your repository. Reviewed in a pull request before a
            customer ever reads it.
          </p>
        </div>
      </section>

      {/* Wedge */}
      <section className="border-line border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14">
          <div className="flex max-w-[68ch] flex-col gap-3">
            <p className="font-mono font-semibold text-[11px] text-muted uppercase tracking-[0.14em]">
              The wedge
            </p>
            <h2 className="font-semibold text-[clamp(1.4rem,2.6vw,1.75rem)]">
              Docs drift. Code can&apos;t.
            </h2>
            <p className="text-ink-2">
              Every in-product help assistant on the market is grounded in documentation — articles,
              tickets, marketing pages. All of it describes the product as it was the last time
              somebody wrote it down. Source code cannot describe a product it does not build.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {WEDGE.map((card) => (
              <div
                className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface p-5"
                key={card.chip}
              >
                <span
                  className={`w-fit rounded border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.07em] ${
                    card.flag
                      ? "border-boundary bg-boundary/10 text-boundary"
                      : "border-brand bg-brand/10 text-brand-ink"
                  }`}
                >
                  {card.chip}
                </span>
                <h3 className="font-semibold text-[17px]">{card.title}</h3>
                <p className="text-[15px] text-ink-2">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="border-line border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14">
          <div className="flex max-w-[68ch] flex-col gap-3">
            <p className="font-mono font-semibold text-[11px] text-muted uppercase tracking-[0.14em]">
              Recorded, not simulated
            </p>
            <h2 className="font-semibold text-[clamp(1.4rem,2.6vw,1.75rem)]">Ask it something</h2>
            <p className="text-ink-2">
              Real output from a real run: a two-fact knowledge base about custom domains, and the
              answers KIRA gave. The questions are in Russian against an English knowledge base,
              because that is where the interesting part is — retrieval matches words, so crossing
              languages is the thing that has to work.
            </p>
          </div>
          <Demo />
          <p className="max-w-[68ch] text-[15px] text-muted">
            The answer is written from the reader&apos;s own words, so it comes back in their
            language — while interface labels stay verbatim in English, because that is what they
            have to find on screen.
          </p>
        </div>
      </section>

      {/* Pipeline + stats */}
      <section className="border-line border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14">
          <div className="flex max-w-[68ch] flex-col gap-3">
            <p className="font-mono font-semibold text-[11px] text-muted uppercase tracking-[0.14em]">
              Pipeline
            </p>
            <h2 className="font-semibold text-[clamp(1.4rem,2.6vw,1.75rem)]">How it works</h2>
            <p className="text-ink-2">
              Four stages. Each is independently useful, and each has its own command.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {PIPELINE.map((stage) => (
              <div
                className={`flex flex-col gap-2 rounded-lg border p-4 ${
                  stage.soon ? "border-line border-dashed" : "border-line bg-surface"
                }`}
                key={stage.cmd}
              >
                <span className="font-mono text-[11px] text-brand-ink uppercase tracking-[0.1em]">
                  {stage.cmd}
                  {stage.soon ? " · v0.2" : ""}
                </span>
                <h3 className={`font-semibold text-[15px] ${stage.soon ? "text-muted" : ""}`}>
                  {stage.title}
                </h3>
                <p className={`text-[14px] ${stage.soon ? "text-muted" : "text-ink-2"}`}>
                  {stage.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <h3 className="font-semibold text-[17px]">Measured on a private production codebase</h3>
            <p className="max-w-[68ch] text-[15px] text-muted">
              Two areas, four source files, extraction at high effort. Numbers only — the knowledge
              itself belongs to the codebase&apos;s owner.
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              {RUN_STATS.map((stat) => (
                <div className="rounded-lg border border-line bg-surface p-4" key={stat.label}>
                  <b className="block font-mono font-semibold text-2xl tabular-nums tracking-[-0.03em]">
                    {stat.value}
                  </b>
                  <span className="font-mono text-[11px] text-muted uppercase tracking-[0.09em]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Docs */}
      <section>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14">
          <div className="flex max-w-[68ch] flex-col gap-3">
            <p className="font-mono font-semibold text-[11px] text-muted uppercase tracking-[0.14em]">
              Documentation
            </p>
            <h2 className="font-semibold text-[clamp(1.4rem,2.6vw,1.75rem)]">Read the details</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DOC_PAGES.map((doc) => (
              <Link
                className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 no-underline transition-colors hover:border-brand"
                href={`/docs/${doc.slug}/`}
                key={doc.slug}
              >
                <span className="text-brand-ink">
                  <Icon name={doc.icon} size={20} />
                </span>
                <h3 className="font-semibold text-[15px] text-ink">{doc.label}</h3>
                <p className="text-[14px] text-muted">{doc.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
