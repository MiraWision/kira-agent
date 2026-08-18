import type { Area, LoadedConfig } from '../config.js';
import { resolveAreaAudience } from '../config.js';
import { gitSha } from '../lib/git.js';
import { hashFiles } from '../lib/hash.js';
import { errorMessage, log } from '../lib/log.js';
import { structured } from '../lib/llm.js';
import type { ExtractedFact, Frontmatter } from '../knowledge/schema.js';
import { clearArea, writeFact } from '../knowledge/store.js';
import { extractionInput, extractionInstructions } from './prompt.js';
import { apiExtractionSchema, dedupeSlugs, normalizeFact } from './result.js';
import { readLedger, writeLedger } from './ledger.js';
import { batchFiles, collectAreaFiles, makeSourceFilter } from './scan.js';

export type AreaOutcome =
  | { area: string; status: 'skipped'; reason: 'unchanged' }
  | { area: string; status: 'skipped'; reason: 'no-files'; areaHash: string }
  | {
      area: string;
      status: 'extracted';
      facts: number;
      files: number;
      batches: number;
      areaHash: string;
    }
  | { area: string; status: 'failed'; message: string };

export type ExtractOptions = {
  /** Re-extract even when the area's sources are unchanged. */
  force: boolean;
  /** Restrict the run to these area ids. */
  only?: readonly string[];
};

export async function extract(
  loaded: LoadedConfig,
  options: ExtractOptions,
): Promise<AreaOutcome[]> {
  const { config, projectRoot, sourceRoot } = loaded;
  const accept = makeSourceFilter(config);
  const ledger = readLedger(projectRoot);
  const sha = gitSha(sourceRoot);
  const outcomes: AreaOutcome[] = [];

  const areas = config.areas.filter(
    (area) => options.only === undefined || options.only.includes(area.id),
  );
  if (areas.length === 0) {
    log.warn('no areas to extract — check `areas` in .kira/config.yaml, or the --area filter');
    return outcomes;
  }

  for (const area of areas) {
    try {
      const outcome = await extractArea({
        loaded,
        area,
        accept,
        force: options.force,
        previousHash: ledger.areas[area.id]?.area_hash,
        sha,
      });
      outcomes.push(outcome);
      const recordable =
        outcome.status === 'extracted' ||
        (outcome.status === 'skipped' && outcome.reason === 'no-files');
      if (recordable && 'areaHash' in outcome) {
        ledger.areas[area.id] = {
          area_hash: outcome.areaHash,
          at: new Date().toISOString().slice(0, 10),
          model: config.models.extract,
          facts: outcome.status === 'extracted' ? outcome.facts : 0,
          files: outcome.status === 'extracted' ? outcome.files : 0,
          ...(sha === undefined ? {} : { git_sha: sha }),
        };
        writeLedger(projectRoot, ledger);
      }
    } catch (error) {
      const message = errorMessage(error);
      log.error(`area "${area.id}" failed: ${message}`);
      outcomes.push({ area: area.id, status: 'failed', message });
    }
  }
  return outcomes;
}

type AreaRun = {
  loaded: LoadedConfig;
  area: Area;
  accept: (relPath: string) => boolean;
  force: boolean;
  previousHash: string | undefined;
  sha: string | undefined;
};

async function extractArea(run: AreaRun): Promise<AreaOutcome> {
  const { loaded, area, accept, force, previousHash, sha } = run;
  const { config, projectRoot, sourceRoot } = loaded;

  const files = collectAreaFiles(sourceRoot, area, accept);
  const areaHash = hashFiles(sourceRoot, files);

  if (!force && previousHash === areaHash) {
    log.step(`${area.id} — unchanged, skipped`);
    return { area: area.id, status: 'skipped', reason: 'unchanged' };
  }
  if (files.length === 0) {
    log.warn(`${area.id} — no matching source files`);
    clearArea(projectRoot, area.id);
    return { area: area.id, status: 'skipped', reason: 'no-files', areaHash };
  }

  const audience = resolveAreaAudience(config, area);
  const instructions = extractionInstructions(audience);
  const batches = batchFiles(sourceRoot, files, config.limits.batch_bytes);
  log.step(`${area.id} — ${files.length} files, ${batches.length} batch(es), ${audience}`);

  const collected: ExtractedFact[] = [];
  for (const [index, batch] of batches.entries()) {
    const result = await structured({
      model: config.models.extract,
      effort: config.effort.extract,
      schema: apiExtractionSchema,
      instructions,
      input: extractionInput({
        areaName: area.name,
        paths: batch.paths,
        code: batch.text,
        ...(area.route === undefined ? {} : { routeHint: area.route }),
        maxFacts: config.limits.max_chunks_per_batch,
      }),
    });
    for (const raw of result.facts) {
      const fact = normalizeFact(raw, batch.paths);
      if (fact !== null) collected.push(fact);
    }
    log.step(`  batch ${index + 1}/${batches.length} → ${result.facts.length} fact(s)`);
  }

  // Slugs are made unique across the whole area, not per batch, since the slug is the filename.
  // Facts from different batches can still overlap in substance; retrieval-time diversity
  // selection is what keeps near-duplicates out of a single answer.
  const facts = dedupeSlugs(collected);

  clearArea(projectRoot, area.id);
  const extracted = {
    at: new Date().toISOString().slice(0, 10),
    model: config.models.extract,
    area_hash: areaHash,
    ...(sha === undefined ? {} : { git_sha: sha }),
  };
  for (const fact of facts) {
    const frontmatter: Frontmatter = {
      id: `${area.id}/${fact.slug}`,
      area: area.id,
      type: fact.type,
      audience,
      title: fact.title,
      summary: fact.summary,
      ...(fact.route === undefined ? {} : { route: fact.route }),
      ...(fact.requires === undefined ? {} : { requires: fact.requires }),
      sources: fact.sources,
      extracted,
      confidence: fact.confidence,
    };
    writeFact(projectRoot, frontmatter, fact.body);
  }

  log.ok(`${area.id} — ${facts.length} fact(s) written`);
  return {
    area: area.id,
    status: 'extracted',
    facts: facts.length,
    files: files.length,
    batches: batches.length,
    areaHash,
  };
}
