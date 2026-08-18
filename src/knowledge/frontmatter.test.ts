import assert from 'node:assert/strict';
import { test } from 'node:test';
import { serializeDocument, splitFrontmatter, FrontmatterError } from './frontmatter.js';

test('a document round-trips through serialize and split', () => {
  const frontmatter = { id: 'a/b', title: 'Title: with a colon', sources: ['src/a.ts'] };
  const body = 'First line.\n\nSecond paragraph with a --- inside it.';
  const { frontmatter: parsed, body: parsedBody } = splitFrontmatter(
    serializeDocument(frontmatter, body),
  );
  assert.deepEqual(parsed, frontmatter);
  assert.equal(parsedBody, body);
});

test('the closing fence must be a line of its own', () => {
  const document = '---\nid: a/b\n---\nBody with --- mid-line and a trailing fence-like text.';
  const { body } = splitFrontmatter(document);
  assert.match(body, /^Body with/);
});

test('a missing opening fence is an error, not a silent empty parse', () => {
  assert.throws(() => splitFrontmatter('id: a/b\nBody'), FrontmatterError);
});

test('an unclosed fence is an error', () => {
  assert.throws(() => splitFrontmatter('---\nid: a/b\nBody'), FrontmatterError);
});
