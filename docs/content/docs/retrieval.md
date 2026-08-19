A knowledge base is hundreds of facts, not millions of documents, and every fact carries a
hand-quality title and summary. So retrieval is BM25 — no embeddings, no vector store, nothing to
run. It costs nothing, works offline, and returns the same result twice, which matters more than
marginal recall when the output is customer-facing.

## The pipeline

### 1. Rewrite

The question is rewritten into the language the facts are written in
(`knowledge.language`), and reduced to the words that would appear in the article answering it.

> [!IMPORTANT]
> This step is not an optimisation, it is a correctness fix. Lexical retrieval cannot cross
> languages: a Russian question against an English knowledge base scores exactly zero, retrieval
> never runs, and the assistant honestly reports ignorance about something it knows perfectly
> well. That failure is invisible in production — it looks like a polite gap in coverage rather
> than a bug.

Skip it with `--raw-query` when you know the question is already in the right language.

### 2. Score

BM25 over `title` (×3), `summary` (×2) and body, with a Unicode-aware tokenizer — an ASCII-only
pattern silently drops every Cyrillic, Greek or CJK word.

### 3. Boost by place

If the caller passed `--route`, facts whose own route matches are boosted:

| Relation | Example against `/project/42/domains` | Boost |
|---|---|---|
| `exact` | `/project/:id/domains` | ×1.4 |
| `ancestor` | `/project/:id` | ×1.2 |
| `descendant` | `/project/:id/domains/dns` | ×1.1 |

The boost is multiplicative on purpose: it reorders comparable matches instead of lifting an
irrelevant fact above a relevant one. A fact BM25 scored near zero stays near zero.

### 4. Gate

Facts whose `requires` conflict with the reader's plan, role or flags are dropped. A gate only
excludes when the caller actually supplied that context — unknown means unfiltered.

### 5. Filter by audience

An `operator` may read `end_user` facts; a reader never sees facts written above their level. A
`developer` fact never reaches an end user.

### 6. Quarantine low confidence

Anything the extractor flagged `low` stays out unless `--include-low` is passed.

### 7. Diversity

Candidates are walked best-first and one is kept unless it largely repeats a fact already
selected — word-set overlap above 0.6. Five slots hold five distinct facts rather than one fact
restated five times, which matters because extraction batches can produce overlapping facts about
the same thing.

## Why not embeddings

Three reasons, in order of weight:

1. **First-run experience.** Anthropic ships no embeddings endpoint, so vectors mean a second
   provider and a second key before anyone sees a single answer.
2. **Determinism.** The same question returns the same facts. When the output is shown to a
   customer, being able to reproduce a bad answer is worth more than a slightly better one.
3. **Scale.** BM25 is strong at hundreds-of-documents scale with good titles. It starts to hurt
   much later than people expect.

Optional embeddings arrive in v0.2 as a hybrid layer for large bases — exactly where BM25 starts
to hurt, and not before.
