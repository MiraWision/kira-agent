Four commands. `ask` streams its answer to stdout and everything else to stderr, so
`kira ask … 2>/dev/null` gives you exactly the answer and nothing else.

## `kira init [dir] [--dry-run] [--force]`

Scans a repository and writes `.kira/config.yaml` with an area map proposed from its structure.
`dir` defaults to the current directory.

| Flag | Effect |
|---|---|
| `--dry-run` | Print the proposal and write nothing. |
| `--force` | Replace an existing config. |

## `kira extract [--area <id>] [--force]`

Reads each area and writes facts into `.knowledge/`.

| Flag | Effect |
|---|---|
| `--area <id>` | Only this area. Repeatable. |
| `--force` | Re-extract even when the sources have not changed. |

Areas are incremental by content hash: an unchanged area is skipped without a single API call. An
area's directory is cleared before it is rewritten, so a fact whose source disappeared does not
linger.

> [!WARNING]
> Extraction is where the money goes. It scales with the size of the areas you configured, runs at
> `high` effort by default, and takes minutes rather than seconds. Start with one area and
> `--area` while you tune the map.

## `kira status`

Facts, boundaries, routes and staleness per area — no API calls, so it is free and instant.

```text
Area       Files  Facts  Bound.  Route  State
─────────  ─────  ─────  ──────  ─────  ───────────
domains        6     21       3     21  fresh
billing        4     12       2     12  stale
login          1      0       0      0  not yet run
─────────  ─────  ─────  ──────  ─────  ───────────
TOTAL         11     33       5     33
```

`stale` means the area's sources changed since its facts were written. It also reports facts
belonging to areas no longer in the config, and any file under `.knowledge/` that could not be
parsed — one broken file is listed rather than failing the whole base.

## `kira ask "<question>" [options]`

| Option | Effect |
|---|---|
| `--route <path>` | The screen the reader is on. Boosts facts that live there. |
| `--plan <name>` | The reader's plan. Facts gated away from them are dropped. |
| `--role <name>` | The reader's role. Same. |
| `--flag <name>` | An enabled feature flag. Repeatable. |
| `--audience <a>` | Read as `end_user`, `operator` or `developer`. |
| `--limit <n>` | Facts to retrieve. Default 5. |
| `--include-low` | Include facts the extractor was unsure about. |
| `--raw-query` | Score the question as typed, skipping the rewrite hop. |
| `--json` | Emit the answer and retrieval detail as JSON. |
| `--no-sources` | Do not print which facts were used. |

Without `--plan` / `--role` / `--flag` no gating happens at all: an unknown reader is never
gated, because a CLI or an unauthenticated widget must not answer less than it knows.

### JSON output

```bash
kira ask "how do I connect a domain?" --json
```

```json
{
  "question": "how do I connect a domain?",
  "search_query": "connect existing custom domain",
  "rewritten": false,
  "answer": "Open **Project settings → Domains**…",
  "no_match": false,
  "facts": [
    {
      "id": "domains/connect-existing",
      "title": "Connect a domain you already own",
      "type": "workflow",
      "score": 3.4944,
      "route": "/project/:id/domains",
      "route_relation": "none",
      "file": ".knowledge/domains/connect-existing.md"
    }
  ]
}
```

`no_match: true` is the signal worth logging: the reader asked something the knowledge base does
not cover. In v0.2 those become the gap backlog automatically.

## In CI

Re-extract changed areas on merge and open the result as a pull request, so generated knowledge is
reviewed by a person before it is ever served:

```yaml
- run: npm install -g kira-knowledge
- run: kira extract
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
- run: kira status
```
