import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Area, Config } from '../config.js';
import { makeMatcher } from '../lib/glob.js';
import { log } from '../lib/log.js';

const HARD_SKIP_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage']);

export type SourceFilter = (relPath: string) => boolean;

export function makeSourceFilter(config: Config): SourceFilter {
  const included = makeMatcher(config.source.include);
  const excluded = makeMatcher(config.source.exclude);
  return (relPath: string) => included(relPath) && !excluded(relPath);
}

function toPosix(path: string): string {
  return path.split('\\').join('/');
}

function walk(dir: string, sourceRoot: string, accept: SourceFilter): string[] {
  const out: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (HARD_SKIP_DIRS.has(entry.name)) continue;
      out.push(...walk(path, sourceRoot, accept));
      continue;
    }
    if (!entry.isFile()) continue;
    const rel = toPosix(relative(sourceRoot, path));
    if (accept(rel)) out.push(rel);
  }
  return out;
}

/** Repo-relative POSIX paths belonging to one area, deduplicated and sorted. */
export function collectAreaFiles(
  sourceRoot: string,
  area: Area,
  accept: SourceFilter,
): string[] {
  const found: string[] = [];
  for (const entry of area.paths) {
    const absolute = join(sourceRoot, entry);
    if (!existsSync(absolute)) {
      log.warn(`area "${area.id}": path does not exist — ${entry}`);
      continue;
    }
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      found.push(...walk(absolute, sourceRoot, accept));
      continue;
    }
    if (stat.isFile()) {
      const rel = toPosix(relative(sourceRoot, absolute));
      // An explicitly listed file is taken even if the include globs would skip it.
      found.push(rel);
    }
  }
  return [...new Set(found)].sort();
}

export type Batch = { paths: string[]; text: string };

/**
 * Packs files into batches under `maxBytes`. A single file larger than the limit becomes its
 * own batch rather than being split, so the model never sees half a module.
 */
export function batchFiles(
  sourceRoot: string,
  relPaths: readonly string[],
  maxBytes: number,
): Batch[] {
  const batches: Batch[] = [];
  let paths: string[] = [];
  let parts: string[] = [];
  let size = 0;

  const flush = (): void => {
    if (paths.length === 0) return;
    batches.push({ paths: [...paths], text: parts.join('') });
    paths = [];
    parts = [];
    size = 0;
  };

  for (const rel of relPaths) {
    let content: string;
    try {
      content = readFileSync(join(sourceRoot, rel), 'utf-8');
    } catch {
      continue;
    }
    const block = `// FILE: ${rel}\n${content}\n\n`;
    const bytes = Buffer.byteLength(block, 'utf-8');
    if (size + bytes > maxBytes && paths.length > 0) flush();
    paths.push(rel);
    parts.push(block);
    size += bytes;
  }
  flush();
  return batches;
}
