// Transcripción nativa en la app instalable: el reconocimiento de voz del teléfono (gratis, sin servidor)
// expuesto con la misma forma que la Web Speech API, para que las páginas de VOXA no cambien.
// Sólo actúa dentro de la app (Capacitor) y si el plugin está instalado; en la web no hace nada.
(function () {
  const cap = window.Capacitor;
  const plugin = cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.SpeechRecognition;
  if (!plugin || window.SpeechRecognition) return;

  const result = (text, isFinal) => {
    const r = [{ transcript: text, confidence: 1 }];
    r.isFinal = isFinal;
    return { resultIndex: 0, results: [r] };
  };

  class NativeSpeechRecognition {
    constructor() {
      this.lang = 'es-419'; this.continuous = true; this.interimResults = true;
      this.onresult = null; this.onend = null; this.onerror = null;
      this._last = ''; this._subs = [];
    }
    async start() {
      this._done = false; this._last = '';   // las páginas reinician el dictado tras un silencio
      try {
        const perm = await plugin.requestPermissions();
        if (perm && perm.speechRecognition && perm.speechRecognition !== 'granted') throw { error: 'not-allowed' };
        this._subs.push(await plugin.addListener('partialResults', (d) => {
          this._last = (d.matches && d.matches[0]) || '';
          if (this.interimResults && this.onresult) this.onresult(result(this._last, false));
        }));
        this._subs.push(await plugin.addListener('listeningState', (d) => { if (d.status === 'stopped' || d.state === 'stopped') this._finish(); }));
        this._subs.push(await plugin.addListener('error', (d) => {
          const code = String((d && d.code) || 'unknown');
          if (this.onerror) this.onerror({ error: /permis|denied|authori/i.test(code + (d && d.message)) ? 'not-allowed' : /no.?(match|speech)/i.test(code) ? 'no-speech' : code });
        }));
        // Con puntuación (iOS 16+), la estructura PREP/STAR se detecta mejor.
        await plugin.start({ language: this.lang, partialResults: true, popup: false, maxResults: 1, addPunctuation: true });
      } catch (e) {
        if (this.onerror) this.onerror({ error: e && e.error ? e.error : 'service-not-allowed' });
        this._finish();
      }
    }
    stop() { plugin.stop().catch(() => this._finish()); }
    abort() { this.stop(); }
    _finish() {
      if (this._done) return;
      this._done = true;
      if (this._last && this.onresult) this.onresult(result(this._last, true));
      this._subs.forEach((s) => s.remove && s.remove());
      this._subs = [];
      if (this.onend) this.onend();
    }
  }
  window.SpeechRecognition = NativeSpeechRecognition;
})();
