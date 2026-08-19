KIRA reads your source code and writes down what it means for the people who use your product.
Those notes become a knowledge base, and the knowledge base answers questions.

Five minutes end to end. No database, no vector store, no second API key.

## Install

```bash
npm install -g askkira
export ANTHROPIC_API_KEY=sk-ant-…
```

The SDK also accepts `ANTHROPIC_AUTH_TOKEN`, or a profile from `ant auth login` — you do not have
to use a raw key.

> [!NOTE]
> If a proxy sets `ANTHROPIC_BASE_URL`, remember the SDK appends `/v1/messages` to it. A base URL
> that already ends in `/v1` returns 404 on every call.

## 1. See what it proposes

```bash
cd your-project
kira init --dry-run
```

Writes nothing. Prints one row per proposed area with the route it derived from your router, so
you can judge the map before anything is generated:

```text
routes found under: src/app

domains          end_user   /project/:id/domains   src/app/project/[id]/domains
billing          end_user   /billing               src/app/billing
login            end_user   /login                 src/app/login
```

## 2. Write the config, then edit it

```bash
kira init
$EDITOR .kira/config.yaml
```

> [!IMPORTANT]
> This is the ten minutes that matter. The area map is the highest-value human input in the whole
> system. Merge what belongs together, delete what has nothing user-facing, and give each area a
> name your users would recognise. See [Areas](../areas/).

## 3. Extract

```bash
kira extract
```

```text
› domains — 6 files, 2 batch(es), end_user
›   batch 1/2 → 12 fact(s)
›   batch 2/2 → 9 fact(s)
✓ domains — 21 fact(s) written
```

Facts land in `.knowledge/` as one markdown file each. Commit them — the pull request is where a
human approves what a customer will eventually read.

Extraction is a batch job, not an interactive one: expect minutes per area, and re-runs skip every
area whose sources have not changed.

## 4. Ask

```bash
kira ask "how do I connect a domain I already own?"
```

The answer streams to stdout and everything else to stderr, so this gives you just the answer:

```bash
kira ask "…" 2>/dev/null
```

Pass the reader's context when you have it — the screen they are on, and what they are entitled to:

```bash
kira ask "how do I remove this?" --route /project/42/domains --plan free
```

## 5. Keep it honest

```bash
kira status
```

```text
Area       Files  Facts  Bound.  Route  State
─────────  ─────  ─────  ──────  ─────  ───────────
domains        6     21       3     21  fresh
billing        4     12       2     12  stale
─────────  ─────  ─────  ──────  ─────  ───────────
TOTAL         10     33       5     33
```

`stale` means the sources changed since the facts were written. Wire `kira extract` into CI on
merge and the drift stays visible instead of silent.

## Where to go next

- [Areas](../areas/) — how to turn the proposed map into a good one.
- [The knowledge format](../knowledge-format/) — what a fact is made of.
- [Command line](../cli/) — every flag.
