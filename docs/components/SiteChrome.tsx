import Link from "next/link";
import { Icon } from "./Icons";
import { REPO, SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-line border-b bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
        <Link
          className="font-mono font-semibold text-[17px] tracking-[0.04em] text-ink no-underline"
          href="/"
        >
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-5 font-mono text-[13px]">
          <Link className="text-muted transition-colors hover:text-ink" href="/docs/">
            Docs
          </Link>
          <Link className="text-muted transition-colors hover:text-ink" href="/docs/roadmap/">
            Roadmap
          </Link>
          <a
            className="flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
            href={REPO}
            rel="noreferrer"
            target="_blank"
          >
            <Icon name="github" size={16} />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-line border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-[14px] text-muted">
        <p>
          <b className="font-mono font-semibold text-ink">KIRA</b> — Knowledge Interface for
          Reliable Answers. MIT licensed.
        </p>
        <p>
          Design notes and the full format reference live in{" "}
          <a
            className="text-ink underline underline-offset-2"
            href={`${REPO}/blob/main/SPEC.md`}
            rel="noreferrer"
            target="_blank"
          >
            SPEC.md
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
