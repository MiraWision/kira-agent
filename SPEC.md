# KIRA — Specification

**KIRA — Knowledge Interface for Reliable Answers.**

> Your help center goes stale the day you ship. KIRA reads your code instead.

KIRA turns a codebase into a maintained, reviewable knowledge base about **the product**,
then answers end-user questions from it — grounded, never invented, and measurably so.

`KIRA` is the default persona name the tool ships with. Every deployment can rename it
(`assistant.name` in config); the tool itself is `kira`.

---

## 1. Who this is for

The audience of the *answers* is **people who use the product and will never open the code**:
customers inside the app, support agents, CS, sales, new hires.

That audience is the whole reason the design looks the way it does:

- Knowledge is written in product language. Paths, function names, route strings, and job
  identifiers never appear in an answer — only in metadata.
- An invented button is worse than "I don't know." Anti-fabrication is a first-class
  feature, not a prompt afterthought (§4, §6).
- Answers carry a **route** and a **plan/role gate**, so the assistant can say *where* to go
  and stays silent about features this user cannot reach (§3).

### Why code, not docs

Every competitor in in-product help grounds on documentation: help-center articles,
tickets, marketing pages. All of it drifts from the product on the day of a release.
Source code cannot drift from the product — it *is* the product. That is the wedge, and
everything else here exists to make it trustworthy enough to put in front of a customer.

---

## 2. Architecture

Four stages. Each is independently useful; each has its own CLI verb.

```
   repo ──▶ [ extract ] ──▶ .knowledge/*.md ──▶ [ retrieve ] ──▶ [ answer ]
              LLM, per area     committed to git      BM25 + gates    grounded reply
                    │                  │
                    │                  └──▶ [ eval ] ──▶ coverage report + gaps
                    │                                          │
                    └──────────────── gaps reopen extraction ◀─┘
```

**The knowledge base is files in the repository, not rows in a database.** This is the
load-bearing decision:

- Zero infrastructure to get value. No Postgres, no pgvector, no second API key.
- Generated in CI, reviewed in a pull request. A human approves what a customer will read.
- Diffable. "What changed in what we tell users this release" is a `git diff`.
- The retrieval index is a derived artifact, rebuilt from the files. It is never the truth.

A database becomes worthwhile later (multi-tenant serving, large bases, gap analytics) and
is introduced as an *optional backend* in v0.4 — never as a prerequisite.

---

## 3. The knowledge format

One fact per file: `.knowledge/<area>/<slug>.md`, YAML frontmatter plus a markdown body.

```markdown
---
id: domains/connect-existing
area: domains
type: workflow
audience: end_user
title: Connect a domain you already own
summary: Point an existing domain at your project from project settings.
route: /project/:id/domains
requires:
  plan: [pro, business]
  role: [owner, admin]
sources:
  - src/app/project/[id]/domains/page.tsx
  - src/lib/cloudflare/attach.ts
extracted:
  at: 2026-08-18
  model: claude-opus-5
  area_hash: 4f1c9a…
  git_sha: a3f9c21
confidence: high
---
You can point a domain you already own at your project. Open **Project settings →
Domains**, choose **Add existing domain**, and enter the domain…
```

### Field reference

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Stable identity, `<area>/<slug>`. Survives rewording; used for dedup and gap linking. |
| `area` | yes | Which configured area produced it. |
| `type` | yes | One of the eight types below. |
| `audience` | yes | `end_user` \| `operator` \| `developer`. Retrieval filters on it. |
| `title` | yes | Human title. Indexed with high weight. |
| `summary` | yes | One sentence. Indexed; shown in `status` and reports. |
| `route` | no | User-visible path, `:param` style. Powers deep links and screen-context boosting. |
| `requires` | no | `plan` / `role` / `flag` lists. Gates the fact to users who can actually reach it. |
| `sources` | yes | Repo-relative paths this was derived from. The audit trail. |
| `extracted` | yes | Provenance: date, model, `area_hash`, git sha. Drives staleness detection. |
| `confidence` | yes | `high` \| `medium` \| `low`. Extractor's own certainty; low is quarantined from answers by default. |

