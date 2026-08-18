import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const FENCE = '---';

export type SplitDocument = { frontmatter: unknown; body: string };

export class FrontmatterError extends Error {}

/**
 * Splits `---\n<yaml>\n---\n<body>`. The closing fence must be a line of its own so that
 * `---` inside the YAML or the body is not mistaken for it.
 */
export function splitFrontmatter(content: string): SplitDocument {
  const normalized = content.replace(/^﻿/, '');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== FENCE) {
    throw new FrontmatterError('document does not start with a `---` frontmatter fence');
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === FENCE) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw new FrontmatterError('frontmatter fence is never closed');
  }
  const yamlText = lines.slice(1, end).join('\n');
  // Trimmed at both ends: a fact's body is content, not the file's formatting whitespace,
  // which also makes serialize → split byte-exact.
  const body = lines.slice(end + 1).join('\n').replace(/^\n+/, '').trimEnd();
  let frontmatter: unknown;
  try {
    frontmatter = parseYaml(yamlText);
  } catch (error) {
    throw new FrontmatterError(`frontmatter is not valid YAML: ${String(error)}`);
  }
  return { frontmatter, body };
}

export function serializeDocument(frontmatter: unknown, body: string): string {
  const yamlText = stringifyYaml(frontmatter, { lineWidth: 100 }).trimEnd();
  return `${FENCE}\n${yamlText}\n${FENCE}\n\n${body.trim()}\n`;
}
