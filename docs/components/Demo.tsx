"use client";

import { useState } from "react";
import { DEMO_SESSIONS } from "@/lib/demo-data";

/**
 * Answers carry `**bold**` for the interface labels KIRA quotes verbatim. The
 * text is escaped first and only that one pattern is turned into markup, so the
 * recorded strings can never inject anything.
 */
function emphasise(text: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink">$1</strong>');
}

function Rich({ text }: { text: string }) {
  return <span dangerouslySetInnerHTML={{ __html: emphasise(text) }} />;
}

export function Demo() {
  const [index, setIndex] = useState(0);
  const session = DEMO_SESSIONS[index]!;
  const top = session.hits[0]?.score ?? 1;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-line border-b bg-canvas px-4 py-2.5">
        <span className="font-mono text-[13px] text-ink-2">
          KIRA · knowledge base: <code className="text-brand-ink">domains</code> · 2 facts
        </span>
        <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-muted uppercase tracking-[0.07em]">
          recorded session
        </span>
      </div>

      <div className="grid md:grid-cols-[1.15fr_0.85fr]">
        <div className="flex min-w-0 flex-col gap-3 p-4">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Example questions">
            {DEMO_SESSIONS.map((s, i) => (
              <button
                aria-pressed={i === index}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-left font-mono text-[12px] transition-colors ${
                  i === index
                    ? "border-brand bg-brand/10 text-brand-ink"
                    : "border-line text-ink-2 hover:border-brand hover:text-ink"
                }`}
                key={s.label}
                onClick={() => setIndex(i)}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div aria-live="polite" className="flex flex-col gap-3">
            <div className="max-w-[90%] self-end rounded-[10px_10px_2px_10px] border border-brand bg-brand/10 px-3 py-2 text-[15px] text-ink">
              {session.question}
            </div>
            <div className="flex max-w-[96%] flex-col gap-2.5 self-start rounded-[10px_10px_10px_2px] border border-line bg-canvas px-3.5 py-3 text-[15px] text-ink-2">
              {session.answer.map((block, i) =>
                "p" in block ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static recorded content
                  <p key={i}>
                    <Rich text={block.p} />
                  </p>
                ) : (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static recorded content
                  <ol className="flex list-decimal flex-col gap-1 pl-5" key={i}>
                    {block.ol.map((item) => (
                      <li key={item}>
                        <Rich text={item} />
                      </li>
                    ))}
                  </ol>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 border-line border-t bg-canvas p-4 md:border-t-0 md:border-l">
          <div className="mb-2 font-mono text-[11px] text-muted uppercase tracking-[0.1em]">
            Retrieved facts
          </div>
          <div className="mb-5 flex flex-col gap-2">
            {session.hits.map((hit, i) => (
              <div className="font-mono text-[12px]" key={hit.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className={i === 0 ? "text-ink-2 break-all" : "text-muted break-all"}>
                    {hit.id}
                  </span>
                  <span className={`tabular-nums ${i === 0 ? "text-brand-ink" : "text-muted"}`}>
                    {hit.score.toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 h-[3px] overflow-hidden rounded-sm bg-line">
                  <i
                    className={`block h-full ${i === 0 ? "bg-brand" : "bg-muted/50"}`}
                    style={{ width: `${Math.max(4, Math.round((hit.score / top) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mb-2 font-mono text-[11px] text-muted uppercase tracking-[0.1em]">
            Retrieval detail
          </div>
          <dl className="flex flex-col gap-1.5 font-mono text-[12px] text-muted">
            <div className="flex gap-2">
              <dt className="text-ink-2">asked in</dt>
              <dd>{session.askedIn}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-2">searched for</dt>
              <dd className="break-all">{session.search}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-ink-2">rewritten</dt>
              <dd>{session.rewritten ? "yes" : "no — already matched"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
