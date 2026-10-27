// Diagnóstico inicial y metas: perfil, prioridades, brechas y avance automático de las metas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { goalOfTheDay, DIMENSIONS, SELF_ITEMS, computeProfile, measuredFrom, suggestGoals, createGoal, goalProgress, sessionMeets, GOAL_TEMPLATES, levelOf } from '../prototype/goals.js';
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
  // El mismo intento repetido el mismo día cuenta una sola vez.
  assert.equal(goalProgress(g, [ok, ok, ok], new Date('2026-10-05T00:00:00Z')).hits, 1);
  const days = [2, 3, 4].map(d => ({ ...ok, date: `2026-10-0${d}T15:00:00Z` }));
  p = goalProgress(g, days, new Date('2026-10-05T00:00:00Z'));
  assert.ok(p.done); assert.equal(p.ratio, 1);
  // Un texto corto sin atenuadores no prueba asertividad.
  const a = createGoal('asertividad', {}, start);
  assert.ok(!sessionMeets(a, { type: 'ensayo', date: '2026-10-02', words: 5, metrics: { hedges: { s: 100 } } }));
  assert.ok(sessionMeets(a, { type: 'ensayo', date: '2026-10-02', words: 80, metrics: { hedges: { s: 100 } } }));
  assert.ok(goalProgress(g, [], new Date('2026-11-05T00:00:00Z')).expired);
  const rp = createGoal('escucha', {}, start);
  assert.ok(sessionMeets(rp, { type: 'roleplay', date: '2026-10-02', dims: { escucha: 80 } }));
  const w = createGoal('escritura', {}, start);
  assert.ok(sessionMeets(w, { type: 'escritura', date: '2026-10-02', total: 88 }));
});

test('una meta de 30 días muestra 30 días restantes el día en que se crea', () => {
  const now = new Date(2026, 9, 27, 21, 30);
  const g = createGoal('voz', { days: 30 }, now);
  assert.equal(goalProgress(g, [], now).daysLeft, 30);
});

test('la práctica del día rota entre las metas activas y omite las cumplidas', () => {
  const now = new Date(2026, 9, 27, 12);
  const a = createGoal('voz', {}, now), b = createGoal('escritura', {}, new Date(2026, 9, 20));
  const done = [1, 2, 3].map(i => ({ type: 'escritura', date: new Date(2026, 9, 24 + i, 13).toISOString(), total: 90 }));
  assert.equal(goalOfTheDay([], [], now), null);
  assert.equal(goalOfTheDay([a, b], done, new Date(2026, 9, 27, 18)).goal.dim, 'voz');
  const days = new Set([0, 1, 2, 3].map(d => goalOfTheDay([a, b], [], new Date(2026, 9, 28 + d, 12)).goal.dim));
  assert.deepEqual([...days].sort(), ['escritura', 'voz']);
});

test('el plan de 30 días avanza con los días practicados, no con el calendario', async () => {
  const { sprintDay } = await import('../prototype/plan.js');
  const ago = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString(); };
  // Practicó hace 10 días y hace 2 (faltó 7 días entremedio): va en el día 3 del plan, no en el 11.
  assert.equal(sprintDay([{ date: ago(10) }, { date: ago(2) }, { date: ago(2) }]), 2);
  assert.equal(sprintDay([{ date: ago(0) }]), 0);
});
