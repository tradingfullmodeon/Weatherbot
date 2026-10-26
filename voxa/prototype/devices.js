// Acceso a cámara y micrófono: pedirlos con respaldo a «sólo voz», explicar en lenguaje simple qué pasó
// cuando no se puede y ofrecer una prueba de dispositivos antes de practicar.
import { $, esc, rmsOf } from './shared.js';

// Navegador y contexto, para dar instrucciones concretas cuando algo falla.
export function environment() {
  const ua = navigator.userAgent;
  return {
    secure: window.isSecureContext,
    hasMedia: !!navigator.mediaDevices?.getUserMedia,
    speech: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    ios: /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    android: /Android/.test(ua),
    inApp: /FBAN|FBAV|Instagram|Line\/|WhatsApp|TikTok|Twitter/i.test(ua),
    browser: /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'otro',
  };
}

// Estado del permiso sin pedirlo: 'granted' | 'denied' | 'prompt' | 'unknown' (no todos los navegadores lo informan).
export async function permissionState(name) {
  try { return (await navigator.permissions.query({ name })).state; } catch { return 'unknown'; }
}

// Cómo reactivar un permiso bloqueado, según el navegador.
export function unblockHelp(env = environment()) {
  if (env.ios) return 'En iPhone: abre Ajustes → Safari (o Chrome) → Cámara y Micrófono → «Permitir», y recarga la página.';
  if (env.android) return 'En Android: toca el candado junto a la dirección → Permisos → activa Cámara y Micrófono, y recarga.';
  if (env.browser === 'Safari') return 'En Safari: menú Safari → Configuración del sitio web → Cámara y Micrófono → «Permitir», y recarga.';
  if (env.browser === 'Firefox') return 'En Firefox: haz clic en el ícono de cámara tachada en la barra de direcciones, quita el bloqueo y recarga.';
  return 'Haz clic en el candado (o el ícono de cámara) a la izquierda de la dirección, cambia Cámara y Micrófono a «Permitir» y recarga la página.';
}

// Mensaje claro para cada tipo de error de getUserMedia.
export function explainError(e, env = environment()) {
  if (!env.secure) return 'Por seguridad, el navegador sólo permite la cámara y el micrófono en páginas https o en localhost. Abre VOXA desde su dirección https.';
  if (env.inApp) return 'Estás dentro del navegador de otra app (WhatsApp, Instagram…), que bloquea la cámara y el micrófono. Abre el enlace en Chrome o Safari.';
  if (!env.hasMedia) return 'Este navegador no permite usar la cámara ni el micrófono. Prueba con Chrome, Edge o Safari actualizados.';
  switch (e?.name) {
    case 'NotAllowedError': case 'SecurityError': return 'El permiso está bloqueado. ' + unblockHelp(env);
    case 'NotFoundError': case 'OverconstrainedError': return 'No encontramos ese dispositivo. Revisa que esté conectado o elige otro en la configuración del sistema.';
    case 'NotSupportedError': return 'Este navegador no permite usar la cámara ni el micrófono en esta página. Prueba con Chrome, Edge o Safari actualizados.';
    case 'NotReadableError': case 'AbortError': return 'Otra aplicación está usando la cámara o el micrófono (Zoom, Meet, Teams…). Ciérrala y vuelve a intentar.';
    default: return 'No pudimos acceder a la cámara o al micrófono: ' + (e?.message || 'error desconocido');
  }
}

// Pide cámara + micrófono; si la cámara no está disponible (no existe, está ocupada o el usuario sólo
// bloqueó la cámara), sigue con el micrófono. Devuelve {stream, video: bool} o lanza el error del micrófono.
export async function requestMedia({ video = true, audio = { echoCancellation: true, noiseSuppression: true } } = {}) {
  const env = environment();
  if (!env.secure || !env.hasMedia || env.inApp) { const err = new Error('unsupported'); err.name = 'UnsupportedError'; throw err; }
  if (video) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio });
      return { stream, video: true };
    } catch (e) {
      // Con el permiso denegado para ambos, pedir sólo audio volvería a fallar: se informa directo.
      if (e.name === 'NotAllowedError' && (await permissionState('microphone')) === 'denied') throw e;
    }
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio });
  return { stream, video: false };
}

