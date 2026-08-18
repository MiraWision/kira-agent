import type { Audience } from '../config.js';
import type { Fact, Requires } from '../knowledge/schema.js';
import { buildIndex, score, tokenize } from './bm25.js';
import { routeBoost, routeRelation, type RouteRelation } from './route.js';

export const DEFAULT_LIMIT = 5;
/** Word-set overlap above which two facts are treated as saying the same thing. */
export const DIVERSITY_THRESHOLD = 0.6;

export type ReaderContext = {
  audience: Audience;
  /** The screen the reader is on, if the caller knows it. */
  route?: string;
  plan?: string;
  role?: string;
  flags?: readonly string[];
  /** Include facts the extractor was unsure about. Off by default. */
  includeLow?: boolean;
};

export type Retrieved = {
  fact: Fact;
  score: number;
  routeRelation: RouteRelation;
};

/** An operator may read end-user facts; a reader never sees facts written above their level. */
const VISIBLE_TO: Record<Audience, ReadonlySet<Audience>> = {
  end_user: new Set<Audience>(['end_user']),
  operator: new Set<Audience>(['end_user', 'operator']),
  developer: new Set<Audience>(['end_user', 'operator', 'developer']),
};

/**
 * A gate only excludes when the caller actually told us the reader's plan/role/flags. Unknown
 * context must not hide facts — that would make the CLI and an unauthenticated widget silently
 * answer less than they know.
 */
export function passesGate(requires: Requires | undefined, context: ReaderContext): boolean {
  if (requires === undefined) return true;
  if (requires.plan !== undefined && requires.plan.length > 0 && context.plan !== undefined) {
    if (!requires.plan.includes(context.plan)) return false;
  }
  if (requires.role !== undefined && requires.role.length > 0 && context.role !== undefined) {
    if (!requires.role.includes(context.role)) return false;
  }
  if (requires.flag !== undefined && requires.flag.length > 0 && context.flags !== undefined) {
    const enabled = new Set(context.flags);
    if (!requires.flag.some((flag) => enabled.has(flag))) return false;
  }
  return true;
}

export function isEligible(fact: Fact, context: ReaderContext): boolean {
  if (!VISIBLE_TO[context.audience].has(fact.audience)) return false;
  if (fact.confidence === 'low' && context.includeLow !== true) return false;
  return passesGate(fact.requires, context);
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function fingerprint(fact: Fact): Set<string> {
  return new Set(tokenize(`${fact.title} ${fact.summary} ${fact.body}`));
}

/**
 * Greedy diversity pass: walk candidates best-first and keep one unless it largely repeats a
 * fact already selected, so the answer sees several distinct facts rather than one restated.
 */
export function selectDiverse(
  candidates: readonly Retrieved[],
  limit: number,
  threshold: number = DIVERSITY_THRESHOLD,
): Retrieved[] {
  const selected: Retrieved[] = [];
  const fingerprints: Set<string>[] = [];
  for (const candidate of candidates) {
    if (selected.length >= limit) break;
    const tokens = fingerprint(candidate.fact);
    if (fingerprints.some((existing) => jaccard(tokens, existing) > threshold)) continue;
    selected.push(candidate);
    fingerprints.push(tokens);
  }
  return selected;
}

export function retrieve(
  facts: readonly Fact[],
  query: string,
  context: ReaderContext,
  limit: number = DEFAULT_LIMIT,
): Retrieved[] {
  const eligible = facts.filter((fact) => isEligible(fact, context));
  if (eligible.length === 0) return [];

  const index = buildIndex(eligible);
  const scores = score(index, query);

  const scored: Retrieved[] = [];
  for (const [docId, raw] of scores) {
    const fact = eligible[docId];
    if (fact === undefined) continue;
    const relation =
      context.route !== undefined && fact.route !== undefined
        ? routeRelation(fact.route, context.route)
        : 'none';
    scored.push({ fact, score: raw * routeBoost(relation), routeRelation: relation });
  }

  scored.sort((a, b) => b.score - a.score || a.fact.id.localeCompare(b.fact.id));
  return selectDiverse(scored, limit);
}
