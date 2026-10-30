// Revisión de textos (correos, mensajes, publicaciones) en el dispositivo. La usan escritura.html y la
// versión publicada; también la prueban los tests de voxa/tests.
import { countMatches, wordCount, PRACTICE_LANG, hedgeReFor } from './shared.js';
import { WRITING_BY_LANG } from './lang.js';

// Tipos de texto: método sugerido, extensión ideal en palabras y si necesitan pedido explícito o plazo.
export const KINDS = [
  { id: 'pedido', name: 'Pedir algo por correo', method: 'BLUF', words: [15, 150], ask: true, deadline: true, email: true,
    guide: 'Pon el pedido en la primera o segunda frase, explica el porqué en una línea y cierra con una fecha concreta.' },
  { id: 'no', name: 'Decir que no con amabilidad', method: 'DESC', words: [20, 120], ask: false, deadline: false, email: true,
    guide: 'Agradece, di que no en la primera frase (sin rodeos), da una razón breve y ofrece una alternativa si la hay.' },
  { id: 'feedback', name: 'Feedback por escrito', method: 'SBI', words: [35, 180], ask: true, deadline: false, email: true,
    guide: 'Describe la situación y el comportamiento concreto (sin juicios), su impacto y termina con una pregunta o propuesta.' },
  { id: 'disculpa', name: 'Disculparse con un cliente', method: 'Reconocer–Impacto–Reparar', words: [30, 160], ask: false, deadline: true, email: true,
    guide: 'Reconoce el error sin excusas, nombra el impacto para el cliente y di qué harás y cuándo.' },
  { id: 'whatsapp', name: 'Mensaje breve (WhatsApp, Slack)', method: 'BLUF', words: [5, 60], ask: true, deadline: false, email: false,
    guide: 'Una o dos frases: qué necesitas y para cuándo. Evita el «hola, ¿tienes un minuto?» sin contexto.' },
  { id: 'linkedin', name: 'Publicación de LinkedIn', method: 'Gancho + historia + aprendizaje', words: [60, 250], ask: false, deadline: false, email: false,
    guide: 'Primera línea que despierte curiosidad, una historia concreta, el aprendizaje en una frase y una pregunta para el lector.' },
];

export const sentencesOf = (t) => t.split(/(?<=[.!?¿¡…])\s+|\n+/).map(s => s.trim()).filter(s => /\p{L}/u.test(s));
// Sílabas en español (aproximación): grupos vocálicos, separando hiatos de vocales fuertes y tildes.
export function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
  const groups = w.match(/[aeiouáéíóúü]+/g) || [];
  let n = 0;
  for (const g of groups) {
    let count = 1;
    for (let i = 1; i < g.length; i++) {
      const a = g[i - 1], b = g[i];
      const strong = (c) => 'aeoáéóíú'.includes(c);
      if (strong(a) && strong(b)) count++;
    }
    n += count;
  }
  return Math.max(1, n);
}
// Índice de legibilidad Fernández Huerta (adaptación de Flesch al español): 60–70 = normal, >70 = fácil.
export function fernandezHuerta(words, sentences) {
  if (!words.length || !sentences) return 0;
  const P = words.reduce((s, w) => s + syllables(w), 0) / words.length * 100;
  const F = sentences / words.length * 100;
  return Math.round(206.84 - 0.6 * P - 1.02 * F);
}
export const ASK_RE = /\?|\b(podr[ií]as|puedes|pod[eé]s|necesito|necesitamos|te pido|les pido|solicito|agradecer[ií]a|por favor|me ayudas|me confirmas|confirm[aá]|env[ií]a|propongo)\b/iu;
export const DEADLINE_RE = /\b(hoy|mañana|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|esta semana|pr[oó]xima semana|antes del?|a m[aá]s tardar|fecha|plazo|\d{1,2}(:\d{2})?\s?(h|hrs|horas|am|pm)|\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|\d{1,2}\/\d{1,2})\b/iu;
// Pedidos indirectos: cuentan como pedido, pero conviene hacerlos directos.
export const INDIRECT_ASK_RE = /\b(podr[ií]an?|ser[ií]a posible|quer[ií]a (saber|ver|preguntar) si|me gustar[ií]a (saber|pedir))\b/iu;
export const APOLOGY_RE = /\b(perd[oó]n por (molestar|la molestia)|disculpa (la molestia|que te moleste)|siento molestarte|no s[eé] si es posible)\b/giu;
export const VAGUE_OPEN_RE = /^(hola[,!.]?\s*)?(¿tienes un minuto\??|¿tienes un momento\??|espero que est[eé]s bien[.!]?|ojal[aá] est[eé]s bien[.!]?)\s*$/iu;

// Reglas del idioma: el español con las de arriba; los demás, con las de lang.js (pedido, plazo, disculpas y legibilidad).
function rulesFor(lang) {
  const L = WRITING_BY_LANG[lang];
  if (!L) return { ask: ASK_RE, deadline: DEADLINE_RE, indirect: INDIRECT_ASK_RE, apology: APOLOGY_RE, vague: VAGUE_OPEN_RE, hedge: hedgeReFor('es'),
    read: fernandezHuerta, spanishMarks: true };
  const vowels = new RegExp(`[${L.vowels}]+`, 'giu');
  const syl = (w) => Math.max(1, ((lang === 'en' ? w.toLowerCase().replace(/e$/, '') : w.toLowerCase()).match(vowels) || []).length);
  return { ask: new RegExp(L.ask, 'iu'), deadline: new RegExp(L.deadline, 'iu'), indirect: new RegExp(L.indirect, 'iu'), apology: new RegExp(L.apology, 'giu'),
    vague: new RegExp(L.vague, 'iu'), hedge: hedgeReFor(lang), spanishMarks: false,
    read: (words, sentences) => !words.length || !sentences ? 0 : Math.round(L.read(words.length / sentences, words.reduce((a, w) => a + syl(w), 0) / words.length)) };
}

