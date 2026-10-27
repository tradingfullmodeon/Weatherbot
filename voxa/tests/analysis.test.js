// Pruebas del motor de análisis de VOXA (voz, texto y contenido). Ejecutar: cd voxa && node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { FILLER_RE, HEDGE_RE, countMatches, wordCount, detectPitch, findFilledPauses, highlight } from '../prototype/shared.js';
import { KINDS, analyzeWriting, fernandezHuerta } from '../prototype/writing.js';

// ---------------------------------------------------------------- muletillas y atenuadores
test('muletillas: cuenta el relleno y no las palabras normales', () => {
  const cases = [
    ['Este informe está listo.', 0], ['Este, la idea es simple.', 1], ['este eh vamos a ver', 2],
    ['Es bueno que vengas.', 0], ['Bueno, empecemos.', 1], ['Vale la pena intentarlo.', 0],
    ['Lo hacemos mañana, ¿vale?', 1], ['Este tipo de cliente es difícil.', 0], ['Es como, tipo, raro.', 1],
    ['¿Viste la película?', 0], ['Estaba nervioso, ¿viste?', 1], ['O sea, eeeh, no sé.', 2],
    ['Ya po, vamos.', 1], ['Él es Emma y estudia esto.', 0], ['En plan, literalmente lo hicimos.', 2],
    ['Este es el plan para el trimestre.', 0], ['Este no es el informe correcto.', 0], ['Es un tipo que sabe mucho.', 0],
    ['El resultado es bueno.', 0], ['¿Ya lo sabes?', 0], ['Lo hicimos, pues era necesario.', 0],
    ['Y, bueno, seguimos.', 1], ['Me gustó, ¿sabes?', 1], ['Pues, mira, no sé.', 1],
  ];
  for (const [text, n] of cases) assert.equal(countMatches(text, FILLER_RE), n, text);
});

test('atenuadores: detecta las frases que restan seguridad', () => {
  assert.equal(countMatches('Creo que tal vez podríamos, un poquito, revisar.', HEDGE_RE), 3);
  assert.equal(countMatches('Propongo revisar el plan el jueves.', HEDGE_RE), 0);
});

test('highlight escapa HTML y marca muletillas', () => {
  const html = highlight('<b>o sea</b>');
  assert.ok(html.includes('&lt;b&gt;'));
  assert.ok(html.includes('<mark class="filler">o sea</mark>'));
});

test('wordCount cuenta palabras con tildes y ñ', () => {
  assert.equal(wordCount('Mañana, ¿podrías revisar el diseño?'), 5);
});

// ---------------------------------------------------------------- tono
function harmonic(f0, sr, n = 1024) {
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) for (let k = 1; k <= 6; k++) x[i] += Math.sin(2 * Math.PI * f0 * k * i / sr) / k;
  return x;
}

test('detectPitch encuentra la fundamental sin confundirla con su octava', () => {
  for (const [f0, sr] of [[110, 16000], [150, 16000], [220, 48000], [300, 48000]]) {
    const got = detectPitch(harmonic(f0, sr, sr === 48000 ? 2048 : 1024), sr);
    assert.ok(Math.abs(got - f0) / f0 < 0.03, `${f0} Hz @ ${sr}: obtuvo ${got.toFixed(1)}`);
  }
});

test('detectPitch devuelve 0 en ruido', () => {
  const x = new Float32Array(1024).map(() => Math.random() * 2 - 1);
  assert.equal(detectPitch(x, 16000), 0);
});

// ---------------------------------------------------------------- sonidos de duda («eeeh»)
function synthSamples() {
  const fps = 60, out = []; let t = 0;
  const push = (dur, f, rms = 0.05) => { for (let i = 0; i < dur * fps; i++, t += 1 / fps) out.push({ t, rms, pitch: f(i / fps) }); };
  const speech = (secs) => { for (let k = 0; k < Math.round(secs / 0.2); k++) { const b = 140 + 40 * Math.sin(k * 1.3); push(0.15, s => b * (1 + 0.15 * s)); push(0.05, () => 0, 0.01); } };
  speech(4); push(0.8, () => 125); push(0.2, () => 0, 0.002);          // «eeeh» plano de 0,8 s y una pausa
  speech(3); push(0.2, () => 0, 0.002); push(0.6, () => 118, 0.04);    // pausa y «mmm» de 0,6 s
  speech(2); push(0.5, s => 150 * (1 - 0.02 * s)); speech(1);           // vocal alargada pegada a la palabra: no es duda
  speech(3); push(1.5, () => 0, 0.002);     // silencio
  push(0.6, s => 200 * (1 - 0.5 * s));      // vocal enfatizada con tono que cae: no es duda
  speech(1);
  return out;
}

