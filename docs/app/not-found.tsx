import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-24">
      <p className="font-mono text-[11px] text-muted uppercase tracking-[0.14em]">404</p>
      <h1 className="font-semibold text-3xl">No page here</h1>
      <p className="text-ink-2">
        That address does not exist on this site. The documentation index is probably where you
        were heading.
      </p>
      <Link className="font-mono text-[14px] text-brand underline underline-offset-4" href="/docs/">
        Go to the docs →
      </Link>
    </div>
  );
}
