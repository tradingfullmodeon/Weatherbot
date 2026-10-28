// Compras dentro de la app (App Store y Google Play) con RevenueCat, expuestas a las páginas como window.VOXA_PURCHASES.
// La persona se identifica con el mismo id que usa el servidor, así el aviso de la tienda activa su plan.
// Sólo actúa dentro de la app, con el plugin instalado y la clave pública de RevenueCat inyectada al empaquetar.
(function () {
  const cap = window.Capacitor;
  const plugin = cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.Purchases;
  const keys = window.VOXA_RC_KEYS || {};
  const apiKey = plugin && keys[cap.getPlatform && cap.getPlatform()];
  if (!plugin || !apiKey) return;
  const ENTITLEMENT = window.VOXA_RC_ENTITLEMENT || 'pro';
  const LABELS = { MONTHLY: 'Mensual', ANNUAL: 'Anual', SIX_MONTH: 'Semestral', THREE_MONTH: 'Trimestral', WEEKLY: 'Semanal', LIFETIME: 'Para siempre' };
  let ready = null, byId = {};

  const isPro = (customerInfo) => !!(customerInfo && customerInfo.entitlements && customerInfo.entitlements.active && customerInfo.entitlements.active[ENTITLEMENT]);

  window.VOXA_PURCHASES = {
    available: true,
    init(appUserID) {
      ready = ready || plugin.configure({ apiKey, appUserID });
      return ready;
    },
    async packages() {
      await ready;
      const offerings = await plugin.getOfferings();
      const pkgs = (offerings.current && offerings.current.availablePackages) || [];
      byId = Object.fromEntries(pkgs.map((p) => [p.identifier, p]));
      // El anual primero: es el que más conviene a quien practica todo el año.
      const order = (p) => (p.packageType === 'ANNUAL' ? 0 : p.packageType === 'MONTHLY' ? 1 : 2);
      return pkgs.slice().sort((a, b) => order(a) - order(b)).map((p) => ({
        id: p.identifier, label: LABELS[p.packageType] || p.product.title, price: p.product.priceString,
      }));
    },
    async buy(id) {
      await ready;
      try {
        const r = await plugin.purchasePackage({ aPackage: byId[id] });
        return { isPro: isPro(r.customerInfo) };
      } catch (e) {
        if (e && (e.userCancelled || e.code === '1')) return { cancelled: true };
        throw e;
      }
    },
    async restore() {
      await ready;
      const r = await plugin.restorePurchases();
      return { isPro: isPro(r.customerInfo) };
    },
  };
})();
