// Compartir el avance: una tarjeta (imagen) con el Índice VOXA, la racha y las prácticas, más un texto corto.
// Sin datos sensibles: ni puntajes por dimensión ni lo que dijiste. Se comparte sólo si la persona lo pide.

export function shareStats(profile, sessions, streakDays) {
  const diags = profile.diagnoses || [];
  const first = diags[0], last = diags.at(-1);
  return {
    index: last?.total ?? null, level: last?.level ?? '', delta: diags.length > 1 ? last.total - first.total : null,
    streak: streakDays, practices: sessions.length,
  };
}

export function shareText(st) {
  const parts = [];
  if (st.index != null) parts.push(`Mi Índice VOXA es ${st.index} (${st.level})${st.delta > 0 ? `: subí ${st.delta} puntos desde mi primer diagnóstico` : ''}.`);
  if (st.streak >= 2) parts.push(`Llevo ${st.streak} días seguidos practicando.`);
  parts.push(`${st.practices} ${st.practices === 1 ? 'práctica' : 'prácticas'} para comunicarme con más seguridad con VOXA.`);
  return parts.join(' ');
}

export function drawShareCard(canvas, st) {
  const W = 1080, H = 1350, c = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#4f46e5'); g.addColorStop(1, '#7c3aed');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff'; c.textAlign = 'center';
  c.font = '700 64px system-ui, sans-serif'; c.fillText('VOXA', W / 2, 150);
  c.font = '400 40px system-ui, sans-serif'; c.fillStyle = '#e0e7ff'; c.fillText('Mi avance en comunicación', W / 2, 215);
  c.fillStyle = '#fff';
  if (st.index != null) {
    c.font = '800 260px system-ui, sans-serif'; c.fillText(String(st.index), W / 2, 560);
    c.font = '600 48px system-ui, sans-serif'; c.fillText(`Índice VOXA · ${st.level}`, W / 2, 640);
    if (st.delta > 0) { c.font = '700 56px system-ui, sans-serif'; c.fillStyle = '#bbf7d0'; c.fillText(`+${st.delta} puntos desde mi primer diagnóstico`, W / 2, 740); c.fillStyle = '#fff'; }
  }
  c.font = '700 72px system-ui, sans-serif';
  c.fillText(`🔥 ${st.streak}   ·   🎙 ${st.practices}`, W / 2, 950);
  c.font = '400 40px system-ui, sans-serif'; c.fillStyle = '#e0e7ff';
  c.fillText('días seguidos         prácticas', W / 2, 1010);
  c.font = '500 40px system-ui, sans-serif'; c.fillStyle = '#fff';
  c.fillText('Entreno para hablar con seguridad', W / 2, 1210);
  return canvas;
}

// Comparte con el menú del teléfono (WhatsApp, Instagram…); si no se puede, descarga la imagen.
export async function shareProgress(st) {
  const canvas = drawShareCard(document.createElement('canvas'), st);
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  const file = new File([blob], 'mi-avance-voxa.png', { type: 'image/png' });
  const text = shareText(st);
  if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return 'shared'; }
  if (navigator.share) { await navigator.share({ text }); return 'shared-text'; }
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: file.name });
  document.body.appendChild(a); a.click(); a.remove();
  return 'downloaded';
}
