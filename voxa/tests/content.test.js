// Pruebas de integridad del contenido: escenarios, lecciones y plan apuntan a cosas que existen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCENARIOS, GROUPS, methodHelp } from '../prototype/scenarios.js';
import { LESSONS, LESSON_FOR_METRIC, LESSON_SOURCES } from '../prototype/lessons.js';
import { SPRINT } from '../prototype/plan.js';
import { KINDS } from '../prototype/writing.js';

const scenarioIds = new Set(SCENARIOS.map(s => s.id));
// Los personajes viven en el servidor (Python); se leen sus ids del archivo.
const personaIds = new Set([...readFileSync(new URL('../server/personas.py', import.meta.url), 'utf8').matchAll(/^ {4}"([a-z]+)": \{/gm)].map(m => m[1]));
const exercises = new Set(['sostener', 'sirena', 'proyeccion', 'trabalenguas', 'pausas']);

test('escenarios: ids únicos, pesos que suman 1 y duraciones razonables', () => {
  assert.equal(scenarioIds.size, SCENARIOS.length);
  for (const s of SCENARIOS) {
    const sum = Object.values(s.weights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${s.id}: pesos suman ${sum}`);
    assert.ok(s.seconds >= 30 && s.seconds <= 180, s.id);
    assert.ok(GROUPS.includes(s.group));
  }
});

test('los métodos principales tienen explicación en lenguaje simple', () => {
  for (const m of ['STAR', 'PREP', 'BLUF / Pirámide de Minto', 'SBI + CNV', 'Monroe / SCQA']) assert.ok(methodHelp(m).length > 20, m);
});

test('personajes: se leyeron los 9 del servidor', () => {
  assert.deepEqual([...personaIds].sort(), ['cliente', 'colaborador', 'colega', 'finanzas', 'inversionista', 'jefe', 'malanoticia', 'networking', 'reclutadora']);
});

test('lecciones: completas, con repaso válido y práctica que existe', () => {
  const ids = new Set();
  for (const l of LESSONS) {
    assert.ok(!ids.has(l.id), 'id repetido ' + l.id); ids.add(l.id);
    assert.ok(l.steps.length >= 3 && l.mistakes.length >= 2 && l.bad && l.good, l.id);
    assert.ok(l.quiz.answer >= 0 && l.quiz.answer < l.quiz.options.length, l.id);
    const p = l.practice;
    if (p.view === 'evaluar') assert.ok(scenarioIds.has(p.scenario), `${l.id} → ${p.scenario}`);
    else if (p.view === 'roleplay') assert.ok(personaIds.has(p.persona), `${l.id} → ${p.persona}`);
    else if (p.view === 'gimnasio') assert.ok(exercises.has(p.exercise), `${l.id} → ${p.exercise}`);
    else if (p.view === 'escritura') assert.ok(KINDS.some(k => k.id === p.kind), `${l.id} → ${p.kind}`);
    else assert.fail(`${l.id}: vista desconocida ${p.view}`);
  }
  for (const [metric, id] of Object.entries(LESSON_FOR_METRIC)) assert.ok(ids.has(id), `${metric} → ${id}`);
});

test('plan de 30 días: 4 semanas de 7 tareas y cada enlace apunta a algo que existe', () => {
  assert.equal(SPRINT.length, 4);
  for (const w of SPRINT) {
    assert.equal(w.tasks.length, 7, w.week);
    for (const { href } of w.tasks) {
      const url = new URL(href, 'https://voxa.local/');
      const page = url.pathname.slice(1);
      assert.ok(['evaluar.html', 'roleplay.html', 'gimnasio.html', 'escritura.html', 'progreso.html'].includes(page), href);
      const q = url.searchParams;
      if (q.get('escenario')) assert.ok(scenarioIds.has(q.get('escenario')), href);
      if (q.get('personaje')) assert.ok(personaIds.has(q.get('personaje')), href);
      if (q.get('ejercicio')) assert.ok(exercises.has(q.get('ejercicio')), href);
      if (q.get('tipo')) assert.ok(KINDS.some(k => k.id === q.get('tipo')), href);
    }
  }
});

test('cada lección cita la base de su método', () => {
  for (const l of LESSONS) assert.ok(LESSON_SOURCES[l.id], l.id);
});
