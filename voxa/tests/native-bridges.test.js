// Puentes de la app instalable: compras (RevenueCat) y aviso diario (notificación local).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const load = (f, window) => vm.runInNewContext(readFileSync(new URL(`../app/${f}`, import.meta.url), 'utf8'), { window });
// Los objetos creados dentro de vm son de otro «realm»: se comparan por valor.
const plain = (x) => JSON.parse(JSON.stringify(x));
const native = (plugins, extra = {}) => ({ Capacitor: { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: plugins }, ...extra });

test('sin la app, sin plugin o sin clave, no aparece la compra', () => {
  for (const w of [{}, native({}), native({ Purchases: {} })]) { load('native-purchases.js', w); assert.equal(w.VOXA_PURCHASES, undefined); }
});

test('compra: id del servidor, anual primero, Pro por el derecho «voxa_pro» y cancelación sin error', async () => {
  const calls = [];
  const pkg = (identifier, packageType, priceString) => ({ identifier, packageType, product: { title: identifier, priceString } });
  const Purchases = {
    configure: async (o) => calls.push(['configure', o]),
    getOfferings: async () => ({ current: { availablePackages: [pkg('$rc_monthly', 'MONTHLY', '$5.99'), pkg('$rc_annual', 'ANNUAL', '$39.99')] } }),
    purchasePackage: async ({ aPackage }) => {
      if (aPackage.identifier === '$rc_monthly') throw Object.assign(new Error('cancelada'), { code: '1', userCancelled: true });
      return { customerInfo: { entitlements: { active: { voxa_pro: {} } } } };
    },
    restorePurchases: async () => ({ customerInfo: { entitlements: { active: {} } } }),
  };
  const w = native({ Purchases }, { VOXA_RC_KEYS: { android: 'goog_pub', ios: '' } });
  load('native-purchases.js', w);
  const store = w.VOXA_PURCHASES;
  assert.equal(store.test, false);
  await store.init('d123456789'); await store.init('d123456789');
  assert.deepEqual(plain(calls), [['configure', { apiKey: 'goog_pub', appUserID: 'd123456789' }]]);
  const list = await store.packages();
  assert.deepEqual(plain(list.map(p => [p.label, p.price])), [['Anual', '$39.99'], ['Mensual', '$5.99']]);
  assert.deepEqual(plain(await store.buy('$rc_annual')), { isPro: true });
  assert.deepEqual(plain(await store.buy('$rc_monthly')), { cancelled: true });
  assert.deepEqual(plain(await store.restore()), { isPro: false });
});

test('aviso diario: pide permiso, reemplaza el anterior y se repite a la hora elegida', async () => {
  const calls = [];
  const LocalNotifications = {
    requestPermissions: async () => ({ display: 'granted' }),
    cancel: async (o) => calls.push(['cancel', o.notifications[0].id]),
    schedule: async (o) => calls.push(['schedule', o.notifications[0].schedule]),
  };
  const w = native({ LocalNotifications });
  load('native-reminder.js', w);
  assert.equal(await w.VOXA_NATIVE_REMINDER.set('19:45'), true);
  assert.deepEqual(plain(calls), [['cancel', 7001], ['schedule', { on: { hour: 19, minute: 45 }, allowWhileIdle: true }]]);
  const denied = native({ LocalNotifications: { ...LocalNotifications, requestPermissions: async () => ({ display: 'denied' }) } });
  load('native-reminder.js', denied);
  assert.equal(await denied.VOXA_NATIVE_REMINDER.set('08:30'), false);
});

test('aviso de renovación 3 días antes; nada si ya pasó la fecha', async () => {
  const calls = [];
  const LocalNotifications = {
    requestPermissions: async () => ({ display: 'granted' }),
    cancel: async (o) => calls.push(['cancel', o.notifications[0].id]),
    schedule: async (o) => calls.push(['schedule', o.notifications[0].id, o.notifications[0].schedule.at.getTime()]),
  };
  const w = native({ LocalNotifications });
  load('native-reminder.js', w);
  const now = Date.UTC(2026, 9, 28), until = now / 1000 + 30 * 86400;
  assert.equal(await w.VOXA_NATIVE_REMINDER.renewalNotice(until, now), true);
  assert.deepEqual(plain(calls), [['cancel', 7002], ['schedule', 7002, until * 1000 - 3 * 86400e3]]);
  calls.length = 0;
  assert.equal(await w.VOXA_NATIVE_REMINDER.renewalNotice(now / 1000 + 86400, now), false);
  assert.deepEqual(plain(calls), [['cancel', 7002]]);
});

test('con la clave de la Test Store, la compra se marca como prueba', () => {
  const w = native({ Purchases: { configure: async () => {} } }, { VOXA_RC_KEYS: { android: 'test_abc', ios: '' } });
  load('native-purchases.js', w);
  assert.equal(w.VOXA_PURCHASES.test, true);
});
