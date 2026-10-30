// Presencia en cámara: conductas observables (no emociones) medidas en el dispositivo con MediaPipe.
// Rostro en cuadro, mirada aproximada a la cámara, sonrisa y movimiento de cabeza. Lo usan Evaluar y el diagnóstico;
// el video nunca sale del teléfono.
import { band } from './audiofile.js';

const BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let loading = null;
// Carga el detector una sola vez; devuelve null si el dispositivo no puede (sin GPU, sin red la primera vez…).
export function loadVision() {
  loading ??= (async () => {
    try {
      const vision = await import(`${BASE}/vision_bundle.mjs`);
      const fileset = await vision.FilesetResolver.forVisionTasks(`${BASE}/wasm`);
      return await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' }, runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true,
      });
    } catch (e) { console.warn('Visión no disponible', e); return null; }
  })();
  return loading;
}

export function analyzeFace(res) {
  if (!res.faceLandmarks || !res.faceLandmarks.length) return { present: false, gaze: false, smile: 0, yaw: 0, pitch: 0 };
  const lm = res.faceLandmarks[0];
  const bs = Object.fromEntries((res.faceBlendshapes?.[0]?.categories || []).map(c => [c.categoryName, c.score]));
  const left = lm[234], right = lm[454], nose = lm[1], top = lm[10], chin = lm[152];
  const yaw = (nose.x - left.x) / (right.x - left.x + 1e-6) - 0.5;      // ~0 = de frente
  const pitch = (nose.y - top.y) / (chin.y - top.y + 1e-6) - 0.55;       // ~0 = de frente
  const eyeOff = Math.max(
    ((bs.eyeLookOutLeft || 0) + (bs.eyeLookInRight || 0)) / 2,
    ((bs.eyeLookInLeft || 0) + (bs.eyeLookOutRight || 0)) / 2,
    ((bs.eyeLookUpLeft || 0) + (bs.eyeLookUpRight || 0)) / 2,
    ((bs.eyeLookDownLeft || 0) + (bs.eyeLookDownRight || 0)) / 2);
  const gaze = Math.abs(yaw) < 0.12 && Math.abs(pitch) < 0.15 && eyeOff < 0.45;
  const smile = ((bs.mouthSmileLeft || 0) + (bs.mouthSmileRight || 0)) / 2;
  return { present: true, gaze, smile, yaw, pitch };
}

const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };

// Resumen de las muestras ({present, gaze, smile, yaw, pitch}); con 5 o menos no se mide (hasVision = false).
export function presenceSummary(faces) {
  const present = faces.filter(f => f.present);
  const hasVision = faces.length > 5;
  return {
    hasVision,
    facePct: hasVision ? present.length / faces.length : null,
    gazePct: hasVision && present.length ? present.filter(f => f.gaze).length / present.length : null,
    smilePct: hasVision && present.length ? present.filter(f => f.smile > 0.35).length / present.length : null,
    headMove: hasVision ? std(present.map(f => f.yaw)) + std(present.map(f => f.pitch)) : null,
  };
}

const level3 = (v, lo, hi) => v < lo ? 'poco' : v > hi ? 'mucho' : 'adecuado';
// Ítems del reporte para la dimensión «presencia» (mismo formato que scoreSpeech).
export function presenceItems(m) {
  if (!m.hasVision) return [];
  const it = (key, label, value, display, target, s) => ({ dim: 'presencia', key, label, value, display, target, s: Math.round(s) });
  return [
    it('face', 'Rostro en cuadro', m.facePct, `${Math.round(m.facePct * 100)}% del tiempo`, '90% o más', band(m.facePct * 100, 90, 100, 50)),
    it('gaze', 'Mirada a cámara', m.gazePct, `${Math.round(m.gazePct * 100)}% del tiempo`, '60% o más', band(m.gazePct * 100, 60, 100, 50)),
    it('smile', 'Sonrisa', m.smilePct, `${Math.round(m.smilePct * 100)}% del tiempo`, '10–60%', band(m.smilePct * 100, 10, 60, 15)),
    it('head', 'Movimiento de cabeza', m.headMove, level3(m.headMove, 0.01, 0.08), 'adecuado', band(m.headMove, 0.01, 0.08, 0.08)),
  ];
}

// Toma muestras de un <video> en vivo a ~10 por segundo hasta que se llame a la función devuelta.
export function sampleVideo(video, detector, out) {
  let last = -1, alive = true;
  const tick = () => {
    if (!alive) return;
    if (video.readyState >= 2 && video.currentTime !== last) {
      last = video.currentTime;
      try { out.push(analyzeFace(detector.detectForVideo(video, performance.now()))); } catch {}
    }
    setTimeout(tick, 100);
  };
  tick();
  return () => { alive = false; };
}
