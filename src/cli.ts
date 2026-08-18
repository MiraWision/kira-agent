#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { ask } from './answer/ask.js';
import { AUDIENCES, configPathFor, configSchema, loadConfig, type Audience } from './config.js';
import { extract } from './extract/run.js';
import { initProject, proposeAreas } from './init.js';
import { errorMessage, log } from './lib/log.js';
import { formatStatus, status } from './status.js';
import { DEFAULT_LIMIT, type ReaderContext } from './retrieve/search.js';

const VERSION = '0.1.0';

const USAGE = `KIRA — Knowledge Interface for Reliable Answers

  kira init [dir] [--dry-run]    Propose areas from a repo and write .kira/config.yaml
  kira extract [options]         Extract product facts into .knowledge/
  kira status                    Per-area fact counts and staleness
  kira ask "<question>"          Answer a question from .knowledge/

extract options
  --area <id>                    Only this area (repeatable)
  --force                        Re-extract even when sources are unchanged

ask options
  --route <path>                 The screen the reader is on, e.g. /project/42/domains
  --plan <name>                  The reader's plan, for gated facts
  --role <name>                  The reader's role, for gated facts
  --flag <name>                  An enabled feature flag (repeatable)
  --audience <${AUDIENCES.join('|')}>
  --limit <n>                    Facts to retrieve (default ${DEFAULT_LIMIT})
  --include-low                  Include facts the extractor was unsure about
  --json                         Emit the answer and retrieval detail as JSON
  --no-sources                   Do not print which facts were used

  --help, --version
`;

type Flags = {
  values: Map<string, string[]>;
  positionals: string[];
};

const VALUE_FLAGS = new Set(['area', 'route', 'plan', 'role', 'flag', 'audience', 'limit']);
const BOOLEAN_FLAGS = new Set([
  'force',
  'dry-run',
  'include-low',
  'json',
  'no-sources',
  'help',
  'version',
]);

function parseArgs(argv: readonly string[]): Flags {
  const values = new Map<string, string[]>();
  const positionals: string[] = [];
  const push = (key: string, value: string): void => {
    const existing = values.get(key);
    if (existing === undefined) values.set(key, [value]);
    else existing.push(value);
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const body = token.slice(2);
    const equals = body.indexOf('=');
    const key = equals === -1 ? body : body.slice(0, equals);
    if (BOOLEAN_FLAGS.has(key)) {
      push(key, 'true');
      continue;
    }
    if (!VALUE_FLAGS.has(key)) {
      throw new Error(`unknown option --${key}`);
    }
    if (equals !== -1) {
      push(key, body.slice(equals + 1));
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      throw new Error(`--${key} needs a value`);
    }
    push(key, next);
    i += 1;
  }
  return { values, positionals };
}

const first = (flags: Flags, key: string): string | undefined => flags.values.get(key)?.[0];
const has = (flags: Flags, key: string): boolean => flags.values.has(key);

function parseAudience(value: string | undefined, fallback: Audience): Audience {
  if (value === undefined) return fallback;
  const match = AUDIENCES.find((audience) => audience === value);
  if (match === undefined) {
    throw new Error(`--audience must be one of ${AUDIENCES.join(', ')}`);
  }
  return match;
}

async function commandInit(flags: Flags): Promise<number> {
  const projectRoot = resolve(flags.positionals[0] ?? process.cwd());
  const configPath = configPathFor(projectRoot);

  if (has(flags, 'dry-run')) {
    const base = configSchema.parse({ version: 1 });
    const proposal = proposeAreas(projectRoot, base);
    log.info(`routes found under: ${proposal.routeRootsFound.join(', ') || '(none)'}`);
    log.info('');
    for (const area of proposal.areas) {
      const audience = (area.audience ?? base.assistant.audience).padEnd(9);
      log.out(
        `${area.id.padEnd(22)}  ${audience}  ${(area.route ?? '—').padEnd(30)}  ${area.paths.join(', ')}\n`,
      );
    }
    log.info('');
    log.step(
      `${proposal.areas.length} proposed, ${proposal.droppedThin} too thin, ${proposal.droppedOverCap} over cap — nothing written`,
    );
    return 0;
  }

  if (existsSync(configPath) && !has(flags, 'force')) {
    log.error(`${relative(projectRoot, configPath)} already exists. Re-run with --force to replace it.`);
    return 1;
  }
  const { proposal } = initProject(projectRoot, projectRoot);
  log.ok(`wrote ${relative(projectRoot, configPath)}`);
  if (proposal.routeRootsFound.length > 0) {
    log.step(`routes found under ${proposal.routeRootsFound.join(', ')}`);
  }
  log.step(`${proposal.areas.length} area(s) proposed`);
  if (proposal.droppedThin > 0) {
    log.step(`${proposal.droppedThin} candidate(s) skipped — too little source to be an area`);
  }
  if (proposal.droppedOverCap > 0) {
    log.warn(
      `${proposal.droppedOverCap} further candidate(s) not listed — the proposal caps at 24 areas, so add any that matter by hand`,
    );
  }
  if (proposal.areas.length === 0) {
    log.warn('nothing was proposed. Add areas by hand: an area is a topic, with the paths that build it.');
    return 0;
  }
  log.info('');
  log.info('Review the areas before extracting — they are the highest-value thing to edit.');
  log.info('Then: kira extract');
  return 0;
}