test('findFilledPauses detecta los «eeeh» planos e ignora el habla, el énfasis y los alargamientos', () => {
  const zones = findFilledPauses(synthSamples());
  assert.equal(zones.length, 2);
  assert.ok(zones[0][1] - zones[0][0] >= 0.7);
});

// ---------------------------------------------------------------- escritura
const kind = (id) => KINDS.find(k => k.id === id);

test('escritura: un pedido claro, al inicio y con plazo pasa todas las comprobaciones', () => {
  const r = analyzeWriting('Hola Ana: ¿puedes enviarme el informe antes del viernes a las 12? Lo necesito para la reunión con el cliente. Gracias.', kind('pedido'));
  assert.equal(r.score, 100, JSON.stringify(r.checks.filter(c => !c.ok)));
});

test('escritura: detecta disculpas innecesarias, apertura vacía y falta de plazo', () => {
  const r = analyzeWriting('Hola, espero que estés bien. Perdón por molestar, solo quería saber si podrías revisar el informe.', kind('pedido'));
  const fails = r.checks.filter(c => !c.ok).map(c => c.msg).join(' | ');
  assert.match(fails, /plazo/);
  assert.match(fails, /perdón por escribir/i);
  assert.match(fails, /primera frase no dice nada/);
  assert.ok(r.score < 70);   // tres problemas, cada uno contado una sola vez
});

test('escritura: el pedido al final se marca como tardío', () => {
  const r = analyzeWriting('Te escribo por el proyecto. Avanzamos con el diseño. Ya tenemos la maqueta. ¿Puedes aprobarla hoy?', kind('pedido'));
  assert.ok(r.checks.some(c => !c.ok && /frase 4/.test(c.msg)));
});

test('legibilidad Fernández Huerta: texto simple es fácil, texto denso es difícil', () => {
  const words = (t) => t.match(/\p{L}+/gu);
  const easy = 'Hoy vamos a ver el plan. Es corto. Tiene tres pasos. Todos son fáciles.';
  const hard = 'La implementación institucionalizada de metodologías interdisciplinarias representa consideraciones administrativas extraordinariamente complejas.';
  assert.ok(fernandezHuerta(words(easy), 4) > 80);
  assert.ok(fernandezHuerta(words(hard), 1) < 30);
});

test('disculparse de verdad no resta seguridad; pedir perdón por molestar sí', () => {
  const apology = analyzeWriting('Hola Marta: perdón por el retraso en tu pedido. Fue un error nuestro y te ofrezco el envío gratis. Te llega el jueves 30. Disculpa las molestias que te causó.', KINDS.find(k => k.id === 'disculpa'));
  assert.ok(!apology.checks.some(c => !c.ok && /restan seguridad/.test(c.msg)), JSON.stringify(apology.checks));
  assert.equal(countMatches('Perdón por molestar, sólo quería preguntarte algo.', HEDGE_RE), 2);
});

test('puntaje del habla: el silencio no se puntúa y el relleno repetido no aprueba', async () => {
  const { scoreSpeech, voiceMetrics, guiraud } = await import('../prototype/audiofile.js');
  const silence = Array.from({ length: 1800 }, (_, i) => ({ t: i / 30, rms: 0.001, pitch: 0 }));
  const m = voiceMetrics(silence, '', 60);
  assert.equal(m.longPauses, 1);                       // el silencio hasta el final cuenta
  assert.ok(scoreSpeech(m, true, 60).noVoice);
  const filler = 'palabra '.repeat(200);
  const r = scoreSpeech({ words: 200, hasText: true, fillers: 0, hedges: 0, variety: guiraud(filler), dur: 86 }, false, 60);
  assert.ok(r.total < 55, String(r.total));   // por debajo de «Competente»
  const real = 'Soy Ana, diseño productos digitales hace ocho años. Me apasiona entender por qué la gente abandona una app y arreglarlo con datos. El año pasado bajamos el abandono del registro a la mitad con tres cambios simples. Si te interesa crecer sin gastar más en anuncios, conversemos.';
  assert.ok(guiraud(real) >= 4, String(guiraud(real)));
});
