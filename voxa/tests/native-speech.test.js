// La transcripción nativa de la app instalable imita la Web Speech API que usan las páginas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../app/native-speech.js', import.meta.url), 'utf8');

function fakePlugin() {
  const listeners = {};
  return {
    listeners,
    requestPermissions: async () => ({ speechRecognition: 'granted' }),
    addListener: async (name, fn) => { listeners[name] = fn; return { remove() { delete listeners[name]; } }; },
    start: async () => {},
    stop: async () => { listeners.listeningState?.({ status: 'stopped' }); },
  };
}

test('en la web no cambia nada', () => {
  const window = {};
  vm.runInNewContext(code, { window });
  assert.equal(window.SpeechRecognition, undefined);
});

test('en la app entrega resultados parciales, el final al detenerse y luego onend', async () => {
  const plugin = fakePlugin();
  const window = { Capacitor: { isNativePlatform: () => true, Plugins: { SpeechRecognition: plugin } } };
  vm.runInNewContext(code, { window });
  const rec = new window.SpeechRecognition();
  const got = []; let ended = 0;
  rec.onresult = (ev) => got.push([ev.results[0][0].transcript, ev.results[0].isFinal]);
  rec.onend = () => ended++;
  await rec.start();
  plugin.listeners.partialResults({ matches: ['hola a'] });
  plugin.listeners.partialResults({ matches: ['hola a todos'] });
  rec.stop();
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(got, [['hola a', false], ['hola a todos', false], ['hola a todos', true]]);
  assert.equal(ended, 1);
  assert.deepEqual(Object.keys(plugin.listeners), []);
  // Reinicio tras un silencio (como hace la práctica): la segunda sesión también cierra con su resultado.
  await rec.start();
  plugin.listeners.partialResults({ matches: ['y gracias'] });
  rec.stop();
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(got.at(-1), ['y gracias', true]);
  assert.equal(ended, 2);
});

test('sin permiso avisa con el mismo error que el navegador', async () => {
  const plugin = { ...fakePlugin(), requestPermissions: async () => ({ speechRecognition: 'denied' }) };
  const window = { Capacitor: { isNativePlatform: () => true, Plugins: { SpeechRecognition: plugin } } };
  vm.runInNewContext(code, { window });
  const rec = new window.SpeechRecognition();
  let err = null, ended = 0;
  rec.onerror = (e) => { err = e.error; }; rec.onend = () => ended++;
  await rec.start();
  assert.equal(err, 'not-allowed'); assert.equal(ended, 1);
});
