// Simulacro de entrevista sin IA: repregunta, no repite y puntúa la estructura.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInterview, interviewNext, interviewScore, interviewDone, currentQuestion, quoteSaid } from '../prototype/interview.js';

test('repregunta el resultado una vez y no vuelve a pedir un logro ya contado', () => {
  const st = createInterview(), said = [];
  const say = (t) => { said.push(t); return interviewNext(st, t, said); };
  assert.match(say('Hola, soy Ana, recién titulada.'), /por qué te interesa/i);
  assert.match(say('Lideré una campaña y armé el plan; las ventas subieron un 30% en seis meses.'), /Ya me contaste un logro/);
  assert.equal(currentQuestion(st).id, 'conflicto');
  assert.match(say('En mi práctica, cuando el equipo discutía el plan, mi tarea era ordenar el trabajo. Propuse dividir las tareas y hablé con cada uno.'), /resultado/);
  assert.match(say('Entregamos el informe dos días antes.'), /error/);
  say('Una vez me equivoqué en una cifra del informe.');
  say('No sé, la verdad.');
  assert.ok(!interviewDone(st));
  assert.equal(interviewScore(st, { fluidez: 100 }).total <= 70, true);   // sin terminar: tope 70
  say('¿Cómo es un día normal en el equipo?');
  assert.ok(interviewDone(st));
});

test('las citas de la evaluación sólo se muestran si la persona las dijo', () => {
  assert.ok(quoteSaid('subieron un 30 %', ['Las ventas subieron un 30% en seis meses.']));
  assert.ok(!quoteSaid('dupliqué las ventas', ['Las ventas subieron un 30%.']));
});

test('las respuestas modelo del simulacro cumplen su propia estructura STAR', async () => {
  const { INTERVIEW_QUESTIONS } = await import('../prototype/interview.js');
  const { checkStructure } = await import('../prototype/structure.js');
  for (const q of INTERVIEW_QUESTIONS.filter(x => x.star)) assert.equal(checkStructure(q.model, 'STAR').score, 100, q.id);
});