async function commandExtract(flags: Flags): Promise<number> {
  const loaded = loadConfig();
  const only = flags.values.get('area');
  const outcomes = await extract(loaded, {
    force: has(flags, 'force'),
    ...(only === undefined ? {} : { only }),
  });

  const extracted = outcomes.filter((outcome) => outcome.status === 'extracted');
  const failed = outcomes.filter((outcome) => outcome.status === 'failed');
  const facts = extracted.reduce(
    (sum, outcome) => sum + (outcome.status === 'extracted' ? outcome.facts : 0),
    0,
  );
  log.info('');
  log.ok(
    `${extracted.length} area(s) extracted, ${facts} fact(s) written, ` +
      `${outcomes.length - extracted.length - failed.length} skipped`,
  );
  if (failed.length > 0) {
    log.error(`${failed.length} area(s) failed: ${failed.map((o) => o.area).join(', ')}`);
    return 1;
  }
  return 0;
}

async function commandStatus(): Promise<number> {
  const loaded = loadConfig();
  const report = status(loaded);
  log.out(`${formatStatus(report)}\n`);
  return report.problems.length > 0 ? 1 : 0;
}

async function commandAsk(flags: Flags): Promise<number> {
  const question = flags.positionals.join(' ').trim();
  if (question === '') {
    log.error('ask needs a question: kira ask "how do I connect a domain?"');
    return 1;
  }
  const loaded = loadConfig();
  const limitRaw = first(flags, 'limit');
  const limit = limitRaw === undefined ? DEFAULT_LIMIT : Number.parseInt(limitRaw, 10);
  if (!Number.isFinite(limit) || limit < 1) {
    log.error('--limit must be a positive integer');
    return 1;
  }

  const flagValues = flags.values.get('flag');
  const context: ReaderContext = {
    audience: parseAudience(first(flags, 'audience'), loaded.config.assistant.audience),
    ...(first(flags, 'route') === undefined ? {} : { route: first(flags, 'route')! }),
    ...(first(flags, 'plan') === undefined ? {} : { plan: first(flags, 'plan')! }),
    ...(first(flags, 'role') === undefined ? {} : { role: first(flags, 'role')! }),
    ...(flagValues === undefined ? {} : { flags: flagValues }),
    includeLow: has(flags, 'include-low'),
  };

  const asJson = has(flags, 'json');
  const result = await ask(loaded, {
    question,
    context,
    limit,
    ...(asJson ? {} : { onText: (delta) => log.out(delta) }),
  });

  if (asJson) {
    log.out(
      `${JSON.stringify(
        {
          question,
          answer: result.answer,
          no_match: result.noMatch,
          facts: result.retrieved.map((entry) => ({
            id: entry.fact.id,
            title: entry.fact.title,
            type: entry.fact.type,
            score: Number(entry.score.toFixed(4)),
            route: entry.fact.route ?? null,
            route_relation: entry.routeRelation,
            file: entry.fact.file,
          })),
        },
        null,
        2,
      )}\n`,
    );
    return 0;
  }

  log.out('\n');
  if (!has(flags, 'no-sources')) {
    if (result.retrieved.length === 0) {
      log.warn('no facts matched — this question is a gap in the knowledge base');
    } else {
      log.info('');
      log.step('facts used:');
      for (const entry of result.retrieved) {
        const route = entry.fact.route === undefined ? '' : ` [${entry.fact.route}]`;
        log.info(`    ${entry.fact.id}${route}  ${entry.score.toFixed(2)}`);
      }
    }
  }
  for (const problem of result.problems) {
    log.warn(`${problem.file}: ${problem.message}`);
  }
  return 0;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    log.out(USAGE);
    return 0;
  }
  const [command, ...rest] = argv;
  if (command === '--help' || command === '-h' || command === 'help') {
    log.out(USAGE);
    return 0;
  }
  if (command === '--version' || command === '-v') {
    log.out(`${VERSION}\n`);
    return 0;
  }

  const flags = parseArgs(rest);
  if (has(flags, 'help')) {
    log.out(USAGE);
    return 0;
  }

  switch (command) {
    case 'init':
      return commandInit(flags);
    case 'extract':
      return commandExtract(flags);
    case 'status':
      return commandStatus();
    case 'ask':
      return commandAsk(flags);
    default:
      log.error(`unknown command "${command ?? ''}"`);
      log.out(USAGE);
      return 1;
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    log.error(errorMessage(error));
    process.exitCode = 1;
  });
