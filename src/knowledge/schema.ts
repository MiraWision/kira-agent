import { z } from 'zod';
import { audienceSchema } from '../config.js';

export const FACT_TYPES = [
  'feature',
  'workflow',
  'concept',
  'ui_location',
  'faq',
  'boundary',
  'policy',
  'troubleshooting',
] as const;
export const factTypeSchema = z.enum(FACT_TYPES);
export type FactType = z.infer<typeof factTypeSchema>;

export const CONFIDENCES = ['high', 'medium', 'low'] as const;
export const confidenceSchema = z.enum(CONFIDENCES);
export type Confidence = z.infer<typeof confidenceSchema>;

/** Gates a fact to users who can actually reach the thing it describes. */
export const requiresSchema = z.object({
  plan: z.array(z.string()).optional(),
  role: z.array(z.string()).optional(),
  flag: z.array(z.string()).optional(),
});
export type Requires = z.infer<typeof requiresSchema>;

export const provenanceSchema = z.object({
  at: z.string(),
  model: z.string(),
  area_hash: z.string(),
  git_sha: z.string().optional(),
});

export const frontmatterSchema = z.object({
  id: z.string().min(1),
  area: z.string().min(1),
  type: factTypeSchema,
  audience: audienceSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  route: z.string().optional(),
  requires: requiresSchema.optional(),
  sources: z.array(z.string()).default([]),
  extracted: provenanceSchema,
  confidence: confidenceSchema,
});
export type Frontmatter = z.infer<typeof frontmatterSchema>;

export type Fact = Frontmatter & {
  body: string;
  /** Path relative to the project root, for reporting. */
  file: string;
};

/**
 * What the extractor model is asked to return per fact. Provenance, area, and audience are
 * filled in by the pipeline — the model is never asked for facts it cannot know.
 */
export const extractedFactSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'slug must be lowercase kebab-case'),
  type: factTypeSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().min(1),
  route: z.string().optional(),
  requires: requiresSchema.optional(),
  sources: z.array(z.string()).default([]),
  confidence: confidenceSchema,
});
export type ExtractedFact = z.infer<typeof extractedFactSchema>;

export const extractionResultSchema = z.object({
  facts: z.array(extractedFactSchema),
});