// Panel «Probar cámara y micrófono»: vista previa, medidor de voz y lista de comprobaciones.
export function mountDeviceCheck(box) {
  box.innerHTML = `
    <p class="note">Antes de practicar, comprueba que VOXA te ve y te escucha. Nada se graba en esta prueba.</p>
    <div class="btns"><button id="dcStart" class="primary">Probar cámara y micrófono</button><button id="dcStop" class="hidden">Terminar prueba</button></div>
    <div id="dcLive" class="hidden" style="margin-top:10px">
      <div class="stage" style="max-width:320px"><video id="dcVideo" playsinline muted></video></div>
      <div class="bar-label"><span>Habla para ver el nivel de tu voz</span><span id="dcLevel"></span></div>
      <div class="meter vol"><div id="dcVol"></div></div>
    </div>
    <ul class="checks" id="dcChecks" style="margin-top:10px"></ul>`;
  let stream = null, ctx = null, raf = 0, peak = 0;
  const env = environment();
  const item = (ok, msg) => `<li class="${ok ? 'ok' : 'warn'}"><span class="i">${ok ? '✓' : '!'}</span><span>${msg}</span></li>`;
  async function renderStatic(extra = '') {
    const [cam, mic] = await Promise.all([permissionState('camera'), permissionState('microphone')]);
    const label = { granted: 'permitido', denied: 'bloqueado', prompt: 'se pedirá al empezar', unknown: 'se pedirá al empezar' };
    $('dcChecks').innerHTML = [
      item(env.secure, env.secure ? 'Conexión segura (https).' : 'La página no es segura (https): el navegador bloqueará la cámara y el micrófono.'),
      item(!env.inApp, env.inApp ? 'Estás en el navegador de otra app: abre el enlace en Chrome o Safari.' : `Navegador: ${env.browser}.`),
      item(cam !== 'denied', `Cámara: ${label[cam]}.${cam === 'denied' ? ' ' + esc(unblockHelp(env)) : ''}`),
      item(mic !== 'denied', `Micrófono: ${label[mic]}.${mic === 'denied' ? ' ' + esc(unblockHelp(env)) : ''}`),
      item(env.speech, env.speech ? 'Transcripción de voz disponible.' : 'Este navegador no transcribe la voz: el ritmo y las muletillas no se medirán (usa Chrome o Edge para tenerlo).'),
    ].join('') + extra;
  }
  renderStatic();
  $('dcStart').addEventListener('click', async () => {
    $('dcStart').disabled = true;
    try {
      const r = await requestMedia();
      stream = r.stream;
      $('dcLive').classList.remove('hidden'); $('dcStop').classList.remove('hidden');
      const v = $('dcVideo');
      if (r.video) { v.srcObject = stream; await v.play(); } else v.parentElement.classList.add('hidden');
      ctx = new AudioContext();
      const an = ctx.createAnalyser(); an.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(2048);
      peak = 0;
      const tick = () => {
        an.getFloatTimeDomainData(buf);
        const lvl = Math.min(1, rmsOf(buf) * 8); peak = Math.max(peak, lvl);
        $('dcVol').style.width = Math.round(lvl * 100) + '%';
        $('dcLevel').textContent = peak > 0.15 ? '¡Te escuchamos bien!' : peak > 0.04 ? 'Se te escucha bajo: acércate al micrófono' : '';
        raf = requestAnimationFrame(tick);
      };
      tick();
      await renderStatic(item(true, r.video ? 'La cámara funciona: deberías verte arriba.' : 'No hay cámara disponible: puedes practicar sólo con la voz.'));
    } catch (e) {
      await renderStatic(item(false, esc(explainError(e, env))));
    } finally { $('dcStart').disabled = false; }
  });
  $('dcStop').addEventListener('click', () => {
    cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); ctx?.close();
    stream = null; $('dcLive').classList.add('hidden'); $('dcStop').classList.add('hidden');
  });
}