### Types

| Type | What it holds |
|---|---|
| `feature` | A capability that exists. |
| `workflow` | An ordered way to accomplish something. |
| `concept` | A term or model the user needs to understand. |
| `ui_location` | Where something lives in the interface. |
| `faq` | A question users actually ask, with its answer. |
| `boundary` | **Something that is NOT possible**, and the alternative if any. |
| `policy` | A rule that affects the user (limits, retention, billing behavior). |
| `troubleshooting` | A symptom, its likely cause, and what to try. |

`boundary` is the type that earns the product its promise. Most wrong answers in this
category are not hallucinated features — they are a confident "yes" to something the
product cannot do. Extraction is instructed to mine restrictions as hard as capabilities.

`route` and `requires` are the two fields no docs-based competitor can populate, because
neither exists in an article. They are what turns a knowledge base into an *embedded*
assistant.

---

## 4. Configuration — `.kira/config.yaml`

```yaml
version: 1

assistant:
  name: KIRA              # rename per deployment
  audience: end_user      # default audience for extraction and answers
  language: mirror        # mirror the asker's language; UI labels stay verbatim

source:
  root: .
  include: ["**/*.ts", "**/*.tsx", "**/*.md"]
  exclude: ["**/node_modules/**", "**/dist/**", "**/*.test.*", "**/*.spec.*"]

models:
  extract: claude-opus-5  # bulk stage — the cost knob lives here
  answer: claude-opus-5
  judge: claude-opus-5

effort:                   # how hard the model works per stage
  extract: high           # a durable artifact, nobody waiting — quality wins
  answer: medium          # a person is watching a cursor blink — latency wins
  judge: high

limits:
  batch_bytes: 100000     # source bytes per extraction call
  max_chunks_per_batch: 12

areas:
  - id: domains
    name: Custom Domains
    audience: end_user
    route: /project/:id/domains
    paths:
      - src/app/project/[id]/domains
  - id: billing
    name: Billing & Plans
    audience: operator
    paths:
      - src/lib/lago
```

`kira init` writes this file with `areas` **proposed automatically** and marked for review.
The area map is the highest-value human input in the system; the tool's job is to make the
first draft good enough to edit rather than author.

---

## 5. CLI

| Command | Does |
|---|---|
| `kira init` | Scan the repo, propose areas and routes, write `.kira/config.yaml`. |
| `kira extract [--area <id>] [--force]` | Extract knowledge for changed areas into `.knowledge/`. Incremental by `area_hash`. |
| `kira status` | Per-area chunk counts, staleness (source changed since extraction), confidence spread. |
| `kira ask "<q>" [--route <path>] [--plan <p>] [--role <r>]` | Answer from `.knowledge/`, with the same retrieval the runtime uses. |
| `kira eval` *(v0.2)* | Generate questions per area, answer them, judge, write a coverage report and gaps. |
| `kira serve` *(v0.3)* | HTTP endpoint + embeddable widget. |

`ask` deliberately shares its retrieval and prompt with `serve`. If the CLI answers well,
the widget answers well; there is one code path to fix.

---

## 6. Retrieval and answering

### v0.1 retrieval — no embeddings, no vector store

A knowledge base is hundreds of facts, not millions of documents, and every fact carries a
hand-quality title and summary. BM25 over `title` (×3), `summary` (×2), and body is
strong at this size, and it costs nothing, runs offline, and is deterministic — which
matters more than marginal recall when the output is customer-facing.

The pipeline:

1. **BM25** over the knowledge base → candidates.
2. **Route boost.** If the caller passes the screen the user is on, facts whose `route`
   matches (exactly, then by prefix) are boosted. "How do I delete this?" means different
   things on different screens; this is the cheapest quality win in the whole system.
3. **Gate filter.** Facts whose `requires` conflict with the caller's plan/role/flags are
   dropped. Telling a Free user how to use a Business feature is worse than silence.
