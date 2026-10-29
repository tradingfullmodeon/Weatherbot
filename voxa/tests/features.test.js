// Funcionalidades que suben el valor percibido: «Hecho para ti», racha protegida, memoria de personajes y compartir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phraseCounts, FILLER_RE, HEDGE_RE } from '../prototype/shared.js';
import { madeForYou, madeForYouHTML } from '../prototype/foryou.js';
import { streakInfo } from '../prototype/plan.js';
import { orderPersonas, rememberRoleplay, memoryNote } from '../prototype/memory.js';
import { shareStats, shareText } from '../prototype/share.js';

test('qué muletillas y atenuadores dijo, contando «eeeh» como «eh»', () => {
  assert.deepEqual(phraseCounts('Eeeh, o sea, la idea es esta. O sea, eh, vamos.', FILLER_RE), { eh: 2, 'o sea': 2 });
  assert.deepEqual(phraseCounts('Creo que conviene. Tal vez mañana, creo que sí.', HEDGE_RE), { 'creo que': 2, 'tal vez': 1 });
  assert.deepEqual(phraseCounts('', FILLER_RE), {});
});

test('«Hecho para ti» arma ejercicios con los errores propios, sin repetir', () => {
  const s = (said, metrics) => ({ type: 'evaluacion', said, metrics });
  const sessions = [
    s({ fillers: { 'o sea': 2 }, hedges: { 'creo que': 1 } }, { pitch: { s: 40 }, wpm: { s: 90 } }),
    s({ fillers: { 'o sea': 2, este: 1 }, hedges: { 'creo que': 1 } }, { pitch: { s: 50 }, wpm: { s: 95 } }),
  ];
  const d = madeForYou(sessions);
  assert.deepEqual(d.map(x => x.key), ['fillers', 'hedges', 'pitch']);
  assert.match(d[0].title, /«o sea»/); assert.match(d[0].why, /4 veces/);
  assert.match(d[1].how, /Propongo/);
  assert.equal(d[2].href, 'gimnasio.html?ejercicio=sirena');
  assert.match(madeForYouHTML(d), /Hecho para ti/);
  assert.deepEqual(madeForYou([]), []);
  // Sin errores frecuentes ni métricas bajas, no inventa ejercicios.
  assert.deepEqual(madeForYou([s({ fillers: { este: 1 } }, { wpm: { s: 95 } })]), []);
});

test('racha: un día de descanso cada 7 no la corta; dos seguidos sí', () => {
  const at = (iso) => ({ date: `${iso}T10:00:00` });
  const today = new Date('2026-10-20T20:00:00');
  // Practicó 12–18, descansó el 19, hoy 20 practicó: 8 días con el 19 protegido.
  const s1 = ['12', '13', '14', '15', '16', '17', '18', '20'].map(d => at(`2026-10-${d}`));
  assert.deepEqual(streakInfo(s1, today), { days: 8, rested: ['2026-10-19'] });
  // Dos días seguidos sin práctica: la racha vuelve a contar desde hoy.
  const s2 = ['15', '16', '17', '20'].map(d => at(`2026-10-${d}`));
  assert.equal(streakInfo(s2, today).days, 1);
  // Un segundo descanso dentro de la misma semana no se regala.
  const s3 = ['14', '16', '17', '18', '20'].map(d => at(`2026-10-${d}`));
  assert.deepEqual(streakInfo(s3, today), { days: 4, rested: ['2026-10-19'] });
});

test('personajes según la meta y memoria entre sesiones', () => {
  const ps = ['reclutadora', 'jefe', 'cliente', 'colaborador', 'malanoticia'].map(id => ({ id, name: id }));
  assert.deepEqual(orderPersonas(ps, 'liderazgo').map(p => p.id).slice(0, 3), ['colaborador', 'malanoticia', 'jefe']);
  assert.deepEqual(orderPersonas(ps, '').map(p => p.id), ps.map(p => p.id));
  const profile = {};
  const now = new Date('2026-10-20T12:00:00');
  rememberRoleplay(profile, 'jefe', { next: 'Cierra con un pedido concreto y una fecha.', total: 68 }, new Date('2026-10-17T12:00:00'));
  const note = memoryNote(profile, { id: 'jefe', name: 'Ricardo' }, now);
  assert.match(note.html, /hace 3 días.*68.*Cierra con un pedido/);
  assert.match(note.context, /Cierra con un pedido concreto/);
  assert.equal(memoryNote(profile, { id: 'cliente', name: 'Patricia' }, now), null);
  assert.equal(memoryNote(profile, { id: 'jefe', name: 'Ricardo' }, new Date('2027-01-30T12:00:00')), null);
});

test('compartir: sólo Índice, racha y prácticas', () => {
  const st = shareStats({ diagnoses: [{ total: 52, level: 'Practicante' }, { total: 64, level: 'Competente' }] }, [{}, {}, {}], 5);
  assert.deepEqual(st, { index: 64, level: 'Competente', delta: 12, streak: 5, practices: 3 });
  assert.equal(shareText(st), 'Mi Índice VOXA es 64 (Competente): subí 12 puntos desde mi primer diagnóstico. Llevo 5 días seguidos practicando. 3 prácticas para comunicarme con más seguridad con VOXA.');
  assert.equal(shareText(shareStats({}, [{}], 0)), '1 práctica para comunicarme con más seguridad con VOXA.');
});
