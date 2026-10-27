import test from 'node:test';
import assert from 'node:assert/strict';
import { googleCalendarUrl, icsReminder } from '../prototype/reminder.js';

test('el recordatorio empieza en la próxima ocurrencia de la hora elegida y se repite a diario', () => {
  const now = new Date(2026, 9, 27, 20, 0);
  const u = new URL(googleCalendarUrl('08:30', '', now));
  assert.equal(u.searchParams.get('dates'), '20261028T083000/20261028T084000');
  assert.equal(u.searchParams.get('recur'), 'RRULE:FREQ=DAILY');
  assert.match(new URL(googleCalendarUrl('21:15', '', now)).searchParams.get('dates'), /^20261027T211500/);
  const ics = icsReminder('08:30', 'https://x.y/?a=1,2', now);
  assert.match(ics, /DTSTART:20261028T083000\r\n/);
  assert.match(ics, /RRULE:FREQ=DAILY/);
  assert.match(ics, /a=1\\,2/);
});
