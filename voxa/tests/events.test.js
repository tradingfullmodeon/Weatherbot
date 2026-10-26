// Pruebas del modo «evento real»: reparto del plan, prácticas que existen y práctica del día.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EVENT_TYPES, buildEventPlan, createEvent, nextEventPractice, daysUntil, validEvent } from '../prototype/events.js';
import { SCENARIOS } from '../prototype/scenarios.js';
import { LESSONS } from '../prototype/lessons.js';
import { KINDS } from '../prototype/writing.js';

const personas = new Set([...readFileSync(new URL('../server/personas.py', import.meta.url), 'utf8').matchAll(/^ {4}"([a-z]+)": \{/gm)].map(m => m[1]));
const exercises = new Set(['sostener', 'sirena', 'proyeccion', 'trabalenguas', 'pausas']);
const day = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const TODAY = new Date('2026-11-02T10:00:00');

test('cada práctica y lección de los eventos existe', () => {
  for (const [id, t] of Object.entries(EVENT_TYPES)) {
    assert.ok(t.questions.length >= 3, id);
    for (const p of t.practices) {
      if (p.view === 'evaluar') assert.ok(SCENARIOS.some(s => s.id === p.scenario), `${id}: ${p.scenario}`);
      else if (p.view === 'roleplay') assert.ok(personas.has(p.persona), `${id}: ${p.persona}`);
      else if (p.view === 'gimnasio') assert.ok(exercises.has(p.exercise), `${id}: ${p.exercise}`);
      else if (p.view === 'escritura') assert.ok(KINDS.some(k => k.id === p.kind), `${id}: ${p.kind}`);
      else assert.fail(`${id}: vista ${p.view}`);
      if (p.lesson) assert.ok(LESSONS.some(l => l.id === p.lesson), `${id}: lección ${p.lesson}`);
    }
  }
});

test('con una semana, el plan se reparte antes del evento y en orden', () => {
  const plan = buildEventPlan({ type: 'entrevista', date: day(TODAY, 7) }, TODAY);
  assert.equal(plan.length, EVENT_TYPES.entrevista.practices.length);
  const dates = plan.map(p => p.date);
  assert.deepEqual([...dates].sort(), dates);
  assert.equal(dates[0], day(TODAY, 0));
  assert.ok(dates.every(d => d < day(TODAY, 7)));
  assert.ok(new Set(dates).size >= 5, 'reparte en varios días');
});

test('si el evento es mañana u hoy, arma un plan intensivo de 3 prácticas para hoy', () => {
  for (const n of [0, 1]) {
    const plan = buildEventPlan({ type: 'presentacion', date: day(TODAY, n) }, TODAY);
    assert.equal(plan.length, 3);
    assert.ok(plan.every(p => p.date === day(TODAY, 0)));
  }
});

test('con 3 días, prioriza las primeras prácticas sin pasarse de la víspera', () => {
  const plan = buildEventPlan({ type: 'entrevista', date: day(TODAY, 3) }, TODAY);
  assert.equal(plan.length, 6);
  assert.ok(plan.every(p => p.date <= day(TODAY, 2)));
  assert.equal(plan[0].text, EVENT_TYPES.entrevista.practices[0].text);
});

test('la práctica del día salta lo hecho y muestra lo atrasado', () => {
  const ev = createEvent({ type: 'pitch', date: day(TODAY, 6) }, TODAY);
  assert.equal(nextEventPractice(ev, TODAY).index, 0);
  ev.done[0] = true;
  const later = new Date(TODAY); later.setDate(later.getDate() + 3);
  const next = nextEventPractice(ev, later);
  assert.equal(next.index, 1, 'la segunda práctica, aunque esté atrasada');
  ev.plan.forEach((_, i) => { ev.done[i] = true; });
  assert.equal(nextEventPractice(ev, later), null);
});

test('daysUntil y validEvent', () => {
  assert.equal(daysUntil(day(TODAY, 5), TODAY), 5);
  assert.equal(daysUntil(day(TODAY, -1), TODAY), -1);
  assert.ok(validEvent({ type: 'reunion', date: '2026-12-01' }));
  assert.ok(!validEvent({ type: 'boda', date: '2026-12-01' }));
  assert.ok(!validEvent({ type: 'reunion', date: 'mañana' }));
});
