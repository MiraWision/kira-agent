import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { CONFIG_DIR } from '../config.js';

/**
 * Records what was extracted from each area and from which source state. Committed alongside
 * `.knowledge/`, because an area that legitimately produced nothing is indistinguishable from
 * one never extracted without it — and staleness reporting needs both cases.
 */
const entrySchema = z.object({
  area_hash: z.string(),
  at: z.string(),
  model: z.string(),
  facts: z.number().int().nonnegative(),
  files: z.number().int().nonnegative(),
  git_sha: z.string().optional(),
});
export type LedgerEntry = z.infer<typeof entrySchema>;

const ledgerSchema = z.object({
  version: z.literal(1),
  areas: z.record(z.string(), entrySchema),
});
export type Ledger = z.infer<typeof ledgerSchema>;

const EMPTY: Ledger = { version: 1, areas: {} };

export function ledgerPathFor(projectRoot: string): string {
  return join(projectRoot, CONFIG_DIR, 'extracted.json');
}

export function readLedger(projectRoot: string): Ledger {
  const path = ledgerPathFor(projectRoot);
  if (!existsSync(path)) return { ...EMPTY, areas: {} };
  try {
    const parsed = ledgerSchema.safeParse(JSON.parse(readFileSync(path, 'utf-8')));
    return parsed.success ? parsed.data : { ...EMPTY, areas: {} };
  } catch {
    return { ...EMPTY, areas: {} };
  }
}

export function writeLedger(projectRoot: string, ledger: Ledger): void {
  const path = ledgerPathFor(projectRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(ledger, null, 2)}\n`, 'utf-8');
}
