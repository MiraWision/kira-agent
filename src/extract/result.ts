import { z } from 'zod';
import { confidenceSchema, factTypeSchema, type ExtractedFact } from '../knowledge/schema.js';

/**
 * The shape the model returns. Every field is required and no string constraints are used:
 * structured outputs drop unsupported JSON-Schema keywords (`minLength`, `pattern`) and then
 * validate them client-side, which turns a cosmetic slug into a failed batch. Absence is
 * expressed as an empty string or empty array and normalized below instead.
 */
const apiFactSchema = z.object({
  slug: z.string(),
  type: factTypeSchema,
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  route: z.string(),
  requires_plan: z.array(z.string()),
  requires_role: z.array(z.string()),
  sources: z.array(z.string()),
  confidence: confidenceSchema,
});

export const apiExtractionSchema = z.object({ facts: z.array(apiFactSchema) });
export type ApiFact = z.infer<typeof apiFactSchema>;

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug.length > 0 ? slug : 'fact';
}

/**
 * Turns a model-shaped fact into a store-shaped one: repairs the slug, drops empty
 * placeholders, and keeps only sources the batch actually contained.
 */
export function normalizeFact(fact: ApiFact, allowedSources: readonly string[]): ExtractedFact | null {
  const title = fact.title.trim();
  const summary = fact.summary.trim();
  const body = fact.body.trim();
  if (title === '' || summary === '' || body === '') return null;

  const allowed = new Set(allowedSources);
  const sources = [...new Set(fact.sources.map((s) => s.trim()))].filter((s) => allowed.has(s));
  const route = fact.route.trim();
  const plan = fact.requires_plan.map((p) => p.trim()).filter((p) => p !== '');
  const role = fact.requires_role.map((r) => r.trim()).filter((r) => r !== '');

  const candidateSlug = fact.slug.trim();
  const slug = /^[a-z0-9][a-z0-9-]*$/.test(candidateSlug) ? candidateSlug : slugify(title);

  const normalized: ExtractedFact = {
    slug,
    type: fact.type,
    title,
    summary,
    body,
    sources,
    confidence: fact.confidence,
  };
  if (route !== '') normalized.route = route;
  if (plan.length > 0 || role.length > 0) {
    normalized.requires = {
      ...(plan.length > 0 ? { plan } : {}),
      ...(role.length > 0 ? { role } : {}),
    };
  }
  return normalized;
}

/** Keeps slugs unique within an area, since the slug is the filename. */
export function dedupeSlugs(facts: readonly ExtractedFact[]): ExtractedFact[] {
  const seen = new Map<string, number>();
  return facts.map((fact) => {
    const count = seen.get(fact.slug) ?? 0;
    seen.set(fact.slug, count + 1);
    return count === 0 ? fact : { ...fact, slug: `${fact.slug}-${count + 1}` };
  });
}
