// La versión publicada (un solo script con todos los módulos) debe compilar: detecta choques de nombres
// entre módulos y que dist/voxa.html no quedó a medio generar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('dist/voxa.html contiene un script que compila', () => {
  const html = readFileSync(new URL('../artifact/dist/voxa.html', import.meta.url), 'utf8');
  assert.ok(html.startsWith('<title>VOXA</title>'), 'empieza con el título, sin esqueleto propio');
  const code = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  assert.ok(code.length > 10000);
  assert.doesNotThrow(() => new vm.Script(code, { filename: 'voxa.html' }));
  assert.ok(!/\{\{[A-Z]+\}\}/.test(html), 'no quedan marcadores {{...}} sin reemplazar');
});
