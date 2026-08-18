import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Stable digest over a set of files: sorted relative paths plus their contents.
 * A rename changes the hash, so renamed sources are re-extracted.
 * Unreadable files are skipped, matching the extraction file reader.
 */
export function hashFiles(root: string, relPaths: readonly string[]): string {
  const hash = createHash('sha256');
  for (const rel of [...new Set(relPaths)].sort()) {
    let content: string;
    try {
      content = readFileSync(join(root, rel), 'utf-8');
    } catch {
      continue;
    }
    hash.update(`${rel}\n${content}\n`);
  }
  return hash.digest('hex');
}
