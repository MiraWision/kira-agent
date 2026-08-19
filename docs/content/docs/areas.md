An **area** is a topic somebody asks about. Not a directory, not a module, not a route — a topic.
"Custom domains" is an area. "`src/lib/utils`" is not.

Areas are the unit of extraction: KIRA reads one area's files together, writes the facts it found,
and records a hash so an unchanged area is skipped next time.

## What `kira init` proposes

`kira init` looks for the first routes root it recognises — `src/app`, `app`, `src/pages`, `pages`,
`src/routes`, `routes` — and proposes one area per page directory beneath it, deriving the route as
it goes. Route groups like `(marketing)` are not part of a URL and are walked through; dynamic
segments become `:name`.

```text
src/app/project/[id]/domains  →  id: project-domains
                                 route: /project/:id/domains
                                 audience: end_user
```

It then proposes an area per child of the behaviour roots — `src/lib`, `src/services`, `src/server`,
`src/api`, `src/agents` — with `audience: operator`, since those describe how the product behaves
rather than what a screen looks like. A `docs/` directory becomes one more area.

Directories that never hold product knowledge are skipped outright: `components`, `hooks`, `utils`,
`types`, `styles`, `assets`, tests and mocks.

### Thresholds differ by kind

A page directory is user-facing by construction, so **one file is enough** to make it an area — a
single-file `login/` page owns "how do I reset my password?", which is one of the most-asked
questions any product gets. Under a behaviour root a lone file is usually a utility, so it needs at
least two to qualify.

The proposal caps at 24 areas. If more survive, `init` says how many it dropped rather than
silently truncating.

## What you should change

The proposal is a first draft whose only job is to be worth editing.

- **Merge what a person would ask about together.** Three sibling route folders that make up one
  feature are one area, not three.
- **Delete what has nothing user-facing.** `not-found`, `layout`-only folders, internal admin
  pages nobody outside the company sees.
- **Rename for the reader.** `project-domains` is a path; "Custom Domains" is what your user calls
  it, and the name reaches the model at extraction time.
- **Set the audience.** `end_user` for people using the product, `operator` for support and
  internal staff, `developer` for engineers. It decides both how facts are written and who they
  are shown to.
- **Fix the route.** The area's route is a hint; the extractor refines it per fact from the file
  paths it reads, so a fact from `positions/edit/[id]/page.tsx` ends up at `/positions/edit/:id`
  even when the area says `/positions`.

## Adding an area by hand

```yaml
areas:
  - id: billing
    name: Billing & Invoices
    audience: end_user
    route: /settings/billing
    paths:
      - src/app/settings/billing
      - src/lib/stripe
```

`paths` accepts directories and individual files, and may cross the whole repository — an area is
allowed to span a screen and the module that powers it. Files listed explicitly are read even when
the `source.include` globs would skip them.

> [!TIP]
> Run `kira extract --area billing` while you are iterating on one area. It is the cheap loop:
> extract, read what came out, adjust the paths or the name, extract again with `--force`.

## Monorepos

Point `source.root` at the app and keep the config at the repository root:

```yaml
source:
  root: apps/web
areas:
  - id: domains
    name: Custom Domains
    paths: [src/app/domains]     # relative to source.root
```
