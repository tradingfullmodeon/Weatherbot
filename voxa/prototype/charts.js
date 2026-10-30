// Gráficos de Talkride en SVG: nítidos en cualquier pantalla, con texto legible en el celular y con los colores del
// tema (claro, oscuro y alto contraste). Sin dependencias.

const f1 = (n) => Math.round(n * 10) / 10;
const escT = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const scoreColor = (v) => v >= 75 ? 'var(--good)' : v >= 50 ? 'var(--mid)' : 'var(--accent)';

// Radar del perfil: axes = [{id, name}], values = {id: 0–100}; measured = {id: número|null} marca qué se midió
// (punto lleno) y qué viene sólo de cómo se ve la persona (punto hueco); previous = perfil anterior, en línea punteada.
export function radarSVG(axes, values, { measured = null, previous = null, title = 'Perfil de comunicación' } = {}) {
  const W = 370, H = 330, cx = W / 2, cy = 165, R = 108;
  const n = axes.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
  const poly = (vals) => axes.map((a, i) => pt(i, vals[a.id] ?? 0).map(f1).join(',')).join(' ');
  const rings = [25, 50, 75, 100].map(l => `<polygon points="${axes.map((_, i) => pt(i, l).map(f1).join(',')).join(' ')}" style="fill:none;stroke:var(--line);stroke-width:1"/>`).join('');
  const spokes = axes.map((_, i) => { const [x, y] = pt(i, 100); return `<line x1="${cx}" y1="${cy}" x2="${f1(x)}" y2="${f1(y)}" style="stroke:var(--line);stroke-width:1"/>`; }).join('');
  const scale = [50, 100].map(l => `<text x="${cx + 4}" y="${f1(cy - R * l / 100 + 11)}" style="fill:var(--muted);font-size:9px">${l}</text>`).join('');
  const prev = previous ? `<polygon points="${poly(previous)}" style="fill:none;stroke:var(--muted);stroke-width:1.5;stroke-dasharray:4 3"/>` : '';
  const dots = axes.map((a, i) => {
    const [x, y] = pt(i, values[a.id] ?? 0), self = measured && measured[a.id] == null;
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.5" style="fill:${self ? 'var(--card)' : 'var(--accent)'};stroke:var(--accent);stroke-width:2"/>`;
  }).join('');
  const labels = axes.map((a, i) => {
    const [x, y] = pt(i, 100), dx = x - cx, anchor = Math.abs(dx) < 8 ? 'middle' : dx > 0 ? 'start' : 'end';
    const lx = x + (anchor === 'start' ? 8 : anchor === 'end' ? -8 : 0), ly = y + (y < cy - 8 ? -18 : y > cy + 8 ? 16 : -2);
    const v = values[a.id];
    return `<text x="${f1(lx)}" y="${f1(ly)}" text-anchor="${anchor}" style="font-size:13px;font-weight:600;fill:var(--text)">${escT(a.name)}</text>
      <text x="${f1(lx)}" y="${f1(ly + 16)}" text-anchor="${anchor}" style="font-size:14px;font-weight:800;fill:${scoreColor(v ?? 0)}">${v ?? '–'}</text>`;
  }).join('');
  const desc = axes.map(a => `${a.name} ${values[a.id] ?? 'sin dato'}`).join(', ');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escT(title)}: ${escT(desc)}" class="chart-svg" style="max-width:460px">
    ${rings}${spokes}${scale}${prev}
    <polygon points="${poly(values)}" style="fill:var(--accent);fill-opacity:.16;stroke:var(--accent);stroke-width:2.5;stroke-linejoin:round"/>
    ${dots}${labels}</svg>`;
}

// Líneas en el tiempo: series = [{label, color, values: [número|null], width}]; la primera es la principal.
export function lineChartSVG(series, { max = 100, title = 'Evolución' } = {}) {
  const W = 360, H = 190, L = 30, Rp = 14, T = 14, B = 24;
  const len = Math.max(...series.map(s => s.values.length), 1);
  const x = (i) => L + (len === 1 ? (W - L - Rp) / 2 : i / (len - 1) * (W - L - Rp));
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const grid = [0, max / 2, max].map(v => `<line x1="${L}" x2="${W - Rp}" y1="${f1(y(v))}" y2="${f1(y(v))}" style="stroke:var(--line)"/>
    <text x="${L - 6}" y="${f1(y(v) + 4)}" text-anchor="end" style="fill:var(--muted);font-size:10px">${v}</text>`).join('');
  const lines = [...series].reverse().map((s) => {
    const pts = s.values.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean);
    if (!pts.length) return '';
    const main = s === series[0];
    const path = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${f1(px)} ${f1(py)}`).join(' ');
    const last = pts[pts.length - 1], lastV = s.values.filter(v => v != null).at(-1);
    return `<path d="${path}" style="fill:none;stroke:${s.color};stroke-width:${s.width || (main ? 3 : 1.75)};stroke-linecap:round;stroke-linejoin:round"/>
      ${pts.map(([px, py]) => `<circle cx="${f1(px)}" cy="${f1(py)}" r="${main ? 3.5 : 2.5}" style="fill:${s.color}"/>`).join('')}
      ${main ? `<text x="${f1(Math.min(last[0], W - Rp - 2))}" y="${f1(last[1] - 9)}" text-anchor="end" style="fill:${s.color};font-size:12px;font-weight:800">${lastV}</text>` : ''}`;
  }).join('');
  const xl = len > 1 ? `<text x="${L}" y="${H - 6}" style="fill:var(--muted);font-size:10px">1.ª práctica</text>
    <text x="${W - Rp}" y="${H - 6}" text-anchor="end" style="fill:var(--muted);font-size:10px">${len}.ª</text>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escT(title)}" class="chart-svg">${grid}${lines}${xl}</svg>`;
}

// Pares de barras (antes y después) en escala de 0 a max.
export function pairBarsSVG(pairs, { max = 5, colors = ['var(--bad)', 'var(--good)'], title = 'Antes y después' } = {}) {
  const W = 360, H = 170, L = 24, T = 10, B = 20, n = Math.max(pairs.length, 1);
  const bw = (W - L - 6) / n, h = (v) => v / max * (H - T - B), y0 = H - B;
  const grid = [0, max / 2, max].map(v => `<line x1="${L}" x2="${W - 6}" y1="${f1(y0 - h(v))}" y2="${f1(y0 - h(v))}" style="stroke:var(--line)"/>
    <text x="${L - 5}" y="${f1(y0 - h(v) + 4)}" text-anchor="end" style="fill:var(--muted);font-size:10px">${v}</text>`).join('');
  const bars = pairs.map(([a, b], i) => {
    const x0 = L + i * bw + bw * 0.12, w = bw * 0.36;
    return `<rect x="${f1(x0)}" y="${f1(y0 - h(a))}" width="${f1(w)}" height="${f1(h(a))}" rx="2" style="fill:${colors[0]}"/>
      <rect x="${f1(x0 + w + 2)}" y="${f1(y0 - h(b))}" width="${f1(w)}" height="${f1(h(b))}" rx="2" style="fill:${colors[1]}"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escT(title)}" class="chart-svg">${grid}${bars}</svg>`;
}

// Anillo de puntaje (0–100) en el color que corresponde; el texto va dentro.
export function ringHTML(value, { color = null, label = null, pct = null } = {}) {
  const p = pct ?? (typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 100);
  return `<div class="ring" style="--p:${p};--c:${color || (typeof value === 'number' ? scoreColor(value) : 'var(--accent)')}">${label ?? value}</div>`;
}
