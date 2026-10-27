// Análisis de grabaciones (archivo o micrófono): voz, tono, pausas y sonidos de duda, y puntaje del habla.
// Lo usan la versión publicada (artifact/app.js) y diagnostico.html.
import { detectPitch, rmsOf, findFilledPauses, wordCount, countMatches, FILLER_RE, HEDGE_RE, mean, std } from './shared.js';

export const band = (v, lo, hi, soft) => v >= lo && v <= hi ? 100 : Math.max(0, 100 - 100 * (v < lo ? lo - v : v - hi) / soft);
// Decodifica la grabación a 16 kHz y la recorre en ventanas de ~64 ms cada ~33 ms: volumen, tono y pausas.
export const SR = 16000, MAX_SECONDS = 300;
// Lectura en tres intentos, porque cada navegador decodifica formatos distintos (el .MOV del iPhone suele
// fallar en el primero): 1) decodificar a 16 kHz, 2) decodificar con el contexto de audio normal (incluida la
// forma con callbacks del Safari antiguo) y bajar la frecuencia, 3) si nada funciona, reproducir el archivo en
// silencio y medirlo mientras suena (analyzeByPlayback, que necesita un toque de la persona).
export async function decodeFile(f) {
  const buf = await f.arrayBuffer();
  try { return await new OfflineAudioContext(1, SR, SR).decodeAudioData(buf.slice(0)); } catch {}
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const audio = await new Promise((ok, fail) => { const p = ctx.decodeAudioData(buf.slice(0), ok, fail); if (p?.then) p.then(ok, fail); });
    ctx.close?.();
    return audio;
  } catch {}
  return null;
}

// Mezcla a mono y baja a ~16 kHz promediando bloques (suficiente para tono de voz y volumen).
export function toMono16k(audio, maxSeconds) {
  const sr = audio.sampleRate, ch = audio.numberOfChannels, len = Math.min(audio.length, Math.round(maxSeconds * sr));
  const factor = Math.max(1, Math.floor(sr / SR)), outLen = Math.floor(len / factor), out = new Float32Array(outLen);
  for (let c = 0; c < ch; c++) {
    const d = audio.getChannelData(c);
    for (let i = 0; i < outLen; i++) { let acc = 0; for (let k = 0; k < factor; k++) acc += d[i * factor + k]; out[i] += acc / factor / ch; }
  }
  return { data: out, rate: sr / factor, truncated: audio.length > len, duration: len / sr };
}

export async function framesFrom(data, rate, onProgress) {
  const hop = Math.round(rate / 30), win = Math.round(rate * 0.064), out = [];
  for (let i = 0, k = 0; i + win <= data.length; i += hop, k++) {
    const frame = data.subarray(i, i + win);
    const rms = rmsOf(frame);
    out.push({ t: i / rate, rms, pitch: rms > 0.01 ? detectPitch(frame, rate) : 0 });
    if (k % 300 === 0) { onProgress(i / data.length); await new Promise(r => setTimeout(r)); }
  }
  onProgress(1);
  return out;
}

export async function analyzeAudio(f, onProgress) {
  if (f.size > 150e6) throw new Error('La grabación pesa más de 150 MB. Recórtala a unos pocos minutos.');
  const audio = await decodeFile(f);
  if (!audio) { const e = new Error('needs-playback'); e.code = 'needs-playback'; throw e; }
  const m = toMono16k(audio, MAX_SECONDS);
  return { samples: await framesFrom(m.data, m.rate, onProgress), truncated: m.truncated, duration: m.duration };
}

