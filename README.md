# KIRA

**Knowledge Interface for Reliable Answers.**

> Your help center goes stale the day you ship. KIRA reads your code instead.

KIRA turns a codebase into a maintained knowledge base about **the product**, then answers
your users' questions from it — in their language, grounded in what the code actually does,
and never invented.

Every other in-product help assistant grounds on documentation: articles, tickets, marketing
pages. All of it drifts from the product on release day. Source code cannot drift from the
product — it *is* the product.

`KIRA` is the assistant's default name. Rename it per deployment; the tool is `kira`.

**Status: v0.1, in development.** `init`, `extract`, `status`, and `ask` work. The eval loop
and the embeddable widget are next — see [SPEC.md](./SPEC.md).

---

## Quickstart

```bash
npm install -g kira-knowledge
export ANTHROPIC_API_KEY=sk-ant-...

cd your-project
kira init --dry-run      # see the areas it would propose, write nothing
kira init                # write .kira/config.yaml
$EDITOR .kira/config.yaml
kira extract             # write .knowledge/
kira ask "how do I connect a domain I already own?"
```

`kira init` proposes an area per user-facing page and per behaviour module. **Review it before
extracting.** An area is a topic someone asks about, not a directory — merging what belongs
together and deleting what has nothing user-facing is the highest-value ten minutes you will
spend on this.

---

## How it works

```
   repo ──▶ [ extract ] ──▶ .knowledge/*.md ──▶ [ retrieve ] ──▶ [ answer ]
              per area          committed          BM25 + gates     grounded reply
```

**Knowledge lives in your repository, not in a database.** One fact per file, markdown with
YAML frontmatter. That means no infrastructure to start, review through a pull request before
a customer ever reads it, and `git diff` to see what you now tell users. The search index is
derived and rebuilt from the files; it is never the source of truth.

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
extracted: { at: 2026-08-18, model: claude-opus-5, area_hash: 4f1c9a…, git_sha: a3f9c21 }
confidence: high
---
Open **Project settings → Domains**, choose **Add existing domain**…
```

Two fields do the work no docs-based tool can:

- **`route`** — the assistant can hand the reader a working link instead of describing where
  to click, because the route came out of the router.
- **`requires`** — a fact gated behind a plan or role stays out of answers for readers who
  cannot reach it. Telling a Free user how to use a Business feature is worse than silence.

And one type carries the promise: **`boundary`** — things the product *cannot* do. Most wrong
answers in this category are not invented features; they are a confident "yes" to something
the product refuses.

### Retrieval

BM25 over title/summary/body, then: boost facts matching the screen the reader is on, drop
facts gated away from them, drop facts written for a different audience, quarantine anything
the extractor was unsure about, and reject near-duplicates so five slots hold five distinct
facts. No embeddings, no vector database, no second API key, deterministic output.

---

## Commands

| Command | Does |
|---|---|
| `kira init [dir] [--dry-run]` | Propose areas, write `.kira/config.yaml` |
| `kira extract [--area <id>] [--force]` | Extract into `.knowledge/`, skipping unchanged areas |
| `kira status` | Per-area facts, boundaries, routes, staleness |
| `kira ask "<q>" [--route <p>] [--plan <p>] [--role <r>] [--json]` | Answer from `.knowledge/` |

`ask` streams the answer to stdout and everything else to stderr, so `kira ask … 2>/dev/null`
gives you just the answer.

---

## Credentials

The Anthropic SDK resolves credentials itself, in order: `ANTHROPIC_API_KEY`, then
`ANTHROPIC_AUTH_TOKEN`, then a profile from `ant auth login`.

If a proxy sets `ANTHROPIC_BASE_URL`, note that the SDK appends `/v1/messages` to it. A base
URL that already ends in `/v1` produces 404s on every call — unset it or drop the suffix for
the run.

---

## What this deliberately is not

- **Not a coding assistant.** Claude Code, Cursor, and friends already answer developer
  questions about a repo, and an agent with grep beats naive retrieval at that job. KIRA's
  reader cannot open the code.
- **Not an agent that acts inside your product.** An assistant that clicks things on a
  customer's behalf is a different product with a different risk profile.

## Honest limits

- Extraction is a batch job, not an interactive one: high effort by default, minutes per run on
  a real area. Unchanged areas are skipped entirely, the instruction prefix is cached, and both
  `models` and `effort` are per-stage settings — answering defaults to medium effort because
  someone is waiting for it.
- Knowledge goes stale. Every fact records the source hash and commit it came from; `status`
  reports drift, and CI should re-extract changed areas on merge.
- **Someone has to review generated knowledge before a customer reads it.** That is why it
  lives in git. The first wrong answer a customer sees costs more trust than the tool earns
  in a month.

MIT. Design notes and roadmap in [SPEC.md](./SPEC.md).