4. **Audience filter.** `developer` facts never reach an `end_user` answer.
5. **Confidence filter.** `low` is excluded unless explicitly allowed.
6. **Diversity.** Greedy selection rejecting near-duplicates (Jaccard over word sets), so
   five slots hold five distinct facts rather than one fact phrased five ways.

Anthropic ships no embeddings endpoint, so adding vectors means a second provider or a
local model — a real cost to first-run experience. It is deferred to v0.2 as an *optional*
hybrid layer for large bases, exactly where BM25 starts to hurt.

### Answering

The retrieved facts are the **only** permitted source of product claims. The system prompt
forbids inventing UI, requires an honest "I don't have that" over a plausible walkthrough,
mirrors the asker's language while keeping interface labels verbatim, and suppresses
follow-up offers the retrieved facts could not answer. A fact with a `route` lets the
answer end in a real link instead of a description of where to click.

---

## 7. Measuring it — the eval loop (v0.2)

This is the feature that makes the product defensible, and it is the headline, not the chat.

```
  areas ──▶ generate questions ──▶ answer via real retrieval ──▶ judge 1–5
              (per area,                                            │
               cross-area,                              weak ───────┘
               out-of-scope)                              │
                                                          ▼
                                                    gaps.jsonl ──▶ targeted re-extraction
```

- **Out-of-scope questions are generated on purpose.** A system that cannot say "I don't
  know" scores well on coverage and fails in production. Refusing correctly is a pass.
- **Gaps** come from two places: weak judge scores, and real questions that retrieved
  nothing at runtime. Both are the documentation backlog, and both are product
  intelligence — what users cannot find is a UX finding, not just a content finding.
- **The report is the demo.** A per-area table (tested / mean score / weak / good) and a
  before-and-after number is what communicates the product in one screenshot.

---

## 8. Roadmap

| Stage | Scope | Done when |
|---|---|---|
| **v0.1** | `init`, `extract`, `status`, `ask`. Files only, BM25 only. | `npx kira init && kira extract && kira ask "…"` gives a grounded answer on a real repo in under five minutes. |
| **v0.2** | `eval`: question generation, judge, coverage report, gaps. Optional embeddings. Batch API for bulk extraction. | Coverage report renders; a fix→re-extract round measurably moves the score. |
| **v0.3** | `serve`: HTTP endpoint, React widget + script tag, screen context, deep links, escalation adapter. | The widget answers inside a host app with route context. |
| **v0.4** | Optional Postgres/pgvector backend, atomic knowledge versions, multi-tenancy, gap analytics. | A tenant can be served from a versioned snapshot without a deploy. |

Deliberately **not** in scope: an agent that performs actions inside the host product.
That is a different product with a different risk profile.

---

## 9. Cost, freshness, and review — the three honest problems

1. **Extraction cost and latency scale with the repo.** Mitigations: incremental by area hash
   (unchanged areas are skipped entirely), prompt caching on the stable instruction prefix,
   the Batch API for full rebuilds (half price), and per-stage `models` and `effort` settings.
   Extraction is a CI job that produces a durable artifact, so it defaults to high effort and
   takes minutes, not seconds; answering defaults to medium because someone is waiting. Both
   are worth sweeping against a real repo rather than trusting the defaults.
2. **Knowledge goes stale.** Every fact records the `area_hash` and git sha it came from.
   `status` reports staleness, and CI re-extracts changed areas on merge, so drift is
   visible instead of silent.
3. **Someone must review generated knowledge before a customer reads it.** The answer is
   the pull request — which is the reason knowledge lives in git. It has to be explicit in
   onboarding: the first wrong answer a customer sees costs more trust than the tool earns
   in a month.

---

## 10. Provenance

Two earlier systems inform this design, and their ideas are reimplemented here rather than
copied:

- A prior in-product help assistant proved the shape: LLM extraction of *product* facts
  from code by area, `boundary` facts, incremental hashing, a strict anti-fabrication
  prompt, and the gap → simulate → judge loop.
- A code knowledge-graph tool covers the structural half — which files belong together.
  Its community detection is the natural source of proposed areas, and `init` should adopt
  it as an optional input once the heuristic version is in place.
