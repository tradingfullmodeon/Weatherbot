// Diagnóstico inicial y metas: perfil, prioridades, brechas y avance automático de las metas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DIMENSIONS, SELF_ITEMS, computeProfile, measuredFrom, suggestGoals, createGoal, goalProgress, sessionMeets, GOAL_TEMPLATES, levelOf } from '../prototype/goals.js';
import { SCENARIOS } from '../prototype/scenarios.js';
import { LESSONS } from '../prototype/lessons.js';
import { KINDS } from '../prototype/writing.js';

const personaIds = new Set([...readFileSync(new URL('../server/personas.py', import.meta.url), 'utf8').matchAll(/^ {4}"([a-z]+)": \{/gm)].map(m => m[1]));
const allThree = Object.fromEntries(SELF_ITEMS.map(i => [i.dim, 3]));

test('cada dimensión tiene una afirmación y una meta que apunta a contenido real', () => {
  for (const d of DIMENSIONS) {
    assert.ok(SELF_ITEMS.some(i => i.dim === d.id), d.id);
    const t = GOAL_TEMPLATES[d.id];
    assert.ok(t, d.id);
    assert.ok(LESSONS.some(l => l.id === t.lesson), `${d.id}: lección ${t.lesson}`);
    if (t.next.scenario) assert.ok(SCENARIOS.some(s => s.id === t.next.scenario), `${d.id}: ${t.next.scenario}`);
    if (t.next.persona) assert.ok(personaIds.has(t.next.persona), `${d.id}: ${t.next.persona}`);
    if (t.next.kind) assert.ok(KINDS.some(k => k.id === t.next.kind), `${d.id}: ${t.next.kind}`);
  }
});

test('la confianza se puntúa invertida: muchos nervios = puntaje bajo', () => {
  assert.equal(computeProfile({ ...allThree, confianza: 5 }).profile.confianza, 0);
  assert.equal(computeProfile({ ...allThree, confianza: 1 }).profile.confianza, 100);
});

test('el perfil combina lo medido (60%) con la autoevaluación (40%) y detecta puntos ciegos', () => {
  const measured = measuredFrom({ speechItems: [{ key: 'hums', s: 10 }, { key: 'pauses', s: 10 }, { key: 'fillers', s: 10 }], writingScore: 90 });
  const r = computeProfile({ ...allThree, fluidez: 5 }, measured);
  assert.equal(r.profile.fluidez, Math.round(0.6 * 10 + 0.4 * 100));
  assert.equal(r.profile.escritura, Math.round(0.6 * 90 + 0.4 * 50));
  assert.ok(r.gaps.some(g => g.dim === 'fluidez' && g.kind === 'sobre'));
  assert.ok(r.gaps.some(g => g.dim === 'escritura' && g.kind === 'sub'));
  assert.ok(r.priorities.includes('fluidez'));
  assert.ok(r.strengths.includes('escritura'));
  assert.equal(r.level, levelOf(r.total));
});

test('las metas sugeridas salen de las 3 prioridades', () => {
  const r = computeProfile({ ...allThree, voz: 1, escucha: 1, asertividad: 2 });
  assert.deepEqual(suggestGoals(r).map(g => g.dim).sort(), ['asertividad', 'escucha', 'voz']);
});

test('las metas avanzan solas con las prácticas que las cumplen', () => {
  const start = new Date('2026-10-01T10:00:00Z');
  const g = createGoal('fluidez', { days: 30 }, start);
  assert.equal(g.due, '2026-10-31');
  const ok = { type: 'ensayo', date: '2026-10-02T10:00:00Z', total: 70, metrics: { hums: { s: 90 } } };
  const bad = { ...ok, metrics: { hums: { s: 40 } } };
  const before = { ...ok, date: '2026-09-20T10:00:00Z' };
  assert.ok(sessionMeets(g, ok)); assert.ok(!sessionMeets(g, bad));
  let p = goalProgress(g, [ok, bad, before], new Date('2026-10-05T00:00:00Z'));
  assert.equal(p.hits, 1); assert.ok(!p.done && !p.expired);
  p = goalProgress(g, [ok, ok, ok], new Date('2026-10-05T00:00:00Z'));
  assert.ok(p.done); assert.equal(p.ratio, 1);
  assert.ok(goalProgress(g, [], new Date('2026-11-05T00:00:00Z')).expired);
  const rp = createGoal('escucha', {}, start);
  assert.ok(sessionMeets(rp, { type: 'roleplay', date: '2026-10-02', dims: { escucha: 80 } }));
  const w = createGoal('escritura', {}, start);
  assert.ok(sessionMeets(w, { type: 'escritura', date: '2026-10-02', total: 88 }));
});
