import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  type Area,
  type Audience,
  type Config,
  configSchema,
  writeConfig,
} from './config.js';
import { makeSourceFilter } from './extract/scan.js';
import { collectAreaFiles } from './extract/scan.js';

/** Where a framework keeps user-visible pages, most specific first. */
const ROUTE_ROOTS = ['src/app', 'app', 'src/pages', 'pages', 'src/routes', 'routes'];
/** Directories whose children describe product behaviour rather than screens. */
const BEHAVIOUR_ROOTS = ['src/lib', 'src/services', 'src/server', 'src/api', 'src/agents'];
const DOC_ROOTS = ['docs', 'doc', 'documentation'];

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'coverage',
  'components', 'ui', 'utils', 'util', 'helpers', 'hooks', 'styles', 'types', 'test', 'tests',
  '__tests__', '__mocks__', 'assets', 'public', 'fonts', 'images',
]);

/**
 * A page directory is user-facing by construction, so a single file is still a topic someone
 * asks about — a one-file `login/` page owns "how do I reset my password?". Under a behaviour
 * root a lone file is usually a utility, so it needs company to become an area.
 */
const MIN_FILES_ROUTE = 1;
const MIN_FILES_BEHAVIOUR = 2;
const MAX_PROPOSED_AREAS = 24;

