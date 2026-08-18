import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';

export const CONFIG_DIR = '.kira';
export const CONFIG_FILE = 'config.yaml';
export const KNOWLEDGE_DIR = '.knowledge';

export const AUDIENCES = ['end_user', 'operator', 'developer'] as const;
export const audienceSchema = z.enum(AUDIENCES);
export type Audience = z.infer<typeof audienceSchema>;

export const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export const effortSchema = z.enum(EFFORTS);
export type Effort = z.infer<typeof effortSchema>;

const DEFAULT_INCLUDE = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.md'];
const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.d.ts',
];

/** Bulk stage; the cost knob for the whole tool lives here. */
export const DEFAULT_MODEL = 'claude-opus-5';

export const areaSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'area id must be lowercase kebab-case'),
  name: z.string().min(1),
  audience: audienceSchema.optional(),
  route: z.string().optional(),
  paths: z.array(z.string()).min(1),
});
export type Area = z.infer<typeof areaSchema>;

export const configSchema = z.object({
  version: z.literal(1),
  assistant: z
    .object({
      name: z.string().default('KIRA'),
      audience: audienceSchema.default('end_user'),
      language: z.enum(['mirror', 'en']).default('mirror'),
    })
    .prefault({}),
  knowledge: z
    .object({
      /**
       * The language the extracted facts are written in — which follows the code, not the
       * reader. Questions are rewritten into it before retrieval scores them.
       */
      language: z.string().default('English'),
    })
    .prefault({}),
  source: z
    .object({
      root: z.string().default('.'),
      include: z.array(z.string()).default(DEFAULT_INCLUDE),
      exclude: z.array(z.string()).default(DEFAULT_EXCLUDE),
    })
    .prefault({}),
  models: z
    .object({
      extract: z.string().default(DEFAULT_MODEL),
      answer: z.string().default(DEFAULT_MODEL),
      judge: z.string().default(DEFAULT_MODEL),
    })
    .prefault({}),
  /**
   * How hard the model works per stage. Extraction produces a durable artifact nobody is
   * waiting on, so it defaults high; answering happens while a person watches a cursor blink,
   * so it defaults medium. Both are worth sweeping against your own repo.
   */
  effort: z
    .object({
      extract: effortSchema.default('high'),
      answer: effortSchema.default('medium'),
      judge: effortSchema.default('high'),
    })
    .prefault({}),
  limits: z
    .object({
      batch_bytes: z.number().int().positive().default(100_000),
      max_chunks_per_batch: z.number().int().positive().default(12),
    })
    .prefault({}),
  areas: z.array(areaSchema).default([]),
});
export type Config = z.infer<typeof configSchema>;

export type LoadedConfig = {
  config: Config;
  /** Absolute path of the project the config belongs to. */
  projectRoot: string;
  /** Absolute path the `source.root` setting resolves to. */
  sourceRoot: string;
  configPath: string;
};

export function configPathFor(projectRoot: string): string {
  return join(projectRoot, CONFIG_DIR, CONFIG_FILE);
}

export function knowledgeDirFor(projectRoot: string): string {
  return join(projectRoot, KNOWLEDGE_DIR);
}

/** Walks up from `startDir` looking for `.kira/config.yaml`. */
export function findProjectRoot(startDir: string = process.cwd()): string | null {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(configPathFor(dir))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export class ConfigError extends Error {}

export function loadConfig(startDir: string = process.cwd()): LoadedConfig {
  const projectRoot = findProjectRoot(startDir);
  if (projectRoot === null) {
    throw new ConfigError(
      `No ${CONFIG_DIR}/${CONFIG_FILE} found in this directory or any parent. Run \`kira init\` first.`,
    );
  }
  const configPath = configPathFor(projectRoot);
  let raw: unknown;
  try {
    raw = parseYaml(readFileSync(configPath, 'utf-8'));
  } catch (error) {
    throw new ConfigError(`${configPath} is not valid YAML: ${String(error)}`);
  }
  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new ConfigError(`${configPath} is invalid:\n${issues}`);
  }
  const config = parsed.data;
  const duplicate = firstDuplicateAreaId(config.areas);
  if (duplicate !== null) {
    throw new ConfigError(`${configPath} declares area id "${duplicate}" more than once.`);
  }
  return {
    config,
    projectRoot,
    sourceRoot: resolve(projectRoot, config.source.root),
    configPath,
  };
}

function firstDuplicateAreaId(areas: readonly Area[]): string | null {
  const seen = new Set<string>();
  for (const area of areas) {
    if (seen.has(area.id)) return area.id;
    seen.add(area.id);
  }
  return null;
}

export function writeConfig(projectRoot: string, config: Config, header?: string): string {
  const configPath = configPathFor(projectRoot);
  mkdirSync(dirname(configPath), { recursive: true });
  const body = stringifyYaml(config, { lineWidth: 100 });
  writeFileSync(configPath, header === undefined ? body : `${header}\n${body}`, 'utf-8');
  return configPath;
}

export function resolveAreaAudience(config: Config, area: Area): Audience {
  return area.audience ?? config.assistant.audience;
}
