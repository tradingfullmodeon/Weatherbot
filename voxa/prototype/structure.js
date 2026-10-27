// Revisión local de la estructura según el método (sin IA): ¿están las partes de PREP, STAR, BLUF o SBI?
// Son marcadores de lenguaje simples; no reemplazan al coach, pero dan feedback concreto siempre.
import { wordCount } from './shared.js';

const stSentences = (t) => t.split(/(?<=[.!?¿¡])\s+|\n+/).map(s => s.trim()).filter(Boolean);
const stHas = (re, t) => re.test(t);
// Límites de palabra que entienden tildes (\b de JavaScript no reconoce «é» como letra).
const stRe = (src, flags = 'iu') => new RegExp(`(?<!\\p{L})(?:${src})(?!\\p{L})`, flags);
const ST_FILLER_START = /^(bueno|este|eh+|em+|o sea|pues|mm+)(?!\p{L})/iu;
const ST_NUMBER = /\d+([.,]\d+)?\s?(%|por ciento)?/u;
const ST_RESULT = stRe(String.raw`(logr(é|amos)|consegu(í|imos)|result(ado|ó)|aument(é|amos|ó)|baj(é|amos|ó)|reduj(e|imos|o)|subi(ó|mos)|crec(ió|imos)|ahorr(é|amos|ó)|gan(é|amos))`);
const ST_ACTION = stRe(String.raw`\p{L}{3,}(é|í)`, 'giu');   // lideré, armé, decidí, hablé…
// Pretéritos irregulares en primera persona (no terminan en «é»/«í») y el «nosotros» del equipo.
const ST_ACTION_IRREG = stRe(String.raw`(propuse|hice|dije|tuve|puse|traje|conduje|supe|quise|pude|vine|fui|di|estuve|reduje|produje|introduje|deshice|rehice|compuse|dispuse|expuse|mantuve|obtuve|contuve)`, 'giu');
const ST_ACTION_WE = stRe(String.raw`\p{L}{3,}(amos|imos)`, 'giu');
const ST_SITUATION = stRe(String.raw`(cuando|en mi (trabajo|empresa|equipo|último|anterior)|el año pasado|hace \w+|en \d{4}|en la empresa|una vez)`);
const ST_TASK = stRe(String.raw`(tenía que|ten(í|i)amos que|mi (objetivo|tarea|rol|responsabilidad)|me pidieron|deb(í|ía)a?|el reto era|el problema era)`);
const ST_REASON = stRe(String.raw`(porque|ya que|la razón|por eso|debido a|dado que)`);
const ST_EXAMPLE = stRe(String.raw`(por ejemplo|una vez|cuando|el año pasado|en mi (trabajo|vida|caso)|me pasó)`);
const ST_CLOSE = stRe(String.raw`(en resumen|por eso|así que|en conclusión|para cerrar|en definitiva)`);
const ST_ASK = /\b(propongo|necesito|te pido|les pido|recomiendo|sugiero|decidimos|la conclusión|mi propuesta|¿(puedes|podemos|podrías|me))/i;
const ST_IMPACT = stRe(String.raw`(impact(o|ó)|afect(a|ó)|hizo que|provoc(a|ó)|gener(a|ó)|el resultado fue|eso hace que)`);
const ST_BEHAVIOR = stRe(String.raw`(dijiste|hiciste|enviaste|llegaste|presentaste|interrumpiste|entregaste|vi que|noté que)`);

// Palabras de contenido (5+ letras) de una frase, para ver si el cierre vuelve a la idea del inicio.
const stContent = (s) => new Set((s.toLowerCase().match(/\p{L}{5,}/gu) || []).filter(w => !['porque', 'cuando', 'también', 'quiero', 'tengo', 'puedo', 'estoy', 'gracias'].includes(w)));

function stPrep(text) {
  const ss = stSentences(text), first = ss[0] || '', last = ss[ss.length - 1] || '';
  const overlap = [...stContent(first)].some(w => stContent(last).has(w));
  return [
    { part: 'Punto', ok: wordCount(first) > 0 && wordCount(first) <= 30 && !ST_FILLER_START.test(first), tip: 'Empieza con tu idea principal en una frase corta, sin «bueno» ni «este».' },
    { part: 'Razón', ok: stHas(ST_REASON, text), tip: 'Di por qué: «porque…», «la razón es…».' },
    { part: 'Ejemplo', ok: stHas(ST_EXAMPLE, text) || ST_NUMBER.test(text), tip: 'Agrega un ejemplo concreto o un dato.' },
    { part: 'Punto (cierre)', ok: ss.length > 1 && (overlap || stHas(ST_CLOSE, last)), tip: 'Cierra volviendo a tu idea principal («por eso…»).' },
  ];
}
function stStar(text) {
  const actions = (text.match(ST_ACTION) || []).length + (text.match(ST_ACTION_IRREG) || []).length;
  const we = (text.match(ST_ACTION_WE) || []).length;
  return [
    { part: 'Situación', ok: stHas(ST_SITUATION, text), tip: 'Ubica el contexto: «En mi trabajo anterior, cuando…».' },
    { part: 'Tarea', ok: stHas(ST_TASK, text), tip: 'Di cuál era tu reto: «Tenía que…», «Mi objetivo era…».' },
    { part: 'Acción', ok: actions >= 2 || (actions >= 1 && we >= 1) || /\byo\b/i.test(text), tip: 'Cuenta qué hiciste TÚ, en primera persona: «Armé», «Propuse», «Hablé con…».' },
    { part: 'Resultado', ok: stHas(ST_RESULT, text) || ST_NUMBER.test(text), tip: 'Cierra con un resultado medible: «Las ventas subieron un 30%».' },
  ];
}
function stBluf(text) {
  const ss = stSentences(text), opening = ss.slice(0, 2).join(' ');
  return [
    { part: 'Conclusión o pedido al inicio', ok: stHas(ST_ASK, opening), tip: 'Di en la primera frase qué propones o qué necesitas.' },
    { part: 'Evidencia', ok: ST_NUMBER.test(text) || stHas(ST_REASON, text), tip: 'Respalda con un dato o una razón.' },
    { part: 'Breve', ok: ss.length <= 8, tip: 'Recorta: lo esencial en pocas frases.' },
  ];
}
function stSbi(text) {
  return [
    { part: 'Situación', ok: stHas(ST_SITUATION, text) || /\b(ayer|hoy|en la reunión|el lunes|el martes|el miércoles|el jueves|el viernes)\b/i.test(text), tip: 'Ubica cuándo y dónde: «En la reunión del lunes…».' },
    { part: 'Conducta observable', ok: stHas(ST_BEHAVIOR, text), tip: 'Describe lo que hizo, no cómo es: «Interrumpiste dos veces», no «eres irrespetuoso».' },
    { part: 'Impacto', ok: stHas(ST_IMPACT, text), tip: 'Explica el efecto: «Eso hizo que el cliente no pudiera terminar».' },
  ];
}

const ST_CHECKERS = [[/^PREP/, stPrep], [/^STAR/, stStar], [/^BLUF/, stBluf], [/^SBI/, stSbi]];

// Devuelve { method, parts: [{part, ok, tip}], score } o null si el método no tiene revisión local.
export function checkStructure(text, method = '') {
  if (wordCount(text) < 15) return null;
  const fn = ST_CHECKERS.find(([re]) => re.test(method))?.[1];
  if (!fn) return null;
  const parts = fn(text);
  return { method: method.split(/[ /(]/)[0], parts, score: Math.round(100 * parts.filter(p => p.ok).length / parts.length) };
}
