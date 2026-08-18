import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { knowledgeDirFor } from '../config.js';
import { serializeDocument, splitFrontmatter } from './frontmatter.js';
import { type Fact, type Frontmatter, frontmatterSchema } from './schema.js';

export type LoadProblem = { file: string; message: string };
export type LoadResult = { facts: Fact[]; problems: LoadProblem[] };

function walkMarkdown(dir: string): string[] {
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
      out.push(...walkMarkdown(path));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      out.push(path);
    }
  }
  return out;
}

/**
 * Reads every fact in `.knowledge/`. Invalid files are reported rather than thrown, so one
 * bad file cannot take down an answer for the whole base.
 */
export function loadFacts(projectRoot: string): LoadResult {
  const root = knowledgeDirFor(projectRoot);
  const facts: Fact[] = [];
  const problems: LoadProblem[] = [];
  for (const absolute of walkMarkdown(root).sort()) {
    const file = relative(projectRoot, absolute);
    try {
      const { frontmatter, body } = splitFrontmatter(readFileSync(absolute, 'utf-8'));
      const parsed = frontmatterSchema.safeParse(frontmatter);
      if (!parsed.success) {
        problems.push({
          file,
          message: parsed.error.issues
            .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('; '),
        });
        continue;
      }
      facts.push({ ...parsed.data, body, file });
    } catch (error) {
      problems.push({ file, message: String(error instanceof Error ? error.message : error) });
    }
  }
  return { facts, problems };
}

export function factPath(projectRoot: string, areaId: string, slug: string): string {
  return join(knowledgeDirFor(projectRoot), areaId, `${slug}.md`);
}

export function writeFact(projectRoot: string, frontmatter: Frontmatter, body: string): string {
  const path = factPath(projectRoot, frontmatter.area, frontmatter.id.split('/').pop() ?? 'fact');
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, serializeDocument(frontmatter, body), 'utf-8');
  return relative(projectRoot, path);
}

/** Drops an area's directory so a re-extraction never leaves orphaned facts behind. */
export function clearArea(projectRoot: string, areaId: string): void {
  rmSync(join(knowledgeDirFor(projectRoot), areaId), { recursive: true, force: true });
}
