// Calificaciones: promedio comparable con las tiendas, NPS y momento para pedir la calificación.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ratingSummary, shouldAskRating } from '../prototype/feedback.js';

test('resumen: promedio de estrellas, distribución y NPS', () => {
  const s = ratingSummary([{ stars: 5, nps: 10, features: ['roleplay'] }, { stars: 4, nps: 8 }, { stars: 2, nps: 3, features: ['roleplay'] }, { stars: 9 }]);
  assert.equal(s.n, 3);
  assert.ok(Math.abs(s.avg - 11 / 3) < 1e-9);
  assert.deepEqual(s.dist, [0, 1, 0, 1, 1]);
  assert.equal(s.nps, 0);          // 1 promotor, 1 pasivo, 1 detractor
  assert.equal(s.feats.roleplay, 2);
  assert.equal(ratingSummary([]).avg, null);
});

test('se pide calificar después de 3 prácticas y como mucho una vez al mes', () => {
  const three = [{ date: '2026-10-20' }, { date: '2026-10-20' }, { date: '2026-10-21' }], now = new Date('2026-10-27').getTime();
  assert.ok(!shouldAskRating({}, [{ date: '2026-10-20' }, { date: '2026-10-20' }, { date: '2026-10-20' }], now));   // todo el mismo día: aún no
  assert.ok(!shouldAskRating({}, three.slice(0, 2), now));
  assert.ok(shouldAskRating({}, three, now));
  assert.ok(!shouldAskRating({ rating: { date: '2026-10-20' } }, three, now));
  assert.ok(!shouldAskRating({ ratingDismissed: '2026-10-20' }, three, now));
  assert.ok(shouldAskRating({ rating: { date: '2026-09-01' } }, three, now));
});

test('cuidado: detecta mensajes de crisis en el dispositivo y nervios máximos sostenidos', async () => {
  const { isCrisis, persistentHighAnxiety, HELP_LINES } = await import('../prototype/help.js');
  assert.ok(isCrisis('A veces siento que no quiero vivir más'));
  assert.ok(isCrisis('Pienso en hacerme daño'));
  assert.ok(!isCrisis('Me muero de nervios antes de la entrevista'));
  assert.ok(!isCrisis('Quiero vivir en otro país'));
  assert.ok(isCrisis('Me quiero matar')); assert.ok(isCrisis('a veces me corto los brazos')); assert.ok(!isCrisis('Me corto el pelo mañana'));
  assert.ok(persistentHighAnxiety([{ anxietyBefore: 5 }, { anxietyBefore: 5 }, { anxietyBefore: 5 }]));
  assert.ok(!persistentHighAnxiety([{ anxietyBefore: 5 }, { anxietyBefore: 3 }, { anxietyBefore: 5 }]));
  assert.ok(HELP_LINES.length >= 6);
});
