import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dedupeSlugs, normalizeFact, slugify, type ApiFact } from './result.js';

function apiFact(overrides: Partial<ApiFact> = {}): ApiFact {
  return {
    slug: 'connect-existing-domain',
    type: 'workflow',
    title: 'Connect a domain you already own',
    summary: 'Point an existing domain at your project.',
    body: 'Open Project settings → Domains…',
    route: '/project/:id/domains',
    requires_plan: [],
    requires_role: [],
    sources: ['src/app/domains/page.tsx'],
    confidence: 'high',
    ...overrides,
  };
}

test('empty placeholders become absent fields rather than empty values', () => {
  const fact = normalizeFact(
    apiFact({ route: '', requires_plan: [''], requires_role: [] }),
    ['src/app/domains/page.tsx'],
  );
  assert.ok(fact);
  assert.equal(fact.route, undefined);
  assert.equal(fact.requires, undefined);
});

test('a gate is kept only for the levels the model actually filled in', () => {
  const fact = normalizeFact(
    apiFact({ requires_plan: ['pro', 'business'], requires_role: [] }),
    ['src/app/domains/page.tsx'],
  );
  assert.deepEqual(fact?.requires, { plan: ['pro', 'business'] });
});

test('sources are restricted to files the batch actually contained', () => {
  const fact = normalizeFact(
    apiFact({ sources: ['src/app/domains/page.tsx', 'src/invented/file.ts'] }),
    ['src/app/domains/page.tsx'],
  );
  assert.deepEqual(fact?.sources, ['src/app/domains/page.tsx']);
});

test('a malformed slug is repaired from the title instead of failing the batch', () => {
  const fact = normalizeFact(apiFact({ slug: 'Connect Existing Domain!' }), []);
  assert.equal(fact?.slug, 'connect-a-domain-you-already-own');
});

test('a fact missing its substance is dropped', () => {
  assert.equal(normalizeFact(apiFact({ body: '   ' }), []), null);
});

test('slugify produces a safe filename stem', () => {
  assert.equal(slugify('Can I *transfer* a domain?'), 'can-i-transfer-a-domain');
  assert.equal(slugify('!!!'), 'fact');
});

test('duplicate slugs are made unique, since the slug is the filename', () => {
  const facts = dedupeSlugs([
    { slug: 'domains', type: 'feature', title: 'A', summary: 'a', body: 'a', sources: [], confidence: 'high' },
    { slug: 'domains', type: 'feature', title: 'B', summary: 'b', body: 'b', sources: [], confidence: 'high' },
    { slug: 'domains', type: 'feature', title: 'C', summary: 'c', body: 'c', sources: [], confidence: 'high' },
  ]);
  assert.deepEqual(facts.map((fact) => fact.slug), ['domains', 'domains-2', 'domains-3']);
});
