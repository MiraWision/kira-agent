import type { Audience, LoadedConfig } from './config.js';
import { resolveAreaAudience } from './config.js';
import { collectAreaFiles, makeSourceFilter } from './extract/scan.js';
import { readLedger } from './extract/ledger.js';
import { hashFiles } from './lib/hash.js';
import { loadFacts, type LoadProblem } from './knowledge/store.js';
import type { Confidence } from './knowledge/schema.js';

export type AreaStatus = {
  id: string;
  name: string;
  audience: Audience;
  files: number;
  facts: number;
  state: 'fresh' | 'stale' | 'never-extracted' | 'no-files';
  extractedAt?: string;
  confidence: Record<Confidence, number>;
  withRoute: number;
  boundaries: number;
};

export type StatusReport = {
  areas: AreaStatus[];
  orphanFacts: number;
  problems: LoadProblem[];
  totals: { files: number; facts: number; boundaries: number; withRoute: number };
};

export function status(loaded: LoadedConfig): StatusReport {
  const { config, projectRoot, sourceRoot } = loaded;
  const accept = makeSourceFilter(config);
  const ledger = readLedger(projectRoot);
  const { facts, problems } = loadFacts(projectRoot);

  const byArea = new Map<string, typeof facts>();
  for (const fact of facts) {
    const bucket = byArea.get(fact.area);
    if (bucket === undefined) byArea.set(fact.area, [fact]);
    else bucket.push(fact);
  }

  const areas: AreaStatus[] = config.areas.map((area) => {
    const files = collectAreaFiles(sourceRoot, area, accept);
    const areaFacts = byArea.get(area.id) ?? [];
    const entry = ledger.areas[area.id];
    const currentHash = hashFiles(sourceRoot, files);

    let state: AreaStatus['state'];
    if (files.length === 0) state = 'no-files';
    else if (entry === undefined) state = 'never-extracted';
    else state = entry.area_hash === currentHash ? 'fresh' : 'stale';

    const confidence: Record<Confidence, number> = { high: 0, medium: 0, low: 0 };
    for (const fact of areaFacts) confidence[fact.confidence] += 1;

    return {
      id: area.id,
      name: area.name,
      audience: resolveAreaAudience(config, area),
      files: files.length,
      facts: areaFacts.length,
      state,
      ...(entry === undefined ? {} : { extractedAt: entry.at }),
      confidence,
      withRoute: areaFacts.filter((fact) => fact.route !== undefined).length,
      boundaries: areaFacts.filter((fact) => fact.type === 'boundary').length,
    };
  });

  const configuredIds = new Set(config.areas.map((area) => area.id));
  const orphanFacts = facts.filter((fact) => !configuredIds.has(fact.area)).length;

  return {
    areas,
    orphanFacts,
    problems,
    totals: {
      files: areas.reduce((sum, area) => sum + area.files, 0),
      facts: facts.length,
      boundaries: facts.filter((fact) => fact.type === 'boundary').length,
      withRoute: facts.filter((fact) => fact.route !== undefined).length,
    },
  };
}

const STATE_LABEL: Record<AreaStatus['state'], string> = {
  fresh: 'fresh',
  stale: 'stale',
  'never-extracted': 'not yet run',
  'no-files': 'no files',
};

export function formatStatus(report: StatusReport): string {
  const header = ['Area', 'Files', 'Facts', 'Bound.', 'Route', 'State'];
  const rows = report.areas.map((area) => [
    area.id,
    String(area.files),
    String(area.facts),
    String(area.boundaries),
    String(area.withRoute),
    STATE_LABEL[area.state],
  ]);
  const totals = [
    'TOTAL',
    String(report.totals.files),
    String(report.totals.facts),
    String(report.totals.boundaries),
    String(report.totals.withRoute),
    '',
  ];

  const widths = header.map((_, column) =>
    Math.max(
      header[column]!.length,
      totals[column]!.length,
      ...rows.map((row) => row[column]!.length),
    ),
  );
  const line = (cells: readonly string[]): string =>
    cells
      .map((cell, column) => (column === 0 ? cell.padEnd(widths[column]!) : cell.padStart(widths[column]!)))
      .join('  ')
      .trimEnd();
  const rule = widths.map((width) => '─'.repeat(width)).join('  ');

  const out = [line(header), rule, ...rows.map(line), rule, line(totals)];

  if (report.orphanFacts > 0) {
    out.push('', `${report.orphanFacts} fact(s) belong to areas no longer in the config.`);
  }
  if (report.problems.length > 0) {
    out.push('', 'Files that could not be read as facts:');
    for (const problem of report.problems) out.push(`  ${problem.file}: ${problem.message}`);
  }
  return out.join('\n');
}
