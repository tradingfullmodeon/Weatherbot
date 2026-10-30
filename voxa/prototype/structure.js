// Revisión local de la estructura según el método (sin IA): ¿están las partes de PREP, STAR, BLUF o SBI?
// Son marcadores de lenguaje simples; no reemplazan al coach, pero dan feedback concreto siempre.
import { wordCount, PRACTICE_LANG } from './shared.js';
import { STRUCTURE_BY_LANG, STRUCTURE_EXAMPLES } from './lang.js';

// Frases; si el texto viene de la transcripción de voz (sin puntos), se corta en bloques de ~20 palabras.
function stSentences(t) {
  const ss = t.split(/(?<=[.!?¿¡])\s+|\n+/).map(s => s.trim()).filter(Boolean);
  const words = t.trim().split(/\s+/);
  if (ss.length > 1 || words.length <= 40) return ss;
  const out = [];
  for (let i = 0; i < words.length; i += 20) out.push(words.slice(i, i + 20).join(' '));
  return out;
}
const stHas = (re, t) => re.test(t);
// Límites de palabra que entienden tildes (\b de JavaScript no reconoce «é» como letra).
const stRe = (src, flags = 'iu') => new RegExp(`(?<!\\p{L})(?:${src})(?!\\p{L})`, flags);
const ST_FILLER_START = /^(bueno|este|eh+|em+|o sea|pues|mm+)(?!\p{L})/iu;
// Cifras que cuentan como resultado: no los años («en 2019» es contexto, no un resultado).
const ST_NUMBER = { test: (t) => (t.match(/\d+([.,]\d+)?/g) || []).some(n => !/^(19|20)\d{2}$/.test(n)) };
const ST_RESULT = stRe(String.raw`(logr(é|amos|ó|aron)|consegu(í|imos|ió|ieron)|result(ado|ó)|aument(é|amos|ó|aron)|baj(é|amos|ó|aron)|reduj(e|imos|o|eron)|se redujeron|subi(ó|mos|eron)|crec(ió|imos|ieron)|mejor(é|amos|ó|aron)|ahorr(é|amos|ó|aron)|gan(é|amos|ó|aron)|pasaron de|pasamos de|desde entonces)`);
const ST_ACTION = stRe(String.raw`\p{L}{3,}(é|í)`, 'giu');   // lideré, armé, decidí, hablé…
// Palabras que terminan en «é»/«í» y no son verbos en primera persona.
const ST_NOT_VERB = new Set(['así', 'aquí', 'allí', 'ahí', 'café', 'bebé', 'sofá', 'menú', 'jamás', 'quizá', 'también', 'sí', 'mí', 'ti', 'porqué', 'cliché', 'puré', 'consomé', 'frenesí', 'colibrí', 'esquí', 'rubí', 'maní', 'ají', 'jabalí', 'alhelí', 'israelí', 'iraquí', 'marroquí', 'paquistaní', 'bengalí']);
// Pretéritos irregulares en primera persona (no terminan en «é»/«í») y el «nosotros» del equipo.
const ST_ACTION_IRREG = stRe(String.raw`(propuse|hice|dije|tuve|puse|traje|conduje|supe|quise|pude|vine|fui|di|estuve|reduje|produje|introduje|deshice|rehice|compuse|dispuse|expuse|mantuve|obtuve|contuve)`, 'giu');
const ST_ACTION_WE = stRe(String.raw`\p{L}{3,}(amos|imos)`, 'giu');
const ST_SITUATION = stRe(String.raw`(cuando|en mi (trabajo|empresa|equipo|último|anterior|práctica|pasantía|tesis|curso)|en mis (prácticas|pasantías|clases)|en (la|mi) universidad|en un proyecto|durante|el (año|semestre) pasado|hace \w+|en \d{4}|en la empresa|una vez)`);
const ST_TASK = stRe(String.raw`(tenía que|ten(í|i)amos que|mi (objetivo|tarea|rol|responsabilidad)|me pidieron|deb(í|ía)a?|el reto era|el problema era)`);
const ST_REASON = stRe(String.raw`(porque|ya que|la razón|por eso|debido a|dado que)`);
const ST_EXAMPLE = stRe(String.raw`(por ejemplo|una vez|cuando|el año pasado|en mi (trabajo|vida|caso)|me pasó)`);
const ST_CLOSE = stRe(String.raw`(en resumen|por eso|así que|en conclusión|para cerrar|en definitiva)`);
const ST_ASK = /(?<!\p{L})(propongo|necesito|te pido|les pido|recomiendo|sugiero|decidimos|la conclusión|mi propuesta)(?!\p{L})|¿\s*(puedes|podemos|podrías|podríamos|me)(?!\p{L})/iu;
const ST_IMPACT = stRe(String.raw`(impact(o|ó)|afect(a|ó)|hizo que|provoc(a|ó)|gener(a|ó)|el resultado fue|eso hace que)`);
const ST_BEHAVIOR = stRe(String.raw`(dijiste|hiciste|enviaste|llegaste|presentaste|interrumpiste|entregaste|vi que|noté que)`);

