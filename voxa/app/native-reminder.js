// Aviso diario de práctica como notificación del teléfono (sin servidor ni push), expuesto como window.VOXA_NATIVE_REMINDER.
// En la web el recordatorio sigue siendo un evento de calendario (prototype/reminder.js).
(function () {
  const cap = window.Capacitor;
  const plugin = cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.LocalNotifications;
  if (!plugin) return;
  const ID = 7001, RENEWAL_ID = 7002;
  window.VOXA_NATIVE_REMINDER = {
    async set(time) {
      const perm = await plugin.requestPermissions();
      if (!perm || perm.display !== 'granted') return false;
      const [hour, minute] = String(time || '08:30').split(':').map(Number);
      await plugin.cancel({ notifications: [{ id: ID }] });
      await plugin.schedule({ notifications: [{
        id: ID, title: 'Talkride: tu práctica de 7 minutos',
        body: 'Una práctica bien hecha vale más que muchas a medias. ¿Vamos?',
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      }] });
      return true;
    },
    async cancel() { await plugin.cancel({ notifications: [{ id: ID }] }); },
    // Promesa de «Cobro sin sorpresas»: aviso 3 días antes de la renovación (until en segundos, de /api/me).
    async renewalNotice(until, now = Date.now()) {
      const at = new Date(until * 1000 - 3 * 86400e3);
      await plugin.cancel({ notifications: [{ id: RENEWAL_ID }] });
      if (!until || at.getTime() <= now) return false;
      const perm = await plugin.requestPermissions();
      if (!perm || perm.display !== 'granted') return false;
      await plugin.schedule({ notifications: [{
        id: RENEWAL_ID, title: 'Talkride Pro se renueva en 3 días',
        body: 'Si no quieres seguir, cancélalo desde las suscripciones de tu tienda antes de esa fecha. Lo gratis sigue gratis.',
        schedule: { at, allowWhileIdle: true },
      }] });
      return true;
    },
  };
})();
