// Revisión local de estructura: detecta las partes presentes y ausentes de cada método.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkStructure } from '../prototype/structure.js';
import { SCENARIOS } from '../prototype/scenarios.js';

const missing = (r) => r.parts.filter(p => !p.ok).map(p => p.part);

test('STAR: una respuesta vaga no tiene acción ni resultado; una buena tiene las cuatro partes', () => {
  const vague = checkStructure('Bueno, en mi trabajo anterior creo que hice un proyecto bastante bueno. Era complicado pero lo sacamos adelante con el equipo y quedó bien.', 'STAR');
  assert.ok(missing(vague).includes('Resultado') && missing(vague).includes('Tarea'), JSON.stringify(vague));
  const good = checkStructure('En mi trabajo anterior, cuando las ventas online cayeron, mi objetivo era recuperarlas en un trimestre. Analicé los datos, propuse una campaña nueva y coordiné a tres personas. Logramos subir las ventas un 30% en seis meses.', 'STAR');
  assert.deepEqual(missing(good), []);
  assert.equal(good.score, 100);
});

test('PREP: detecta apertura con muletilla y falta de cierre', () => {
  const r = checkStructure('Bueno, este, me gusta cocinar mucho y lo hago los fines de semana con mi familia, es algo que disfruto bastante la verdad.', 'PREP');
  assert.ok(missing(r).includes('Punto') && missing(r).includes('Razón'));
  const ok = checkStructure('Cocinar es mi mejor forma de desconectarme. Lo disfruto porque me obliga a estar presente. Por ejemplo, el domingo hice pan con mi hija y no miré el celular en tres horas. Por eso cocinar es mi forma de desconectarme.', 'PREP');
  assert.deepEqual(missing(ok), []);
});

test('BLUF y SBI; métodos sin revisión local devuelven null', () => {
  assert.ok(missing(checkStructure('Te escribo por el proyecto. Avanzamos con el diseño y la maqueta. Ya casi está. Al final, ¿me puedes aprobar el presupuesto hoy?', 'BLUF')).includes('Conclusión o pedido al inicio'));
  assert.deepEqual(missing(checkStructure('En la reunión del lunes interrumpiste dos veces al cliente mientras presentaba. Eso hizo que no pudiera terminar su idea y se fue molesto.', 'SBI + CNV')), []);
  assert.equal(checkStructure('Un texto cualquiera con bastantes palabras para pasar el mínimo de quince palabras sin problema alguno.', 'Libre'), null);
  for (const s of SCENARIOS.filter(x => /^(PREP|STAR|BLUF|SBI)/.test(x.method))) assert.ok(s.id);
});

test('STAR no premia respuestas vacías y reconoce resultados en tercera persona; BLUF con pregunta inicial', () => {
  const empty = checkStructure('En 2019 cuando tenía que trabajar ahí yo estaba aburrido, así nomás, la verdad es que no pasó nada.', 'STAR');
  assert.ok(empty.score <= 50, JSON.stringify(empty.parts));
  const third = checkStructure('En mi trabajo anterior, cuando había muchos reclamos, mi tarea era bajarlos. Armé un protocolo y capacité al equipo. Los reclamos bajaron a la mitad.', 'STAR');
  assert.equal(third.score, 100, JSON.stringify(third.parts));
  const bluf = checkStructure('¿Podemos mover la entrega al viernes? El proveedor llega el jueves y necesitamos un día para revisar la calidad.', 'BLUF');
  assert.ok(bluf.parts[0].ok);
  const spoken = checkStructure('cocinar es mi mejor forma de desconectarme lo disfruto mucho porque me obliga a estar presente por ejemplo el domingo hice pan con mi hija y no miré el celular en tres horas y la verdad fue increíble por eso cocinar es mi forma de desconectarme', 'PREP');
  assert.equal(spoken.score, 100, JSON.stringify(spoken.parts));
});

test('STAR reconoce pretéritos irregulares y el «nosotros» del equipo como acción', () => {
  const r = checkStructure('En mi práctica, cuando el equipo no se ponía de acuerdo, mi tarea era entregar el informe. Propuse dividir las tareas y hablé con cada uno. Logramos entregarlo dos días antes.', 'STAR');
  assert.deepEqual(r.parts.filter(p => !p.ok).map(p => p.part), []);
});
