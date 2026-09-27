/* Canta Corazón · Demo · trabajo sin internet.
   1) Registra la memoria sin internet (sw.js): todo el demo queda guardado en el dispositivo.
   2) Todo lo que se hace se guarda primero aquí (localStorage) y entra a una cola de subida.
   3) Sin red, la cola crece; cuando regresa la red, se sube sola.
   En el demo la subida se simula (no hay servidor); en la fase real la cola va a la base de Canta Corazón
   y de ahí a las demás tabletas y teléfonos. */
(function () {
  'use strict';
  const COLA = 'cc_cola_v1', ULTIMA = 'cc_sync_ultima';
  const subs = new Set();
  let subiendo = false, listo = false, recienSubidos = 0;
  const base = new URL('../', document.currentScript.src).href; // la carpeta del demo (shared/..)
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || local)) {
    navigator.serviceWorker.register(base + 'sw.js', { scope: base }).then(() => navigator.serviceWorker.ready).then(() => { listo = true; avisar(); }).catch(() => { });
  }
  const leer = () => { try { return JSON.parse(localStorage.getItem(COLA) || '[]'); } catch (e) { return []; } };
  const escribir = (q) => { try { localStorage.setItem(COLA, JSON.stringify(q.slice(-500))); } catch (e) { } };
  function estado() { return { enLinea: navigator.onLine, pendientes: leer().length, subiendo, listo, ultima: Number(localStorage.getItem(ULTIMA) || 0), recienSubidos }; }
  function avisar() { const e = estado(); subs.forEach(fn => { try { fn(e); } catch (x) { } }); }
  function subir() {
    if (subiendo || !navigator.onLine) return;
    const q = leer(); if (!q.length) return;
    subiendo = true; avisar();
    setTimeout(() => {
      escribir(leer().slice(q.length)); localStorage.setItem(ULTIMA, String(Date.now()));
      subiendo = false; recienSubidos = q.length; avisar();
      setTimeout(() => { recienSubidos = 0; avisar(); }, 4000);
      subir();
    }, 500 + Math.min(1500, q.length * 80));
  }
  if (window.CC) CC.on((origen) => {
    if (origen !== 'local') return; // cada pestaña encola solo lo que hizo ella
    const q = leer(); q.push({ t: Date.now(), que: ((CC.db.bitacora || [])[0] || {}).que || 'Cambio' }); escribir(q); avisar(); subir();
  });
  window.addEventListener('online', () => { avisar(); subir(); });
  window.addEventListener('offline', avisar);
  window.addEventListener('storage', (e) => { if (e.key === COLA) avisar(); });
  window.CCSync = { estado, subir, on(fn) { subs.add(fn); fn(estado()); return () => subs.delete(fn); } };
  subir();
})();
