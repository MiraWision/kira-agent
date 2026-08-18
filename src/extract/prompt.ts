import type { Audience } from '../config.js';

const AUDIENCE_BRIEF: Record<Audience, string> = {
  end_user:
    'People who use the product to get their work done. They are not engineers and will never open the source. They care about what they can do, where to go, and what happens next.',
  operator:
    'Support agents, customer success, and internal operators. They explain the product to customers and need the rules that govern its behaviour — policies, limits, what happens on failure — in plain language.',
  developer:
    'Engineers building on or extending this codebase. Module names, routes, and function names are useful to them and may appear in the text.',
};

const NO_CODE_IDENTIFIERS = `
Write for someone who cannot see the source. In \`title\`, \`summary\`, and \`body\` do not name
repositories, file paths, directories, functions, classes, database tables, environment
variables, internal API routes, queue or cron identifiers, or developer tooling. Where the code
uses an internal name for something the audience knows by another name, use theirs. Source paths
belong in \`sources\`; nothing else carries them.

Keep interface strings exactly as the code renders them — menu items, tab titles, button
labels, field names, headings. Those are what the reader will look for on screen, so they are
quoted verbatim, not translated or paraphrased.
`.trim();

const FACT_GUIDE = `
## What one fact is

A fact is one self-contained thing a reader could ask about, written so it answers that
question on its own. Facts do not overlap: if two would repeat the same information, write the
one that answers it best. Prefer a handful of substantial facts over many thin ones.

## Types

- \`feature\` — a capability that exists.
- \`workflow\` — an ordered way to accomplish something. Put the steps in \`body\`, in order.
- \`concept\` — a term or model the reader needs to understand to use the product.
- \`ui_location\` — where something lives in the interface.
- \`faq\` — a question the audience actually asks, with its answer.
- \`boundary\` — something the product does **not** do, cannot do, or restricts. Say what is not
  possible and what the reader can do instead, if anything.
- \`policy\` — a rule that affects the reader: limits, quotas, retention, billing behaviour,
  what happens automatically.
- \`troubleshooting\` — a symptom, its likely cause, and what to try next.

Mine restrictions as carefully as capabilities. Code is full of guards, plan checks, validation
errors, and unsupported branches, and a confident "yes" to something the product refuses is the
most damaging kind of wrong answer. When the code shows a limit, write it as a \`boundary\` or
\`policy\` fact.
`.trim();

const FIELD_GUIDE = `
## Fields

- \`slug\` — lowercase kebab-case, derived from what the fact is about rather than the file it
  came from. It becomes a filename and should stay stable if the wording is later improved.
- \`title\` — a short noun phrase or plain question.
- \`summary\` — one sentence. It is what a reader sees in a list of results.
- \`body\` — markdown. The full answer, and nothing that is not an answer: no preamble, no
  restating the title, no notes about where in the code you found it.
- \`route\` — the reader-visible path this lives at, if the code makes it unambiguous, with
  dynamic segments as \`:name\` (for example \`/project/:id/domains\`). Empty string when the code
  does not show a path, or when the fact is not about one place.
- \`requires_plan\` / \`requires_role\` — fill these only when the code gates the thing behind a
  named plan, tier, or role. Use the names the code uses. Empty arrays when there is no gate.
  A guess here silently hides a fact from readers who should see it, so leave them empty unless
  the gate is explicit.
- \`sources\` — paths from the provided file list that this fact came from. Only paths from that
  list.
- \`confidence\` — \`high\` when the code states this plainly; \`medium\` when you inferred it from
  clear surrounding evidence; \`low\` when it is a reasonable reading that a reviewer should
  check.

## Grounding

Everything you write comes from the code in front of you. Do not fill gaps with how products
like this usually work, do not describe screens, buttons, or steps you cannot see, and do not
promise behaviour the code does not implement. If this code has little the audience would ask
about, return an empty list of facts — that is a correct and useful answer, and better than
inventing coverage.
`.trim();

/** Stable across every area, so it stays a cache hit for the whole extraction run. */
export function extractionInstructions(audience: Audience): string {
  const audienceRules = audience === 'developer' ? '' : `\n\n${NO_CODE_IDENTIFIERS}`;
  return `
You read source code and write down what it means for the people who use the product, as a set
of small, self-contained facts. Those facts become a knowledge base that answers their
questions, so each one has to be true of the product as this code builds it.

## Audience

${AUDIENCE_BRIEF[audience]}${audienceRules}

${FACT_GUIDE}

${FIELD_GUIDE}
`.trim();
}

export type ExtractionInput = {
  areaName: string;
  paths: readonly string[];
  code: string;
  routeHint?: string;
  maxFacts: number;
};

export function extractionInput(input: ExtractionInput): string {
  const fileList = input.paths.map((path) => `- ${path}`).join('\n');
  const routeHint =
    input.routeHint === undefined
      ? ''
      : `\nThis area is reached at \`${input.routeHint}\` — use it for \`route\` where a fact is about this place, refining the dynamic segments if the code shows more detail.\n`;

  return `# Area: ${input.areaName}
${routeHint}
Write at most ${input.maxFacts} facts from the code below. Fewer is fine.

## Files in this batch (use these paths for \`sources\`)

${fileList}

## Code

${input.code}`;
}
