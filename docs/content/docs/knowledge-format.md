One fact per file, at `.knowledge/<area>/<slug>.md`: YAML frontmatter, then the answer in markdown.

Plain files, so they diff, review and travel like any other source. This is the load-bearing
decision in KIRA — a database would have been less work and would have removed the pull request,
which is the only place a human sees generated text before a customer does.

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
Open **Project settings → Domains**, choose **Add existing domain**, and enter the domain name.
Copy the two DNS records shown and add them at your registrar…
```

## Fields

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Stable identity, `<area>/<slug>`. Survives rewording; used for dedup and gap linking. |
| `area` | yes | Which configured area produced it. |
| `type` | yes | One of the eight types below. |
| `audience` | yes | `end_user`, `operator` or `developer`. Retrieval filters on it. |
| `title` | yes | Human title. Indexed at triple weight. |
| `summary` | yes | One sentence. Indexed at double weight; shown in listings. |
| `route` | no | The reader-visible path, dynamic segments as `:name`. |
| `requires` | no | `plan` / `role` / `flag` lists that gate the fact. |
| `sources` | yes | Repo-relative paths this was derived from. The audit trail. |
| `extracted` | yes | Provenance: date, model, area hash, commit. Drives staleness. |
| `confidence` | yes | `high`, `medium` or `low`. `low` is quarantined from answers by default. |

### `route` and `requires` are the interesting ones

No documentation-grounded tool can fill these, because no article has them. A route means the
assistant can hand the reader a working link rather than describing where to click, and it means
the same question can be answered differently depending on the screen they are on. A gate means a
fact about a Business feature never reaches a Free user — telling them how to use something they
cannot reach is worse than saying nothing.

The extractor fills `requires` only when the code gates the thing explicitly. A guess there
silently hides a fact from people who should see it, so the instruction is to leave it empty
unless the gate is in the source.

## The eight types

| Type | What it holds |
|---|---|
| `feature` | A capability that exists. |
| `workflow` | An ordered way to accomplish something; steps in order in the body. |
| `concept` | A term or model the reader needs to use the product. |
| `ui_location` | Where something lives in the interface. |
| `faq` | A question users actually ask, with its answer. |
| `boundary` | Something the product does **not** or **cannot** do, and the alternative if one exists. |
| `policy` | A rule that affects the reader: limits, quotas, retention, billing behaviour. |
| `troubleshooting` | A symptom, its likely cause, and what to try next. |

> [!IMPORTANT]
> `boundary` is the type that earns the product its promise. Most wrong answers in this category
> are not hallucinated features — they are a confident *yes* to something the product refuses. The
> extraction prompt mines guards, plan checks, validation errors and unsupported branches as hard
> as it mines capabilities.

## What never appears in the text

For `end_user` and `operator` audiences, `title`, `summary` and `body` may not contain repository
names, file paths, function or class names, database tables, environment variables, internal API
routes, queue or cron identifiers, or developer tooling. Paths live in `sources` and nowhere else.

Interface strings go the other way: they are quoted **exactly** as the code renders them —
**Add existing domain**, **Save Changes**, **Total must equal 100% to save changes** — because that
is the string the reader has to find on screen. They are never translated, even when the answer
around them is in another language.

## Provenance and staleness

`extracted.area_hash` is a digest of every source file in the area — sorted paths plus contents, so
a rename changes it too. `kira status` compares it against the current files and reports `fresh`,
`stale`, or `not yet run`.

An area that legitimately produced zero facts is indistinguishable from one that was never
extracted, so the run is also recorded in `.kira/extracted.json`. Commit that file with the rest.