// Revisión instantánea de un texto según su tipo: devuelve las comprobaciones, un puntaje y estadísticas.
export function analyzeWriting(text, k, lang = PRACTICE_LANG) {
  const R = rulesFor(lang);
  const ASK_RE = R.ask, DEADLINE_RE = R.deadline, INDIRECT_ASK_RE = R.indirect, APOLOGY_RE = R.apology, VAGUE_OPEN_RE = R.vague, HEDGE_RE = R.hedge;
  const words = (text.match(/\p{L}+/gu) || []);
  const sents = sentencesOf(text);
  const lens = sents.map(s => wordCount(s));
  const avg = lens.length ? words.length / lens.length : 0;
  const longest = Math.max(0, ...lens);
  const read = R.read(words, sents.length);
  const hedges = countMatches(text.replace(APOLOGY_RE, ''), HEDGE_RE);   // las disculpas innecesarias se revisan aparte
  const apologies = (text.match(APOLOGY_RE) || []).length;
  const shouting = (text.match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || []).length + (text.match(/!{2,}/g) || []).length;
  const noOpening = R.spanishMarks && /!/.test(text) && !/¡/.test(text);
  const askIdx = sents.findIndex(s => ASK_RE.test(s) || INDIRECT_ASK_RE.test(s));
  const indirect = askIdx >= 0 && !ASK_RE.test(sents[askIdx]);
  const checks = [];
  const add = (ok, msg) => checks.push({ ok, msg });

  const [lo, hi] = k.words;
  add(words.length >= lo && words.length <= hi, words.length < lo ? `Es muy corto para este tipo de texto (${words.length} palabras; ideal ${lo}–${hi}).`
    : words.length > hi ? `Es largo (${words.length} palabras; ideal ${lo}–${hi}). Quita lo que no ayude a lograr tu objetivo.` : `Buena extensión (${words.length} palabras).`);
  if (k.ask) {
    if (!indirect) add(askIdx >= 0, askIdx >= 0 ? 'Hay un pedido explícito.' : 'No se ve un pedido claro: di exactamente qué necesitas («¿Puedes…?», «Necesito…»).');
    if (indirect) add(false, 'Tu pedido es indirecto («quería ver si…», «podría…»): hazlo directo («¿Puedes revisar…?»).');
    if (askIdx >= 0) add(askIdx <= 1, askIdx <= 1 ? 'El pedido está al inicio: quien lee entiende enseguida qué necesitas.' : `El pedido aparece recién en la frase ${askIdx + 1}. Súbelo al inicio (lo importante primero).`);
  }
  if (k.deadline) add(DEADLINE_RE.test(text), DEADLINE_RE.test(text) ? 'Incluye un plazo o fecha.' : 'Falta un plazo: agrega para cuándo («antes del jueves a las 12»).');
  add(avg <= 22 && longest <= 35, avg <= 22 && longest <= 35 ? 'Frases de largo cómodo.' : `Hay frases largas (la más larga tiene ${longest} palabras). Divide las de más de 25.`);
  if (words.length >= 30) add(read >= 55, read >= 55 ? `Fácil de leer (índice de legibilidad ${read}).` : `Cuesta leerlo (índice de legibilidad ${read}; apunta a 60 o más): usa palabras y frases más simples.`);
  add(hedges === 0, hedges === 0 ? 'Lenguaje seguro.' : `${hedges === 1 ? 'Una frase resta' : `${hedges} frases restan`} seguridad: ${[...new Set((text.replace(APOLOGY_RE, '').match(HEDGE_RE) || []).map(h => `«${h.trim().toLowerCase()}»`))].join(', ')}.`);
  if (apologies) add(false, 'Pides perdón por escribir: no hace falta. Agradece en lugar de disculparte.');
  if (shouting) add(false, 'Hay mayúsculas sostenidas o varios signos de exclamación: pueden leerse como enojo. Usa uno solo.');
  if (noOpening) add(false, 'En español la exclamación se abre con «¡»: «¡Gracias!».');
  if (sents.length && VAGUE_OPEN_RE.test(sents[0])) add(false, 'La primera frase no dice nada todavía: empieza por el motivo del mensaje.');
  const score = Math.round(100 * checks.filter(c => c.ok).length / (checks.length || 1));
  return { checks, score, words: words.length, sentences: sents.length, avg, read };
}

// Asertividad de un mensaje (0–100): pedido directo, sin atenuadores ni disculpas por escribir.
export function assertivenessOf(text, lang = PRACTICE_LANG) {
  const { ask: ASK_RE, indirect: INDIRECT_ASK_RE, apology: APOLOGY_RE, hedge: HEDGE_RE } = rulesFor(lang);
  const hedges = countMatches(text.replace(APOLOGY_RE, ''), HEDGE_RE), apologies = (text.match(APOLOGY_RE) || []).length;
  const direct = ASK_RE.test(text), indirect = INDIRECT_ASK_RE.test(text);
  const v = 100 - 20 * hedges - 30 * Math.min(apologies, 1) - (direct ? 0 : indirect ? 20 : 35);
  return Math.max(0, Math.min(100, v));
}