type Candidate = {
  id: string;
  name: string;
  audience: Audience;
  route?: string;
  paths: string[];
  minFiles: number;
};

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function childDirectories(absolute: string): string[] {
  try {
    return readdirSync(absolute, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !SKIP_DIRS.has(entry.name))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

const isGroupSegment = (segment: string): boolean =>
  segment.startsWith('(') && segment.endsWith(')');
const isDynamicSegment = (segment: string): boolean =>
  (segment.startsWith('[') && segment.endsWith(']')) || segment.startsWith(':');

function dynamicName(segment: string): string {
  return segment.replace(/^\[+\.*/, '').replace(/\]+$/, '').replace(/^\.\.\./, '').replace(/^:/, '');
}

/** `project/[id]/domains` → `/project/:id/domains`; route groups are not part of the URL. */
function routeFromSegments(segments: readonly string[]): string {
  const parts = segments
    .filter((segment) => !isGroupSegment(segment))
    .map((segment) => (isDynamicSegment(segment) ? `:${dynamicName(segment)}` : segment));
  return `/${parts.join('/')}`;
}

function idFromSegments(segments: readonly string[]): string {
  const words = segments
    .filter((segment) => !isGroupSegment(segment) && !isDynamicSegment(segment))
    .flatMap((segment) => segment.split(/[^a-zA-Z0-9]+/))
    .filter((word) => word !== '')
    .map((word) => word.toLowerCase());
  return words.length === 0 ? 'root' : words.slice(-3).join('-');
}

function nameFromId(id: string): string {
  return id
    .split('-')
    .map((word) => (word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1)))
    .join(' ');
}

/**
 * Walks a routes root and proposes one area per meaningful page directory, descending through
 * route groups and dynamic segments (which are not areas of their own — `[id]` is not a topic).
 */
function proposeRouteAreas(sourceRoot: string, routeRoot: string): Candidate[] {
  const out: Candidate[] = [];
  const walk = (segments: string[], depth: number): void => {
    if (depth > 4) return;
    const absolute = join(sourceRoot, routeRoot, ...segments);
    for (const child of childDirectories(absolute)) {
      const next = [...segments, child];
      const passthrough = isGroupSegment(child) || isDynamicSegment(child);
      if (passthrough) {
        walk(next, depth + 1);
        continue;
      }
      out.push({
        id: idFromSegments(next),
        name: nameFromId(idFromSegments(next)),
        audience: 'end_user',
        route: routeFromSegments(next),
        paths: [`${routeRoot}/${next.join('/')}`],
        minFiles: MIN_FILES_ROUTE,
      });
    }
  };
  walk([], 0);
  return out;
}

function proposeBehaviourAreas(sourceRoot: string, root: string): Candidate[] {
  return childDirectories(join(sourceRoot, root)).map((child) => ({
    id: idFromSegments([child]),
    name: nameFromId(idFromSegments([child])),
    audience: 'operator' as Audience,
    paths: [`${root}/${child}`],
    minFiles: MIN_FILES_BEHAVIOUR,
  }));
}

function dedupeIds(candidates: readonly Candidate[]): Candidate[] {
  const seen = new Map<string, number>();
  return candidates.map((candidate) => {
    const count = seen.get(candidate.id) ?? 0;
    seen.set(candidate.id, count + 1);
    if (count === 0) return candidate;
    const id = `${candidate.id}-${count + 1}`;
    return { ...candidate, id, name: `${candidate.name} (${count + 1})` };
  });
}

export type Proposal = {
  areas: Area[];
  /** Candidates dropped for having too little source to be worth an area. */
  droppedThin: number;
  /** Candidates dropped because the proposal cap was reached. */
  droppedOverCap: number;
  routeRootsFound: string[];
};

export function proposeAreas(sourceRoot: string, config: Config): Proposal {
  const accept = makeSourceFilter(config);
  const candidates: Candidate[] = [];
  const routeRootsFound: string[] = [];

  for (const routeRoot of ROUTE_ROOTS) {
    if (!isDirectory(join(sourceRoot, routeRoot))) continue;
    routeRootsFound.push(routeRoot);
    candidates.push(...proposeRouteAreas(sourceRoot, routeRoot));
    break;
  }
  for (const root of BEHAVIOUR_ROOTS) {
    if (!isDirectory(join(sourceRoot, root))) continue;
    candidates.push(...proposeBehaviourAreas(sourceRoot, root));
  }
  for (const root of DOC_ROOTS) {
    if (!isDirectory(join(sourceRoot, root))) continue;
    candidates.push({
      id: 'docs',
      name: 'Product Documentation',
      audience: 'end_user',
      paths: [root],
      minFiles: MIN_FILES_ROUTE,
    });
    break;
  }

  const sized = dedupeIds(candidates)
    .map((candidate) => ({
      candidate,
      fileCount: collectAreaFiles(
        sourceRoot,
        { id: candidate.id, name: candidate.name, paths: candidate.paths },
        accept,
      ).length,
    }))
    .filter((entry) => entry.fileCount > 0);

  const thin = sized.filter((entry) => entry.fileCount < entry.candidate.minFiles);
  const viable = sized
    .filter((entry) => entry.fileCount >= entry.candidate.minFiles)
    .sort((a, b) => b.fileCount - a.fileCount || a.candidate.id.localeCompare(b.candidate.id));

  const kept = viable.slice(0, MAX_PROPOSED_AREAS);
  return {
    areas: kept
      .map(({ candidate }) => ({
        id: candidate.id,
        name: candidate.name,
        audience: candidate.audience,
        ...(candidate.route === undefined ? {} : { route: candidate.route }),
        paths: candidate.paths,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    droppedThin: thin.length,
    droppedOverCap: Math.max(0, viable.length - kept.length),
    routeRootsFound,
  };
}

const CONFIG_HEADER = `# KIRA — Knowledge Interface for Reliable Answers
#
# \`areas\` below was proposed automatically from this repository's structure. It is a first
# draft and the highest-value thing to edit: an area is a topic a reader would ask about, not
# a directory. Merge what belongs together, drop what has nothing user-facing, and give each
# one a name a reader would recognise.
#
# audience: end_user | operator | developer
# route:    the reader-visible path, with dynamic segments as :name
`;

export function initProject(projectRoot: string, sourceRoot: string): {
  configPath: string;
  proposal: Proposal;
} {
  const base = configSchema.parse({ version: 1 });
  const proposal = proposeAreas(sourceRoot, base);
  const config: Config = { ...base, areas: proposal.areas };
  const configPath = writeConfig(projectRoot, config, CONFIG_HEADER);
  return { configPath, proposal: { ...proposal } };
}

export function relativeIfInside(root: string, path: string): string {
  const rel = relative(root, path);
  return rel === '' ? '.' : rel;
}

export function configExists(projectRoot: string): boolean {
  return existsSync(join(projectRoot, '.kira', 'config.yaml'));
}
