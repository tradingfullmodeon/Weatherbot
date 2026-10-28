// Textos del plan: honestos, con lo que queda y con un camino claro cuando se acaba el cupo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planLine, remainingHTML, upgradeHTML, daysLeft, BILLING_TERMS, ALWAYS_FREE } from '../prototype/plan-pro.js';

const NOW = Date.UTC(2026, 9, 28);
const remaining = { feedback: 12, roleplay: 70, evaluate: 5, writing: 6, event: 2 };

test('la prueba dice cuántos días y consejos quedan', () => {
  const me = { plan: 'prueba', until: NOW / 1000 + 5 * 86400 - 60, remaining };
  assert.equal(daysLeft(me.until, NOW), 5);
  assert.equal(planLine(me, NOW), 'Prueba del coach IA: te quedan 5 días · 12 consejos disponibles');
  assert.match(planLine({ ...me, until: NOW / 1000 + 3600 }, NOW), /te queda 1 día/);
  assert.match(remainingHTML(me), /<strong>70<\/strong> turnos de roleplay/);
});

test('gratis y Pro se explican sin letra chica', () => {
  assert.match(planLine({ plan: 'gratis', remaining }), /todo el análisis de tu práctica/);
  assert.equal(remainingHTML({ plan: 'gratis', remaining }), '');
  assert.match(planLine({ plan: 'pro', until: null, remaining }), /^Plan Pro activo$/);
  assert.ok(BILLING_TERMS.some(t => /3 días antes/.test(t)) && BILLING_TERMS.some(t => /14 días.*Apple/.test(t)));
  assert.ok(ALWAYS_FREE.length >= 4);
});

test('sólo el cupo agotado (402) ofrece pasar a Pro', () => {
  assert.match(upgradeHTML({ status: 402 }), /href="pro.html"/);
  assert.equal(upgradeHTML({ status: 502 }), '');
  assert.equal(upgradeHTML(new Error('x')), '');
});
