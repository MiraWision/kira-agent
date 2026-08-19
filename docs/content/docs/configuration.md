`.kira/config.yaml` is written by `kira init` and then edited by you. Everything except `areas` has
a working default.

```yaml
version: 1

assistant:
  name: KIRA                # rename per deployment
  audience: end_user        # end_user · operator · developer
  language: mirror          # mirror · en

knowledge:
  language: English         # what the extracted facts are written in

source:
  root: .
  include: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.md"]
  exclude: ["**/node_modules/**", "**/dist/**", "**/*.test.*", "**/*.d.ts"]

models:
  extract: claude-opus-5
  answer: claude-opus-5
  judge: claude-opus-5

effort:
  extract: high             # a durable artifact, nobody waiting
  answer: medium            # a person is watching a cursor blink
  judge: high

limits:
  batch_bytes: 100000
  max_chunks_per_batch: 12

areas:
  - id: domains
    name: Custom Domains
    audience: end_user
    route: /project/:id/domains
    paths:
      - src/app/project/[id]/domains
```

## `assistant`

| Key | Default | Meaning |
|---|---|---|
| `name` | `KIRA` | What the assistant calls itself. Rename it per deployment; the tool does not care. |
| `audience` | `end_user` | Default audience for extraction and answering. An area may override it. |
| `language` | `mirror` | `mirror` answers in the language of the question. `en` always answers in English. |

Interface labels stay verbatim under `mirror` — only the prose around them follows the reader.

## `knowledge.language`

The language the facts themselves are written in, which follows your code and its interface
strings rather than your readers. It is the target of the rewrite hop described in
[Retrieval](../retrieval/): a question is translated into this language before it is
scored, because lexical matching cannot cross languages.

## `source`

`root` is where the areas' `paths` are resolved from — point it at the app in a monorepo. `include`
and `exclude` are globs supporting `**`, `*` and `?`, matched against repo-relative POSIX paths.
Files listed explicitly in an area's `paths` bypass `include`.

## `models` and `effort`

Both are per stage, because the stages have different economics.

Extraction produces a durable artifact in a batch job nobody is waiting on, so it defaults to
`high` effort — quality is what you keep. Answering happens while a person watches a cursor blink,
so it defaults to `medium`. `judge` is used by the eval loop in v0.2.

Effort accepts `low`, `medium`, `high`, `xhigh` and `max`.

> [!TIP]
> Sweep these against your own repository rather than trusting the defaults. Lower effort performs
> better than its name suggests on current models, and extraction cost is the one number that
> scales with your codebase.

## `limits`

| Key | Default | Meaning |
|---|---|---|
| `batch_bytes` | `100000` | Source bytes per extraction call. A single larger file becomes its own batch rather than being split — the model never sees half a module. |
| `max_chunks_per_batch` | `12` | Ceiling on facts per call. Fewer, denser facts beat many thin ones. |

## Credentials

KIRA never stores a key. The Anthropic SDK resolves credentials itself, in order:
`ANTHROPIC_API_KEY`, then `ANTHROPIC_AUTH_TOKEN`, then a profile from `ant auth login`.
