// Idiomas de práctica: reconocimiento de voz, muletillas, estructura y escritura fuera del español.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speechLocaleFor, practiceLangOf, PRACTICE_LANGS } from '../prototype/lang.js';
import { fillerReFor, hedgeReFor, countMatches } from '../prototype/shared.js';
import { checkStructure } from '../prototype/structure.js';
import { analyzeWriting, assertivenessOf, KINDS } from '../prototype/writing.js';

test('español: sólo Latinoamérica, con el país del dispositivo para reconocer mejor la voz', () => {
  assert.equal(PRACTICE_LANGS[0].label, 'Español (Latinoamérica)');
  assert.equal(speechLocaleFor('es', ['es-CL']), 'es-CL');
  assert.equal(speechLocaleFor('es', ['es-AR', 'en-US']), 'es-AR');
  assert.equal(speechLocaleFor('es', ['es-ES']), 'es-MX');     // fuera de la región: la variante con más soporte
  assert.equal(speechLocaleFor('es', []), 'es-MX');             // nunca «es-419», que no aceptan todos los motores
  assert.equal(speechLocaleFor('pt', ['pt-PT']), 'pt-BR');
  assert.equal(speechLocaleFor('en', ['en-GB']), 'en-GB');
  assert.equal(speechLocaleFor('de', ['fr-FR']), 'de-DE');
});

test('los perfiles anteriores (sólo variante de español) siguen en español', () => {
  assert.equal(practiceLangOf({ locale: 'es-US' }), 'es');
  assert.equal(practiceLangOf({ lang: 'fr' }), 'fr');
  assert.equal(practiceLangOf({ lang: 'xx' }), 'es');
});

test('muletillas en cada idioma, sin contar los usos normales de la palabra', () => {
  assert.equal(countMatches('Um, so, I mean, it was, like, basically fine, you know.', fillerReFor('en')), 5);
  assert.equal(countMatches('I like coffee and I mean what I say about the plan.', fillerReFor('en')), 1);   // «I mean» sí
  assert.equal(countMatches('Então, tipo, eu acho que foi bom, né?', fillerReFor('pt')), 3);
  assert.equal(countMatches('Euh, en fait, du coup on a fini.', fillerReFor('fr')), 3);
  assert.equal(countMatches('Also, ähm, das war halt so.', fillerReFor('de')), 3);
  assert.equal(countMatches('Allora, ehm, cioè, abbiamo finito.', fillerReFor('it')), 3);
  assert.equal(countMatches('I think maybe we could, sort of, try again.', hedgeReFor('en')), 3);
});

test('estructura STAR y PREP en inglés y portugués', () => {
  const star = checkStructure('In my previous job, when our team missed deadlines, I had to fix the process. I created a shared board and I led weekly reviews. As a result we reduced delays by 40%.', 'STAR', { lang: 'en' });
  assert.equal(star.score, 100);
  assert.match(star.parts[0].tip, /In my last job/);   // los ejemplos del consejo van en el idioma de práctica
  const prep = checkStructure('Minha proposta é contratar a Ana. Porque ela entrega resultados. Por exemplo, no ano passado ela aumentou as vendas em 30%. Por isso recomendo a Ana.', 'PREP', { lang: 'pt' });
  assert.equal(prep.score, 100);
});

test('escritura en inglés: pedido, plazo, disculpas y legibilidad', () => {
  const k = KINDS.find(x => x.id === 'pedido');
  const good = analyzeWriting('Hi Carolina, could you review the report before Thursday at 12? I need it for the client meeting. Thanks.', k, 'en');
  assert.equal(good.score, 100);
  const weak = analyzeWriting('Sorry to bother you, I was wondering if maybe you could look at this whenever you can.', k, 'en');
  assert.ok(weak.score < 60);
  assert.ok(!weak.checks.some(c => /«¡»/.test(c.msg)));   // la regla del «¡» es sólo del español
  assert.ok(assertivenessOf('Could you send me the file today?', 'en') > assertivenessOf('Sorry to bother you, I was wondering if you could maybe send it.', 'en'));
});
