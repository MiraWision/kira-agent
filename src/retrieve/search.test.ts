import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Fact } from '../knowledge/schema.js';
import { passesGate, retrieve, selectDiverse } from './search.js';
import { routeRelation } from './route.js';

function fact(overrides: Partial<Fact>): Fact {
  return {
    id: 'area/slug',
    area: 'area',
    type: 'feature',
    audience: 'end_user',
    title: 'Title',
    summary: 'Summary',
    body: 'Body',
    sources: [],
    extracted: { at: '2026-01-01', model: 'm', area_hash: 'h' },
    confidence: 'high',
    file: '.knowledge/area/slug.md',
    ...overrides,
  } as Fact;
}

test('route patterns match dynamic segments and report the relation', () => {
  assert.equal(routeRelation('/project/:id/domains', '/project/42/domains'), 'exact');
  assert.equal(routeRelation('/project/:id', '/project/42/domains'), 'ancestor');
  assert.equal(routeRelation('/project/:id/domains', '/project/42'), 'descendant');
  assert.equal(routeRelation('/settings', '/project/42'), 'none');
});

test('an unknown reader context never hides a gated fact', () => {
  const requires = { plan: ['pro'] };
  assert.equal(passesGate(requires, { audience: 'end_user' }), true);
  assert.equal(passesGate(requires, { audience: 'end_user', plan: 'free' }), false);
  assert.equal(passesGate(requires, { audience: 'end_user', plan: 'pro' }), true);
});

test('developer facts stay out of an end-user answer', () => {
  const facts = [
    fact({ id: 'a/one', title: 'Connect a domain', audience: 'end_user' }),
    fact({ id: 'a/two', title: 'Connect a domain', audience: 'developer' }),
  ];
  const hits = retrieve(facts, 'connect a domain', { audience: 'end_user' });
  assert.deepEqual(hits.map((hit) => hit.fact.id), ['a/one']);
});

test('low-confidence facts are quarantined unless asked for', () => {
  const facts = [fact({ id: 'a/low', title: 'Delete a project', confidence: 'low' })];
  assert.equal(retrieve(facts, 'delete a project', { audience: 'end_user' }).length, 0);
  assert.equal(
    retrieve(facts, 'delete a project', { audience: 'end_user', includeLow: true }).length,
    1,
  );
});

test('the current screen reorders otherwise comparable facts', () => {
  const facts = [
    fact({ id: 'a/billing', title: 'Remove a payment method', route: '/billing' }),
    fact({ id: 'a/domains', title: 'Remove a domain', route: '/project/:id/domains' }),
  ];
  const hits = retrieve(facts, 'remove', { audience: 'end_user', route: '/project/42/domains' });
  assert.equal(hits[0]?.fact.id, 'a/domains');
});

test('diversity drops a fact that restates one already selected', () => {
  const repeated = { fact: fact({ id: 'a/one' }), score: 2, routeRelation: 'none' as const };
  const same = { fact: fact({ id: 'a/two' }), score: 1, routeRelation: 'none' as const };
  const different = {
    fact: fact({ id: 'a/three', title: 'Invite a teammate', summary: 'Send an invitation', body: 'Open members and invite' }),
    score: 0.5,
    routeRelation: 'none' as const,
  };
  const selected = selectDiverse([repeated, same, different], 5);
  assert.deepEqual(selected.map((entry) => entry.fact.id), ['a/one', 'a/three']);
});
