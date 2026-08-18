function segments(route: string): string[] {
  return route.split('/').filter((segment) => segment !== '');
}

function segmentMatches(pattern: string, actual: string): boolean {
  return pattern.startsWith(':') || pattern === actual;
}

export type RouteRelation = 'exact' | 'ancestor' | 'descendant' | 'none';

/**
 * How a fact's route pattern relates to the screen the reader is on.
 * `ancestor` — the fact's route is a prefix of the current screen (a broader page).
 * `descendant` — the fact lives deeper than the current screen.
 */
export function routeRelation(factRoute: string, currentRoute: string): RouteRelation {
  const pattern = segments(factRoute);
  const actual = segments(currentRoute);
  const shared = Math.min(pattern.length, actual.length);
  for (let i = 0; i < shared; i++) {
    if (!segmentMatches(pattern[i]!, actual[i]!)) return 'none';
  }
  if (pattern.length === actual.length) return 'exact';
  return pattern.length < actual.length ? 'ancestor' : 'descendant';
}

/**
 * Multiplicative, because it should reorder comparable matches rather than lift an irrelevant
 * fact above a relevant one: a fact BM25 gave near-zero stays near-zero.
 */
export function routeBoost(relation: RouteRelation): number {
  switch (relation) {
    case 'exact':
      return 1.4;
    case 'ancestor':
      return 1.2;
    case 'descendant':
      return 1.1;
    case 'none':
      return 1;
  }
}