// Plan C: reproduce la grabación sin sonido hacia los parlantes y la mide en tiempo real. Tarda lo que dura.
export async function analyzeByPlayback(f, onProgress) {
  const url = URL.createObjectURL(f);
  const el = document.createElement(f.type.startsWith('audio/') ? 'audio' : 'video');
  el.playsInline = true; el.preload = 'auto'; el.src = url;
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  try {
    const src = ctx.createMediaElementSource(el);
    const an = ctx.createAnalyser(); an.fftSize = 2048;
    const mute = ctx.createGain(); mute.gain.value = 0;     // Safari sólo procesa nodos conectados a la salida
    src.connect(an); an.connect(mute); mute.connect(ctx.destination);
    await ctx.resume();
    await el.play();
    await new Promise((ok, fail) => { if (el.readyState >= 1) ok(); else { el.onloadedmetadata = ok; el.onerror = () => fail(new Error('No pudimos reproducir la grabación.')); } });
    const total = Math.min(isFinite(el.duration) ? el.duration : MAX_SECONDS, MAX_SECONDS);
    const buf = new Float32Array(an.fftSize), out = [];
    await new Promise((ok) => {
      const timer = setInterval(() => {
        an.getFloatTimeDomainData(buf);
        const rms = rmsOf(buf), t = el.currentTime;
        out.push({ t, rms, pitch: rms > 0.01 ? detectPitch(buf, ctx.sampleRate) : 0 });
        onProgress(Math.min(1, t / total));
        if (el.ended || t >= total) { clearInterval(timer); ok(); }
      }, 33);
    });
    onProgress(1);
    return { samples: out, truncated: el.duration > total, duration: total };
  } finally { el.pause(); ctx.close?.(); URL.revokeObjectURL(url); }
}

export function voiceMetrics(samples, text, dur) {
  const minutes = Math.max(dur / 60, 1 / 60);
  const words = wordCount(text);
  const rmsSorted = samples.map(s => s.rms).sort((a, b) => a - b);
  const noise = rmsSorted[Math.floor(rmsSorted.length * 0.1)] || 0;
  const thr = Math.max(0.006, noise * 1.3 + 0.004);
  let speechFrames = 0, longPauses = 0, pauseStart = null;
  const pauseZones = [];
  for (const s of samples) {
    if (s.rms > thr) {
      speechFrames++;
      if (pauseStart !== null && s.t - pauseStart > 2.5) { longPauses++; pauseZones.push([pauseStart, s.t]); }
      pauseStart = null;
    } else if (pauseStart === null) pauseStart = s.t;
  }
  // Un silencio que dura hasta el final también cuenta (antes quedaba abierto y no se contaba).
  const end = samples.length ? samples[samples.length - 1].t : 0;
  if (pauseStart !== null && end - pauseStart > 2.5) { longPauses++; pauseZones.push([pauseStart, end]); }
  const voiced = samples.filter(s => s.pitch > 0).map(s => s.pitch);
  const medF0 = voiced.length ? [...voiced].sort((a, b) => a - b)[Math.floor(voiced.length / 2)] : 0;
  const pitchVar = std(voiced.map(f => 12 * Math.log2(f / medF0)).filter(x => Math.abs(x) < 12));
  const speechRms = samples.filter(s => s.rms > thr).map(s => s.rms);
  const volCv = speechRms.length ? std(speechRms) / mean(speechRms) : 0;
  const humZones = findFilledPauses(samples);
  return {
    dur, words, wpm: words / minutes, hasText: words > 0,
    fillers: countMatches(text, FILLER_RE), hedges: countMatches(text, HEDGE_RE),
    speechRatio: samples.length ? speechFrames / samples.length : 0, longPauses, pauseZones,
    speechSeconds: samples.length ? dur * speechFrames / samples.length : 0, variety: guiraud(text),
    humZones, humsPerMin: humZones.length / minutes, pitchVar, medF0, volCv,
  };
}

// Variedad de vocabulario (índice de Guiraud: palabras distintas / √palabras). Evita premiar el relleno repetido.
export function guiraud(text) {
  const w = (text.toLowerCase().match(/\p{L}+/gu) || []);
  return w.length ? new Set(w).size / Math.sqrt(w.length) : 0;
}
// Mínimo de voz para puntuar una grabación: con menos, el puntaje no significa nada.
export const MIN_SPEECH_SECONDS = 4;