const ES_STOP = ['porque', 'cuando', 'también', 'quiero', 'tengo', 'puedo', 'estoy', 'gracias'];
// Marcadores del idioma: el español con sus reglas finas (arriba); los demás, armados con las listas de lang.js.
function markersFor(lang) {
  return { ...markersOnly(lang), ex: STRUCTURE_EXAMPLES[lang] || STRUCTURE_EXAMPLES.es };
}
function markersOnly(lang) {
  const L = STRUCTURE_BY_LANG[lang];
  if (!L) {
    return { fillerStart: ST_FILLER_START, result: ST_RESULT, situation: ST_SITUATION, task: ST_TASK, reason: ST_REASON, example: ST_EXAMPLE,
      close: ST_CLOSE, ask: ST_ASK, impact: ST_IMPACT, behavior: ST_BEHAVIOR, sitTime: /\b(ayer|hoy|en la reunión|el lunes|el martes|el miércoles|el jueves|el viernes)\b/i,
      actions: (t) => (t.match(ST_ACTION) || []).filter(w => !ST_NOT_VERB.has(w.toLowerCase())).length + (t.match(ST_ACTION_IRREG) || []).length,
      we: (t) => (t.match(ST_ACTION_WE) || []).length, stop: ES_STOP };
  }
  const action = stRe(L.action, 'giu'), we = stRe(L.we, 'giu');
  return { fillerStart: new RegExp(`^${L.fillerStart}(?!\\p{L})`, 'iu'), result: stRe(L.result), situation: stRe(L.situation), task: stRe(L.task),
    reason: stRe(L.reason), example: stRe(L.example), close: stRe(L.close), ask: stRe(L.ask), impact: stRe(L.impact), behavior: stRe(L.behavior),
    sitTime: stRe(L.situationTime), actions: (t) => (t.match(action) || []).length, we: (t) => (t.match(we) || []).length, stop: L.stop };
}

// Palabras de contenido (5+ letras) de una frase, para ver si el cierre vuelve a la idea del inicio.
const stContent = (s, stop = ES_STOP) => new Set((s.toLowerCase().match(/\p{L}{5,}/gu) || []).filter(w => !stop.includes(w)));

function stPrep(text, M) {
  const ss = stSentences(text), first = ss[0] || '', last = ss[ss.length - 1] || '';
  const overlap = [...stContent(first, M.stop)].some(w => stContent(last, M.stop).has(w));
  return [
    { part: 'Punto', ok: wordCount(first) > 0 && wordCount(first) <= 30 && !M.fillerStart.test(first), tip: `Empieza con tu idea principal en una frase corta, sin ${M.ex.fillers}.` },
    { part: 'Razón', ok: stHas(M.reason, text), tip: `Di por qué: ${M.ex.reason}.` },
    { part: 'Ejemplo', ok: stHas(M.example, text) || ST_NUMBER.test(text), tip: 'Agrega un ejemplo concreto o un dato.' },
    { part: 'Punto (cierre)', ok: ss.length > 1 && (overlap || stHas(M.close, last)), tip: `Cierra volviendo a tu idea principal (${M.ex.close}).` },
  ];
}
function stStar(text, M) {
  const actions = M.actions(text), we = M.we(text);
  return [
    { part: 'Situación', ok: stHas(M.situation, text), tip: `Ubica el contexto: ${M.ex.situation}.` },
    { part: 'Tarea', ok: stHas(M.task, text), tip: `Di cuál era tu reto: ${M.ex.task}.` },
    // En STAR la acción es tuya: si domina el «nosotros», no se da por cumplida.
    { part: 'Acción', ok: (actions >= 2 || (actions >= 1 && we >= 1)) && actions >= we, tip: `Cuenta qué hiciste TÚ, en primera persona: ${M.ex.action}.` },
    { part: 'Resultado', ok: stHas(M.result, text) || ST_NUMBER.test(text), tip: `Cierra con un resultado medible: ${M.ex.result}.` },
  ];
}
function stBluf(text, M) {
  const ss = stSentences(text), opening = ss.slice(0, 2).join(' ');
  return [
    { part: 'Conclusión o pedido al inicio', ok: stHas(M.ask, opening), tip: 'Di en la primera frase qué propones o qué necesitas.' },
    { part: 'Evidencia', ok: ST_NUMBER.test(text) || stHas(M.reason, text), tip: 'Respalda con un dato o una razón.' },
    { part: 'Breve', ok: ss.length <= 8, tip: 'Recorta: lo esencial en pocas frases.' },
  ];
}
function stSbi(text, M) {
  return [
    { part: 'Situación', ok: stHas(M.situation, text) || M.sitTime.test(text), tip: `Ubica cuándo y dónde: ${M.ex.when}.` },
    { part: 'Conducta observable', ok: stHas(M.behavior, text), tip: `Describe lo que hizo, no cómo es: ${M.ex.behavior}.` },
    { part: 'Impacto', ok: stHas(M.impact, text), tip: `Explica el efecto: ${M.ex.impact}.` },
  ];
}

const ST_CHECKERS = [[/^PREP/, stPrep], [/^STAR/, stStar], [/^BLUF/, stBluf], [/^SBI/, stSbi]];

// Devuelve { method, parts: [{part, ok, tip}], score } o null si el método no tiene revisión local.
export function checkStructure(text, method = '', { minWords = 15, lang = PRACTICE_LANG } = {}) {
  if (wordCount(text) < minWords) return null;
  const fn = ST_CHECKERS.find(([re]) => re.test(method))?.[1];
  if (!fn) return null;
  const parts = fn(text, markersFor(lang));
  return { method: method.split(/[ /(]/)[0], parts, score: Math.round(100 * parts.filter(p => p.ok).length / parts.length) };
}
