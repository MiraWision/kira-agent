import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeMatcher } from './glob.js';

test('** spans any number of segments, including none', () => {
  const match = makeMatcher(['**/*.ts']);
  assert.equal(match('index.ts'), true);
  assert.equal(match('src/index.ts'), true);
  assert.equal(match('src/a/b/index.ts'), true);
  assert.equal(match('index.tsx'), false);
});

test('* stays inside one segment', () => {
  const match = makeMatcher(['src/*.ts']);
  assert.equal(match('src/index.ts'), true);
  assert.equal(match('src/a/index.ts'), false);
});

test('directory excludes match at any depth', () => {
  const match = makeMatcher(['**/node_modules/**']);
  assert.equal(match('node_modules/pkg/index.js'), true);
  assert.equal(match('apps/web/node_modules/pkg/index.js'), true);
  assert.equal(match('src/index.ts'), false);
});

test('dots are literal, not wildcards', () => {
  const match = makeMatcher(['**/*.test.*']);
  assert.equal(match('src/a.test.ts'), true);
  assert.equal(match('src/atestts'), false);
});
