// Calificación de usuarios: estrellas (1–5, la misma escala de App Store y Google Play), NPS (0–10),
// lo que más sirve y un comentario. Sirve para compararnos con las apps de la categoría con datos reales.
import { esc } from './shared.js';

export const FEATURES = [
  ['diagnostico', 'Diagnóstico y metas'], ['ensayar', 'Ensayar con mi voz o video'], ['presencia', 'Lenguaje corporal'],
  ['roleplay', 'Roleplay con personajes'], ['escritura', 'Escritura'], ['aprender', 'Lecciones'], ['evento', 'Evento real'],
];

// Se pide en un buen momento (después de lograr algo), no al entrar: tras 3 prácticas y no más de una vez
// cada 30 días, como recomiendan las guías de calificación en tienda de Apple y Google.
export function shouldAskRating(profile, sessions, now = Date.now()) {
  // Al menos 3 prácticas en 2 días distintos: que haya vuelto, no sólo probado.
  if (sessions.length < 3 || new Set(sessions.map(s => String(s.date).slice(0, 10))).size < 2) return false;
  const last = profile.rating?.date || profile.ratingDismissed;
  return !last || now - new Date(last) > 30 * 864e5;
}

export function ratingFormHTML(prev = {}) {
  const stars = [1, 2, 3, 4, 5].map(n => `<button type="button" data-stars="${n}" aria-pressed="${prev.stars === n}" aria-label="${n} ${n === 1 ? 'estrella' : 'estrellas'}">${n} ★</button>`).join('');
  const nps = Array.from({ length: 11 }, (_, n) => `<button type="button" data-nps="${n}" aria-pressed="${prev.nps === n}">${n}</button>`).join('');
  const feats = FEATURES.map(([id, label]) => `<label class="chk"><input type="checkbox" data-feat="${id}" ${prev.features?.includes(id) ? 'checked' : ''}> ${esc(label)}</label>`).join('');
  return `<p class="lead">¿Cómo calificarías Talkride?</p>
    <div class="stars" role="group" aria-label="Calificación de 1 a 5 estrellas">${stars}</div>
    <p style="margin-top:12px">¿Qué tan probable es que recomiendes Talkride a un amigo o colega? (0 = nada, 10 = totalmente)</p>
    <div class="nps" role="group" aria-label="Recomendación de 0 a 10">${nps}</div>
    <p style="margin-top:12px">¿Qué te sirve más?</p><div class="feats">${feats}</div>
    <label for="rateText" style="margin-top:12px">¿Qué mejorarías o qué te falta? (opcional)</label>
    <textarea id="rateText" maxlength="1000" placeholder="Ej.: me gustaría practicar entrevistas en inglés">${esc(prev.text || '')}</textarea>`;
}

// Lee el formulario: devuelve null si falta lo obligatorio (estrellas).
export function readRatingForm(box) {
  const pick = (attr) => { const b = box.querySelector(`[data-${attr}][aria-pressed="true"]`); return b ? +b.dataset[attr] : null; };
  const stars = pick('stars');
  if (!stars) return null;
  return { stars, nps: pick('nps'), features: [...box.querySelectorAll('[data-feat]:checked')].map(x => x.dataset.feat),
    text: (box.querySelector('#rateText')?.value || '').trim().slice(0, 1000) };
}

// Resumen comparable con las tiendas: promedio de estrellas, distribución y NPS (% promotores − % detractores).
export function ratingSummary(list) {
  const valid = list.filter(r => r.stars >= 1 && r.stars <= 5);
  const n = valid.length;
  const avg = n ? valid.reduce((s, r) => s + r.stars, 0) / n : null;
  const dist = [1, 2, 3, 4, 5].map(k => valid.filter(r => r.stars === k).length);
  const withNps = list.filter(r => Number.isInteger(r.nps));
  const nps = withNps.length ? Math.round(100 * (withNps.filter(r => r.nps >= 9).length - withNps.filter(r => r.nps <= 6).length) / withNps.length) : null;
  const feats = Object.fromEntries(FEATURES.map(([id]) => [id, list.filter(r => r.features?.includes(id)).length]));
  return { n, avg, dist, nps, npsN: withNps.length, feats };
}

export function ratingSummaryHTML(s) {
  if (!s.n) return '<p class="note">Todavía no hay calificaciones. Comparte Talkride con permiso de «Colaborador» para que otras personas puedan calificar.</p>';
  const bars = s.dist.map((c, i) => `<div class="dist-row"><span>${i + 1}★</span><div class="bar"><div style="width:${Math.round(100 * c / s.n)}%"></div></div><span class="note">${c}</span></div>`).reverse().join('');
  const top = FEATURES.map(([id, label]) => [label, s.feats[id]]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `<div class="kpis">
      <div class="kpi"><div class="k">Calificación</div><div class="v">${s.avg.toFixed(1)} ★</div><div class="d">${s.n} ${s.n === 1 ? 'persona' : 'personas'}</div></div>
      <div class="kpi"><div class="k">NPS</div><div class="v">${s.nps ?? '–'}</div><div class="d">${s.npsN} respuestas · de −100 a 100</div></div>
    </div>${bars}
    ${top.length ? `<p class="note">Lo que más sirve: ${top.map(([l, c]) => `${esc(l)} (${c})`).join(', ')}.</p>` : ''}
    <p class="note">Referencia: las apps mejor evaluadas de la categoría tienen entre 4,6 y 4,8 ★ en las tiendas.</p>`;
}
