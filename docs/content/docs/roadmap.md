KIRA is v0.1 and honest about it. The extraction and answering path works end to end on real
repositories; the parts that make it safe to put in front of a customer are still ahead.

## v0.1 — working now

`init`, `extract`, `status`, `ask`. Files only, BM25 only, no infrastructure.

Good enough to run in CI and use from a terminal, **inside your team**. Commit `.knowledge/`,
re-extract changed areas on merge, and let the people who answer customer questions ask it first.

## v0.2 — the eval loop

Generated questions per area, plus cross-area questions and deliberately **out-of-scope** ones,
because a system that cannot say "I don't know" scores well on coverage and fails in production.
Every answer is scored by an independent judge; weak ones become a gap backlog, alongside the real
questions that retrieved nothing at runtime.

Also: the Batch API for full rebuilds at half price, and optional embeddings as a hybrid layer for
large bases.

> [!IMPORTANT]
> This is the gate before anyone outside your team sees an answer. Until the eval loop exists there
> is no way to tell "answers well" from "answers confidently" — and the two failures that shipped in
> v0.1 both slipped past a full unit-test suite and a type-check. One of them was intermittent.

## v0.3 — the widget

An HTTP endpoint over the same answering path, a React component and a script tag, the reader's
screen and plan passed in as context, working deep links, and one adapter for handing a
conversation to a human.

The endpoint reuses `ask` exactly. If the CLI answers well, the widget answers well; there is one
code path to fix.

## v0.4 — production shape

Optional Postgres and pgvector backend, atomic knowledge versions so a deploy is a switch rather
than a race, multi-tenancy, and analytics over the gap backlog.

## Deliberately out of scope

- **Not a coding assistant.** Claude Code, Cursor and friends already answer a developer's
  questions about a repository, and an agent with grep beats naive retrieval at that job. KIRA's
  reader cannot open the code.
- **Not an agent that acts inside your product.** An assistant that clicks things on a customer's
  behalf is a different product with a different risk profile.

## Honest limits

**Extraction cost and latency scale with the repository.** Unchanged areas are skipped entirely,
the instruction prefix is cached, and both `models` and `effort` are per-stage settings. But a
first full run on a large codebase is a batch job measured in minutes and dollars, not seconds.

**Knowledge goes stale.** Every fact records the source hash and commit it came from, `kira status`
reports the drift, and CI should re-extract changed areas on merge — so drift is visible rather
than silent. Nothing stops you from ignoring it.

**Someone has to review what was generated.** That is why knowledge lives in git rather than a
database. The first wrong answer a customer sees costs more trust than the tool earns in a month,
and no amount of prompt engineering substitutes for a person reading the diff before it ships.

## When to put it in front of customers

Three gates, and they are about who reads the answer rather than whether the code is finished:

1. **Now (v0.1)** — internal tool. CI job, committed knowledge, your team asking from a terminal.
2. **After v0.2** — show it to people, once the coverage report gives you a number you can defend.
3. **After v0.3** — in the product behind a flag, for internal users and one friendly customer
   first, with the knowledge reviewed in a pull request rather than auto-published.
