// Recordatorio diario de práctica: evento repetido en el calendario de la persona (Google Calendar o .ics).
// Sin servidor ni notificaciones push: el calendario se encarga de avisar.
const pad = (n) => String(n).padStart(2, '0');
const TITLE = 'VOXA: tu práctica de 7 minutos';
const DETAIL = 'Abre VOXA y haz la práctica de hoy. Una práctica bien hecha vale más que muchas a medias.';

// Próxima ocurrencia de la hora elegida («HH:MM»), en hora local.
function firstStart(time, now) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(now); d.setHours(h, m, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}
const stamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

export function googleCalendarUrl(time, link = '', now = new Date()) {
  const a = firstStart(time, now), b = new Date(a.getTime() + 10 * 60e3);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: TITLE, details: DETAIL + (link ? `\n${link}` : ''), dates: `${stamp(a)}/${stamp(b)}`, recur: 'RRULE:FREQ=DAILY' });
  return 'https://calendar.google.com/calendar/render?' + q;
}

export function icsReminder(time, link = '', now = new Date()) {
  const a = firstStart(time, now), b = new Date(a.getTime() + 10 * 60e3);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VOXA//Recordatorio//ES', 'BEGIN:VEVENT',
    `UID:voxa-${a.getTime()}@voxa`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(a)}`, `DTEND:${stamp(b)}`, 'RRULE:FREQ=DAILY',
    `SUMMARY:${TITLE}`, `DESCRIPTION:${(DETAIL + (link ? ' ' + link : '')).replace(/[,;]/g, '\\$&')}`,
    'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${TITLE}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
