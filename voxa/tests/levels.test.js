// Niveles: el nivel exige Índice y práctica demostrada; las situaciones y lecciones del nivel existen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_PATH, currentLevel, levelOfScenario, levelOfSession, NEEDED } from '../prototype/levels.js';
import { SCENARIOS } from '../prototype/scenarios.js';
import { LESSONS } from '../prototype/lessons.js';
import { LEVELS } from '../prototype/goals.js';

test('cada situación y cada lección pertenece a un solo nivel, y todas existen', () => {
  const all = LEVEL_PATH.flatMap(l => l.scenarios);
  assert.equal(new Set(all).size, all.length);
  assert.deepEqual([...all].sort(), SCENARIOS.map(s => s.id).sort());
  for (const id of LEVEL_PATH.flatMap(l => l.lessons)) assert.ok(LESSONS.some(l => l.id === id), id);
});

test('los umbrales coinciden con los niveles del Índice Talkride', () => {
  assert.deepEqual(LEVEL_PATH.map(l => [l.min, l.name]), [...LEVELS].reverse());
});

test('sin diagnóstico ni prácticas se empieza en Explorador', () => {
  const l = currentLevel({}, []);
  assert.equal(l.n, 1); assert.equal(l.name, 'Explorador'); assert.equal(l.next.name, 'Practicante');
});

test('subir exige Índice y prácticas sólidas; con una sola condición no se sube', () => {
  const diag = (total) => ({ diagnoses: [{ total }] });
  const solid = (scenario, n = NEEDED) => Array.from({ length: n }, () => ({ type: 'evaluacion', scenario, total: 80 }));
  assert.equal(currentLevel(diag(90), []).n, 1);                       // Índice alto, sin práctica
  assert.equal(currentLevel(diag(30), solid('pitch', 10)).n, 1);        // mucha práctica, Índice bajo
  const l = currentLevel(diag(30), solid('passion'));
  assert.equal(l.needsRediagnosis, true);                                // practicó: le toca rehacer el diagnóstico
  assert.equal(currentLevel(diag(60), [...solid('passion'), ...solid('impro')]).n, 3);
  assert.equal(currentLevel(diag(60), solid('impro', 2)).n, 1);          // 2 de 3 no alcanzan
});

test('el roleplay cuenta según su dificultad', () => {
  assert.equal(levelOfSession({ type: 'roleplay', difficulty: 3 }), 4);
  assert.equal(levelOfSession({ type: 'roleplay', difficulty: 1 }), 1);
  assert.equal(levelOfScenario('interview'), 3);
});

test('la práctica del día no salta más de un nivel por encima del tuyo', async () => {
  const { todayTask } = await import('../prototype/plan.js');
  const { levelInfo } = await import('../prototype/levels.js');
  // Día 13 del plan (12 días ya practicados): «Pitch de proyecto», nivel 5. Para un Explorador va una del nivel 2.
  const days = Array.from({ length: 12 }, (_, i) => ({ date: new Date(2026, 0, 1 + i).toISOString(), total: 50 }));
  const explorer = { ...levelInfo(1), n: 1 };
  const t = todayTask(days, explorer);
  assert.match(t.text, /Desafío a tu medida \(nivel 2\)/);
  assert.equal(todayTask(days, { ...levelInfo(4), n: 4 }).href, 'evaluar.html?escenario=pitch');
});