const level3 = (v, lo, hi) => v < lo ? 'poco' : v > hi ? 'mucho' : 'adecuado';
export function scoreSpeech(m, isAudio, seconds) {
  const items = [], s = { seconds };
  if (isAudio && !(m.speechSeconds >= MIN_SPEECH_SECONDS)) return { items, dims: {}, total: null, noVoice: true };
  const add = (dim, key, label, display, target, sc) => items.push({ dim, key, label, display, target, s: Math.round(sc) });
  if (m.hasText) {
    const minutes = isAudio ? Math.max(m.dur / 60, 1 / 60) : Math.max(m.words / 140, 1 / 60);
    // Con un texto parcial (la persona escribió sólo una parte de lo que dijo) el ritmo saldría falso.
    m.partialText = isAudio && m.wpm < 70;
    if (isAudio && !m.partialText) add('voz', 'wpm', 'Ritmo', `${Math.round(m.wpm)} palabras/min`, '120–165', band(m.wpm, 120, 165, 60));
    add('voz', 'fillers', 'Muletillas («este», «o sea»…)', `${m.fillers}`, isAudio ? 'menos de 3 por min' : 'ninguna', isAudio ? band(m.fillers / minutes, 0, 3, 7) : band(m.fillers, 0, 0, 4));
    add('lenguaje', 'hedges', 'Frases que restan seguridad', `${m.hedges}`, 'pocas', band(m.hedges / minutes, 0, 1.5, 4));
    const target = s.seconds * (isAudio ? 1.7 : 2);
    const variety = m.variety ?? guiraud(m.text || '');
    // El largo sólo cuenta como desarrollo si hay ideas distintas: repetir relleno no desarrolla nada.
    const varietyFactor = m.words >= 25 ? Math.min(1, variety / 4) : 1;
    add('lenguaje', 'length', 'Contenido desarrollado', `${m.words} palabras`, `${Math.round(target)} o más`, band(m.words, target, 1e6, target) * varietyFactor);
    if (m.words >= 25) add('lenguaje', 'variety', 'Variedad de vocabulario', variety.toFixed(1), '4 o más', band(variety, 4, 1e6, 3));
  }
  if (isAudio) {
    add('voz', 'hums', 'Sonidos de duda «eeh/mmm» (estimado)', `${m.humsPerMin.toFixed(1)} por min (${m.humZones.length})`, 'menos de 2 por min', band(m.humsPerMin, 0, 2, 6));
    if (m.medF0) add('voz', 'pitch', 'Variación de tono', `${m.pitchVar.toFixed(1)} semitonos`, '2 a 6 semitonos', band(m.pitchVar, 2, 6, 1.8));
    add('voz', 'speech', 'Tiempo hablando', `${Math.round(m.speechRatio * 100)}% del tiempo`, '55–90%', band(m.speechRatio * 100, 55, 90, 35));
    add('voz', 'pauses', 'Silencios largos (más de 2,5 s)', `${m.longPauses}`, '0 a 2', band(m.longPauses, 0, 2, 4));
    add('voz', 'volume', 'Énfasis con el volumen', `${level3(m.volCv, 0.3, 0.9)} (${Math.round(m.volCv * 100)}%)`, 'adecuado', band(m.volCv, 0.3, 0.9, 0.6));
    add('voz', 'duration', 'Duración', `${Math.round(m.dur)} s`, `≈ ${s.seconds} s`, band(m.dur, s.seconds * 0.7, s.seconds * 1.3, s.seconds * 0.6));
  }
  const dims = {};
  for (const d of ['voz', 'lenguaje']) { const xs = items.filter(i => i.dim === d); if (xs.length) dims[d] = Math.round(mean(xs.map(i => i.s))); }
  const total = Math.round(mean(items.map(i => i.s)));
  return { items, dims, total };
}
