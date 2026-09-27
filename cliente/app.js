/* Canta Corazón · App del cliente (demo): navegación con botón regresar, Mi noche con QR, reservar en el plano,
   pagar y dividir, amigos, puntos y perfil. Las promociones viven en promos.js y la entrada con cuenta en entrar.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = CC.money;
  const esApple = /iPhone|iPad|Macintosh/.test(navigator.userAgent);
  const AP = esApple ? ' Pay' : 'Apple Pay';
  const SVG = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
  const I = {
    promos: SVG('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6"/>'),
    reservar: SVG('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
    noche: SVG('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><path d="M13.5 13.5h3v3h-3zM17 17h3v3h-3zM17 13.5h3M13.5 20h3"/>'),
    amigos: SVG('<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.8"/><path d="M2.5 20c.5-4 3.5-6 6.5-6s6 2 6.5 6M15 14.5c2.8 0 5.5 1.6 6 5.5"/>'),
    perfil: SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.5 4-7 8-7s7.2 2.5 8 7"/>'),
    zoom: SVG('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    x: SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
    ir: SVG('<path d="M9 5l7 7-7 7"/>'),
    estrella: SVG('<path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9L6.7 19.5l1.1-6L3.4 9.3l6-.8z"/>'),
    salir: SVG('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>')
  };

  // ── sesión (por pestaña, para poder ser dos amigos a la vez) ──
  const qs = new URLSearchParams(location.search);
  if (qs.get('user')) sessionStorage.setItem('cc_user', qs.get('user'));
  if (qs.get('suc')) sessionStorage.setItem('cc_suc', qs.get('suc'));
  let userId = sessionStorage.getItem('cc_user') || 'c1';
  let sucId = sessionStorage.getItem('cc_suc') || 's1';
  // si llegó desde la tarjeta de la mesa (?mesa=14), la app sabe en qué mesa está
  const mesaCtx = qs.get('mesa') ? { num: Number(qs.get('mesa')), suc: qs.get('suc') || 's1' } : null;
  const user = () => CC.cliente(userId) || CC.db.clientes[0];
  const setUser = (id) => { userId = id; sessionStorage.setItem('cc_user', id); render(); };
  const setSuc = (id) => { sucId = id; sessionStorage.setItem('cc_suc', id); render({ quieto: true }); };

  // ── avisos y hojas ──
  let toastT = null;
  function toast(msg) { const t = $('#toast'); t.innerHTML = `<div class="toast">${esc(msg)}</div>`; clearTimeout(toastT); toastT = setTimeout(() => t.innerHTML = '', 2800); }
  function sheet(html, dark = false) {
    $('#overlay').innerHTML = `<div class="sheet-bg" id="sheetBg"><div class="sheet ${dark ? 'dark' : ''}" role="dialog" aria-modal="true">${dark ? '' : '<div class="handle"></div>'}${html}</div></div>`;
    $('#sheetBg').addEventListener('click', (e) => { if (e.target.id === 'sheetBg') closeSheet(); });
    const c = $('#cls'); if (c) c.onclick = closeSheet;
    return $('#sheetBg');
  }
  function closeSheet() { $('#overlay').innerHTML = ''; }
  const cab = (titulo) => `<div class="sh-h"><b>${titulo}</b><button class="link" id="cls">Cerrar</button></div>`;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if ($('.qrfull')) $('.qrfull').remove(); else closeSheet(); } });

  // ── navegación con historial propio: el botón regresar siempre sabe a dónde ir ──
  const VISTAS = {};
  const TAB_DE = { recompensas: 'perfil', entrar: 'perfil' };
  const NAV = [['promos', 'Promos'], ['reservar', 'Reservar'], ['noche', 'Mi noche'], ['amigos', 'Amigos'], ['perfil', 'Perfil']];
  let view = 'noche'; const pila = [];
  function go(v) { if (v === view) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } if (view !== 'entrar') pila.push(view); if (pila.length > 40) pila.shift(); view = v; history.replaceState(null, '', location.pathname + location.search + '#' + v); render(); }
  function back() {
    if (view === 'reservar' && R.paso > 1) { R.paso = (R.paso === 4 && (R.tipo === 'cover' || R.tipo === 'barra')) ? 1 : R.paso - 1; render(); return; }
    const p = pila.pop();
    if (p) { view = p; history.replaceState(null, '', location.pathname + location.search + '#' + p); render(); } else location.href = '../';
  }
  function renderNav() {
    const activo = TAB_DE[view] || view; const sinLeer = window.PR ? PR.sinLeer() : 0;
    $('#nav').innerHTML = NAV.map(([id, l]) => `<button data-v="${id}" class="${activo === id ? 'on' : ''}" ${activo === id ? 'aria-current="page"' : ''}>${I[id]}<span>${l}</span>${id === 'promos' && sinLeer ? `<i class="dot" aria-label="${sinLeer} sin ver">${sinLeer}</i>` : ''}</button>`).join('');
    $$('#nav button').forEach(b => b.onclick = () => go(b.dataset.v));
  }

  // ── sin internet: aviso arriba ──
  function pintarRed(e) {
    const el = $('#red'); if (!el) return;
    if (!e.enLinea) el.innerHTML = `<div class="red"><i></i><span><b>Sin conexión.</b> Tu QR y tu noche siguen funcionando.${e.pendientes ? ` ${e.pendientes} ${e.pendientes === 1 ? 'cambio guardado' : 'cambios guardados'} en tu teléfono; se suben solos al volver la red.` : ''}</span></div>`;
    else if (e.recienSubidos) el.innerHTML = `<div class="red ok"><i></i><span><b>Volvió la conexión.</b> ${e.recienSubidos} ${e.recienSubidos === 1 ? 'cambio subido' : 'cambios subidos'}.</span></div>`;
    else el.innerHTML = '';
  }

  // ── datos del usuario ──
  function misReservasHoy() { const u = user(); return CC.db.reservas.filter(r => r.fecha === CC.hoy() && r.estado !== 'liberada' && r.estado !== 'noshow' && (r.clienteId === u.id || (r.grupo || []).some(g => g.clienteId === u.id))); }
  function enLocal(clienteId) { const c = CC.cliente(clienteId); return CC.db.reservas.some(r => r.fecha === CC.hoy() && r.entradas && r.entradas[clienteId]) || CC.db.accesos.some(a => a.fecha === CC.hoy() && a.nombre === c.nombre && a.resultado === 'ok'); }
  const primerNombre = (id) => ((CC.cliente(id) || {}).nombre || '').split(' ')[0];

  // ═══════════════ MI NOCHE ═══════════════
  VISTAS.noche = function () {
    const u = user(); const res = misReservasHoy(); const s = CC.suc(sucId); const n = CC.M.noche(sucId);
    const parts = [`<h1>Hola, ${esc(u.nombre.split(' ')[0])}. <em>Tu noche.</em></h1><p class="sub">${esc(CC.fechaLarga(CC.hoy()))} · ${esc(s.nombre)}</p>`];
    const aviso = avisoMesa(res); if (aviso) parts.push(aviso);
    if (!res.length) {
      parts.push(`<div class="hero"><img src="../shared/img/meta.jpg" alt="Canta Corazón lleno, con el mariachi en el escenario"><div class="cap"><span>${esc(s.nombre)} · esta noche</span><span>Mariachi 11:30 pm</span></div></div>
      <div class="card" style="margin-top:12px;"><b>Todavía no tienes mesa ni cover para hoy.</b><p class="muted small" style="margin:6px 0 12px 0;">Reserva tu mesa en el plano del local o compra tu cover. Tu QR llega aquí mismo.</p><button class="btn" id="goReservar">Reservar para esta noche</button></div>`);
    }
    res.forEach(r => parts.push(pase(r)));
    parts.push(`<h2>Esta noche en ${esc(s.nombre)}</h2><div class="grid3">
      ${CC.db.config.cupoVisible ? `<div class="kpi"><small>Cupo</small><b class="num">${n.ocupPct.toFixed(0)}%</b><span class="s">ocupado</span></div>` : ''}
      <div class="kpi"><small>Show</small><b style="font-size:15px;">Mariachi</b><span class="s">11:30 pm</span></div>
      <div class="kpi"><small>Dress code</small><b style="font-size:15px;">Sombrero</b><span class="s">incluido</span></div></div>`);
    parts.push(`<div class="card" style="margin-top:10px;"><div class="row"><div><b>Pide tu canción</b><div class="muted small">Una dedicatoria con el mariachi, en pantalla y a tu nombre.</div></div><button class="btn sm" id="btnCancion">${money(CC.prod('x_cancion').precio)}</button></div></div>`);
    parts.push(`<p class="nota-demo">Datos ilustrativos · demo. Los pagos se simulan.</p>`);
    $('#main').innerHTML = parts.join('');
    const g = $('#goReservar'); if (g) g.onclick = () => go('reservar');
    $('#btnCancion').onclick = () => sheetCancion();
    res.forEach(r => wirePase(r));
    const um = $('#btnUnirme'); if (um) um.onclick = () => unirmeMesa(um.dataset.r);
    const pm = $('#btnPedirMesa'); if (pm) pm.onclick = () => sheetPedir(CC.db.reservas.find(x => x.id === pm.dataset.r));
    const rm = $('#btnReservarMesa'); if (rm) rm.onclick = () => { R.suc = mesaCtx.suc; R.mesaId = rm.dataset.m; R.tipo = CC.mesa(rm.dataset.m).tipo; R.paso = 2; go('reservar'); };
  };
  // llegó con la tarjeta de la mesa: qué puede hacer desde aquí
  function avisoMesa(res) {
    if (!mesaCtx) return '';
    const m = CC.db.mesas.find(x => x.suc === mesaCtx.suc && x.num === mesaCtx.num); if (!m) return '';
    const est = CC.estadoMesa(m); const mia = res.find(r => r.mesaId === m.id);
    const txt = mia ? 'Estás conectado a tu mesa: pide y paga desde aquí.' : est.r ? `Mesa de ${esc(est.r.nombre.split(' ')[0])}. Únete para pedir y dividir la cuenta.` : 'Esta mesa está libre. Resérvala y queda a tu nombre.';
    const btn = mia ? `<button class="btn sm" id="btnPedirMesa" data-r="${mia.id}">Pedir</button>` : est.r ? `<button class="btn sm" id="btnUnirme" data-r="${est.r.id}">Unirme</button>` : `<button class="btn sm" id="btnReservarMesa" data-m="${m.id}">Reservar</button>`;
    return `<div class="aviso-mesa"><span class="n">${m.num}</span><div style="flex:1; min-width:0;"><b>Mesa ${m.num} · ${esc(CC.suc(m.suc).nombre)}</b><span>${txt}</span></div>${btn}</div>`;
  }
  function unirmeMesa(resId) { const r = CC.db.reservas.find(x => x.id === resId); const u = user(); if (!r) return; r.grupo = r.grupo || []; if (!r.grupo.some(g => g.clienteId === u.id)) r.grupo.push({ clienteId: u.id, parte: 0, pagado: 0 }); CC.log('app', u.nombre.split(' ')[0] + ' se unió a la mesa ' + (CC.mesa(r.mesaId) || {}).num); CC.save(); toast('Listo: ya estás en la mesa ' + (CC.mesa(r.mesaId) || {}).num); render({ quieto: true }); }

  function pase(r) {
    const u = user(); const mesa = r.mesaId ? CC.mesa(r.mesaId) : null; const tipo = CC.TIPOS_QR[r.tipo]; const s = CC.suc(r.suc);
    const miParte = (r.grupo || []).find(g => g.clienteId === u.id); const soyTitular = r.clienteId === u.id;
    const pagadoTotal = (r.grupo && r.grupo.length) ? r.grupo.reduce((a, g) => a + g.pagado, 0) : r.pagado;
    const faltaGrupo = r.estado === 'confirmada' && pagadoTotal < (r.anticipo || 0);
    const cta = CC.M.cuentaMesa(r.id); const yaDentro = r.entradas && r.entradas[u.id];
    const estadoTxt = yaDentro ? 'Ya estás dentro · entraste ' + r.entradas[u.id] : r.estado === 'sentada' ? 'Tu mesa ya está sentada · muestra tu QR en la puerta' : r.estado === 'confirmada' ? (miParte && miParte.pagado < miParte.parte ? 'Falta pagar tu parte' : faltaGrupo ? 'Tu lugar está pagado · falta la parte de un amigo' : 'Pagado · muestra tu QR en la puerta') : r.estado === 'pendiente' ? 'Pago en caja pendiente · tu lugar está apartado' : r.estado;
    const aviso = (miParte && miParte.pagado < miParte.parte) || r.estado === 'pendiente';
    return `<div class="pase" data-res="${r.id}">
      <div class="qrbox">
        <button class="qrbtn" data-qr="${r.id}" aria-label="Ver mi QR en pantalla completa"><div class="qr" id="qr_${r.id}"></div><span class="zoom">${I.zoom}</span></button>
        <div class="t"><span class="badge" style="background:${tipo.color}; color:${tipo.texto};">${tipo.nombre}</span>
          <b>${mesa ? 'Mesa ' + mesa.num : (r.tipo === 'cover' ? 'Cover' : 'Barra')}</b>
          <span>${mesa ? 'Piso ' + mesa.piso + ' · ' : ''}${esc(r.hora || '')} · ${r.personas} personas · ${esc(s.nombre)}</span>
          <span class="st ${aviso ? 'warn' : ''}">● ${esc(estadoTxt)}</span>
          <span class="hint">Toca el QR para agrandarlo</span></div>
      </div>
      <div class="cuerpo">
        ${r.motivo ? `<div class="pill" style="margin-bottom:10px;">${esc(r.motivo)}</div>` : ''}
        ${r.grupo && r.grupo.length ? `<div class="small" style="margin-bottom:8px;"><b>Tu grupo</b> · ${r.grupo.filter(g => g.pagado >= g.parte).length} de ${r.grupo.length} ya pagaron su parte</div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">${r.grupo.map(g => `<span class="pill ${g.pagado >= g.parte ? 'ok' : 'warn'}">${esc(primerNombre(g.clienteId))}${g.parte ? ' · ' + money(g.parte) : ''}${g.pagado >= g.parte && g.parte ? ' ✓' : ''}${enLocal(g.clienteId) ? ' · dentro' : ''}</span>`).join('')}</div>` : ''}
        ${miParte && miParte.pagado < miParte.parte ? `<button class="btn" data-act="pagarparte">Pagar mi parte · ${money(miParte.parte - miParte.pagado)}</button>` : ''}
        ${mesa ? `<div class="row" style="margin-top:10px;"><div><b>Cuenta de la mesa</b><div class="muted small">${cta.items.length} ${cta.items.length === 1 ? 'pedido' : 'pedidos'} · pagado ${money(cta.pagado)} · saldo ${money(cta.saldo)}</div></div><b class="price">${money(cta.total)}</b></div>
        ${cta.items.length ? `<div style="margin-top:6px;">${cta.items.slice(-4).map(i => `<div class="item"><div class="nm"><b>${i.cant} × ${esc(i.nombre)}</b><span>${esc(i.hora)} · ${esc(primerNombre(i.porClienteId))}</span></div><span class="orderstate ${i.estado}">${i.estado}</span></div>`).join('')}</div>` : ''}
        ${(r.preorden || []).length ? `<div class="small muted" style="margin-top:6px;">Preorden lista al llegar: ${r.preorden.map(p => p.cant + ' × ' + esc(CC.prod(p.prodId).nombre)).join(', ')}</div>` : ''}
        <div class="grid2" style="margin-top:12px;"><button class="btn sec" data-act="pedir">Pedir a la mesa</button><button class="btn" data-act="cuenta">Dividir y pagar</button></div>` : ''}
        <div class="grid2" style="margin-top:8px;">
          <button class="btn sec sm" data-act="compartir" style="width:100%;">Compartir con mi grupo</button>
          ${soyTitular && r.estado !== 'sentada' ? `<button class="btn ghost sm" data-act="cancelar" style="width:100%;">Cancelar reserva</button>` : `<button class="btn ghost sm" data-act="wallet" style="width:100%;">Agregar a Wallet</button>`}
        </div>
      </div></div>`;
  }
  async function wirePase(r) {
    const el = $(`[data-res="${r.id}"]`); if (!el) return;
    const box = $(`#qr_${r.id}`); const token = await CC.tokenQR(r, user().id); box.innerHTML = '';
    new QRCode(box, { text: token, width: 272, height: 272, colorDark: '#320707', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.M });
    $(`[data-qr="${r.id}"]`).onclick = () => qrGrande(r);
    $$('[data-act]', el).forEach(b => b.onclick = () => {
      const a = b.dataset.act; const nMesa = (CC.mesa(r.mesaId) || {}).num;
      if (a === 'pedir') sheetPedir(r);
      if (a === 'cuenta') sheetCuenta(r);
      if (a === 'pagarparte') { const g = r.grupo.find(x => x.clienteId === user().id); sheetPago(g.parte - g.pagado, 'Tu parte de la mesa ' + nMesa, (metodo, estado) => { g.pagado = g.parte; g.metodo = metodo; CC.registrarPago({ suc: r.suc, clienteId: user().id, reservaId: r.id, concepto: 'Parte de mesa ' + nMesa, monto: g.parte, metodo, estado }); if (r.grupo.every(x => x.pagado >= x.parte)) r.pagado = r.anticipo; CC.save(); toast('Listo, tu parte quedó pagada'); render({ quieto: true }); }); }
      if (a === 'compartir') { const url = location.origin + location.pathname + '#noche'; if (navigator.share) navigator.share({ title: 'Nuestra mesa en Canta Corazón', text: (nMesa ? 'Mesa ' + nMesa : 'Nuestra noche') + ' en Canta Corazón. Entra con tu QR desde la app.', url }).catch(() => { }); else { if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => { }); toast('Link copiado para tu grupo'); } }
      if (a === 'wallet') toast('En la fase real: pase para Apple Wallet y Google Wallet');
      if (a === 'cancelar') { if (confirm('¿Cancelar tu reserva? El anticipo se devuelve según la política del local.')) { r.estado = 'liberada'; CC.log('app', 'Reserva cancelada ' + r.nombre); CC.save(); toast('Reserva cancelada'); render({ quieto: true }); } }
    });
  }
  // QR en pantalla completa: la puerta lo lee sin que nadie haga zoom
  let wake = null;
  async function qrGrande(r) {
    const u = user(); const mesa = r.mesaId ? CC.mesa(r.mesaId) : null; const tipo = CC.TIPOS_QR[r.tipo];
    const o = document.createElement('div'); o.className = 'qrfull'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Tu QR en pantalla completa');
    o.innerHTML = `<button class="x" aria-label="Cerrar">${I.x}</button><img class="lg" src="../shared/img/logo.png" alt="Canta Corazón"><div class="code" id="qfCode"></div>
      <b>${mesa ? 'Mesa ' + mesa.num + ' · Piso ' + mesa.piso : tipo.nombre}</b><span class="who">${esc(u.nombre)} · ${esc(tipo.nombre)} · ${esc(r.hora || '')}</span><span class="tip">Sube el brillo y muéstralo en la puerta. Toca en cualquier lugar para cerrar.</span>`;
    document.body.appendChild(o);
    const cerrar = () => { o.remove(); if (wake) { wake.release().catch(() => { }); wake = null; } };
    o.onclick = cerrar;
    new QRCode($('#qfCode', o), { text: await CC.tokenQR(r, u.id), width: 560, height: 560, colorDark: '#1A0404', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.M });
    try { if (navigator.wakeLock) wake = await navigator.wakeLock.request('screen'); } catch (e) { wake = null; }
  }

  // ═══════════════ PEDIR A LA MESA ═══════════════
  function sheetPedir(r) {
    const cats = [['trago', 'Coctelería'], ['botella', 'Botellas'], ['cerveza', 'Cerveza y más'], ['comida', 'Cocina'], ['extra', 'Extras']];
    let cat = 'trago'; const carrito = {};
    const draw = () => {
      const prods = CC.db.productos.filter(p => p.cat === cat && p.id !== 'x_cancion');
      const total = Object.entries(carrito).reduce((a, [id, c]) => a + CC.prod(id).precio * c, 0);
      $('#sheetBody').innerHTML = `<div class="seg" style="margin-bottom:10px; overflow-x:auto;">${cats.map(([id, l]) => `<button data-cat="${id}" class="${cat === id ? 'on' : ''}">${l}</button>`).join('')}</div>
        ${prods.map(p => `<div class="item"><div class="nm"><b>${esc(p.nombre)}</b><span>${esc(p.desc || '')}${p.desc ? ' · ' : ''}${money(p.precio)}</span></div><div class="stepper"><button data-m="${p.id}" aria-label="Quitar">−</button><span>${carrito[p.id] || 0}</span><button data-p="${p.id}" aria-label="Agregar">+</button></div></div>`).join('')}
        <button class="btn" id="btnPedir" ${total ? '' : 'disabled'} style="margin-top:12px;">Pedir ahora · ${money(total)}</button>
        <p class="tiny muted" style="text-align:center; margin:8px 0 0 0;">Llega a tu mesa sin llamar a un mesero. Se carga a la cuenta de la mesa.</p>`;
      $$('[data-cat]', $('#sheetBody')).forEach(b => b.onclick = () => { cat = b.dataset.cat; draw(); });
      $$('[data-p]', $('#sheetBody')).forEach(b => b.onclick = () => { carrito[b.dataset.p] = (carrito[b.dataset.p] || 0) + 1; draw(); });
      $$('[data-m]', $('#sheetBody')).forEach(b => b.onclick = () => { if (carrito[b.dataset.m]) { carrito[b.dataset.m]--; if (!carrito[b.dataset.m]) delete carrito[b.dataset.m]; } draw(); });
      const bp = $('#btnPedir'); if (bp) bp.onclick = () => { const items = Object.entries(carrito).map(([id, c]) => ({ prodId: id, cant: c, precio: CC.prod(id).precio, porClienteId: user().id })); CC.crearPedido({ suc: r.suc, mesaId: r.mesaId, reservaId: r.id, items, origen: 'app' }); closeSheet(); toast('Pedido enviado a la barra'); render({ quieto: true }); };
    };
    sheet(cab('Pedir a la mesa ' + (CC.mesa(r.mesaId) || {}).num) + '<div id="sheetBody" style="margin-top:6px;"></div>'); draw();
  }

  // ═══════════════ DIVIDIR Y PAGAR ═══════════════
  function sheetCuenta(r) {
    const cta = CC.M.cuentaMesa(r.id); const grupo = (r.grupo && r.grupo.length ? r.grupo.map(g => g.clienteId) : [r.clienteId]);
    let modo = 'iguales'; let propina = 10;
    const draw = () => {
      const saldo = cta.saldo; const porPersona = saldo / grupo.length;
      const porConsumo = {}; grupo.forEach(id => porConsumo[id] = 0); cta.items.forEach(i => { if (porConsumo[i.porClienteId] != null) porConsumo[i.porClienteId] += i.precio * i.cant; else porConsumo[r.clienteId] += i.precio * i.cant; });
      const miMonto = modo === 'iguales' ? porPersona : (porConsumo[user().id] || 0);
      $('#sheetBody').innerHTML = `<div class="card" style="margin-bottom:10px;"><div class="row"><span class="muted">Consumo de la mesa</span><b class="price">${money(cta.total)}</b></div><div class="row" style="margin-top:4px;"><span class="muted">Ya pagado</span><b class="price">${money(cta.pagado)}</b></div><div class="row" style="border-top:1px solid var(--line); padding-top:8px; margin-top:8px;"><b>Saldo</b><b class="price">${money(saldo)}</b></div></div>
        <label class="lbl">Cómo dividimos</label>
        <div class="seg"><button data-modo="iguales" class="${modo === 'iguales' ? 'on' : ''}">Partes iguales</button><button data-modo="consumo" class="${modo === 'consumo' ? 'on' : ''}">Lo que pidió cada quien</button></div>
        <div style="margin-top:10px;">${grupo.map(id => { const c = CC.cliente(id); const m = modo === 'iguales' ? porPersona : porConsumo[id]; return `<div class="friend"><div class="av">${CC.iniciales(c.nombre)}</div><div class="nm"><b>${esc(c.nombre)}${id === user().id ? ' (tú)' : ''}</b><span>${modo === 'iguales' ? '1 de ' + grupo.length : 'Por consumo'}</span></div><b class="price">${money(m)}</b></div>`; }).join('')}</div>
        <label class="lbl">Propina</label><div class="seg">${[0, 10, 15, 20].map(p => `<button data-tip="${p}" class="${propina === p ? 'on' : ''}">${p}%</button>`).join('')}</div>
        <button class="btn" id="btnPagar" style="margin-top:14px;" ${saldo <= 0 ? 'disabled' : ''}>Pagar mi parte · ${money(miMonto + miMonto * propina / 100)}</button>
        <button class="btn sec" id="btnSolic" style="margin-top:8px;">Pedir a cada quien su parte</button>
        <p class="tiny muted" style="text-align:center; margin:8px 0 0 0;">Cada quien paga con su método. Si alguien no paga en 48 horas, el saldo recae en quien reservó.</p>`;
      $$('[data-modo]', $('#sheetBody')).forEach(b => b.onclick = () => { modo = b.dataset.modo; draw(); });
      $$('[data-tip]', $('#sheetBody')).forEach(b => b.onclick = () => { propina = Number(b.dataset.tip); draw(); });
      $('#btnPagar').onclick = () => { closeSheet(); const nMesa = (CC.mesa(r.mesaId) || {}).num; sheetPago(miMonto + miMonto * propina / 100, 'Mi parte de la cuenta · mesa ' + nMesa, (metodo, estado) => { CC.registrarPago({ suc: r.suc, clienteId: user().id, reservaId: r.id, concepto: 'Cuenta mesa ' + nMesa, monto: Math.round(miMonto), metodo, estado, propina: Math.round(miMonto * propina / 100) }); toast('Pago registrado'); render({ quieto: true }); }); };
      $('#btnSolic').onclick = () => { closeSheet(); toast('Solicitudes enviadas a tu grupo'); };
    };
    sheet(cab('Dividir y pagar') + '<div id="sheetBody" style="margin-top:6px;"></div>'); draw();
  }

  // ═══════════════ PAGO (simulado) ═══════════════
  function sheetPago(monto, concepto, onOk) {
    const draw = (metodo) => {
      $$('[data-pm]').forEach(b => b.classList.toggle('on', b.dataset.pm === metodo));
      const body = $('#payBody');
      if (metodo === 'applepay') { body.innerHTML = `<div style="background:#0B0B0B; border-radius:18px; padding:18px; color:#fff;"><div class="row"><b style="font-size:16px;">${AP}</b><span class="small" style="color:#aaa;">•••• 4821</span></div><div class="row" style="margin-top:14px; border-top:1px solid #222; padding-top:12px;"><span style="color:#aaa;">Canta Corazón</span><b class="price" style="font-size:20px;">${money(monto)}</b></div><div class="small" style="color:#aaa; margin-top:4px;">${esc(concepto)}</div><div id="payState" style="margin-top:18px; text-align:center;"><button class="btn" id="btnFace" style="background:#fff; color:#000;">Confirmar con Face ID</button></div></div>`; $('#btnFace').onclick = () => { $('#payState').innerHTML = '<div class="spin"></div><div class="small" style="color:#aaa; margin-top:8px;">Procesando…</div>'; setTimeout(() => { $('#payState').innerHTML = '<div class="okmark">✓</div><div style="margin-top:8px; font-weight:700;">Listo</div>'; setTimeout(() => { closeSheet(); onOk('applepay', 'aprobado'); }, 700); }, 1300); }; }
      if (metodo === 'tarjeta') { body.innerHTML = `<label class="lbl">Tarjeta de prueba del demo</label><input class="txt num" value="4242 4242 4242 4242" readonly><div class="grid2"><div><label class="lbl">Vence</label><input class="txt num" value="09/29" readonly></div><div><label class="lbl">CVV</label><input class="txt num" value="•••" readonly></div></div><button class="btn" id="btnCard" style="margin-top:14px;">Pagar ${money(monto)}</button>`; $('#btnCard').onclick = () => { $('#btnCard').textContent = 'Procesando…'; setTimeout(() => { closeSheet(); onOk('tarjeta', 'aprobado'); }, 1200); }; }
      if (metodo === 'spei') { body.innerHTML = `<div class="card"><div class="small muted">Transfiere a (ejemplo)</div><b class="num">CLABE 012 180 0015 4321 8765 43</b><div class="small muted" style="margin-top:8px;">Referencia</div><b class="num">CC-${String(Date.now()).slice(-6)}</b><div class="small muted" style="margin-top:8px;">Monto exacto</div><b class="price">${money(monto)}</b></div><button class="btn" id="btnSpei" style="margin-top:12px;">Ya transferí</button><p class="tiny muted" style="text-align:center; margin-top:8px;">Se confirma solo al llegar el depósito.</p>`; $('#btnSpei').onclick = () => { closeSheet(); onOk('spei', 'aprobado'); }; }
      if (metodo === 'efectivo') { body.innerHTML = `<div class="card"><b>Pagas en caja al llegar</b><p class="small muted" style="margin:6px 0 0 0;">Tu lugar queda apartado hasta las 11:00 pm. El cajero confirma el pago y tu QR se activa por completo.</p></div><button class="btn" id="btnCash" style="margin-top:12px;">Apartar y pagar en caja</button>`; $('#btnCash').onclick = () => { closeSheet(); onOk('efectivo', 'pendiente_caja'); }; }
    };
    sheet(`${cab('Pagar ' + money(monto))}<div class="small muted">${esc(concepto)}</div>
      <div class="grid2" style="margin-top:12px;"><button class="btn apple" data-pm="applepay">${AP}</button><button class="btn sec" data-pm="tarjeta">Tarjeta</button><button class="btn sec" data-pm="spei">Transferencia</button><button class="btn sec" data-pm="efectivo">Efectivo en caja</button></div>
      <div id="payBody" style="margin-top:12px;"></div>`);
    $$('[data-pm]').forEach(b => b.onclick = () => draw(b.dataset.pm));
    draw('applepay');
  }

  // ═══════════════ CANCIÓN ═══════════════
  function sheetCancion() {
    const res = misReservasHoy().find(r => r.mesaId);
    sheet(`${cab('Pide tu canción')}
      <label class="lbl" for="cSong">Canción</label><input class="txt" id="cSong" placeholder="Amor eterno, El Rey, Como la flor…" autocomplete="off">
      <label class="lbl" for="cDed">Dedicatoria (sale en pantalla)</label><textarea class="txt" id="cDed" rows="2" placeholder="Para Sofía, de todos nosotros"></textarea>
      <button class="btn" id="cGo" style="margin-top:14px;">Pedir con el mariachi · ${money(CC.prod('x_cancion').precio)}</button>`);
    $('#cGo').onclick = () => {
      const song = $('#cSong').value.trim(), ded = $('#cDed').value.trim(); if (!song) { toast('Escribe la canción'); $('#cSong').focus(); return; }
      closeSheet(); const precio = CC.prod('x_cancion').precio;
      sheetPago(precio, 'Dedicatoria: ' + song, (metodo, estado) => { CC.db.canciones.push({ id: CC.uid('sg'), suc: sucId, mesaId: res ? res.mesaId : null, cancion: song, dedicatoria: ded, monto: precio, estado: 'en cola', hora: CC.ahoraHM(), clienteId: user().id }); CC.registrarPago({ suc: sucId, clienteId: user().id, reservaId: res ? res.id : null, concepto: 'Dedicatoria: ' + song, monto: precio, metodo, estado }); CC.log('app', 'Canción pedida: ' + song); CC.save(); toast('Tu canción entró a la cola del mariachi'); render({ quieto: true }); });
    };
  }

  // ═══════════════ RESERVAR ═══════════════
  const R = { paso: 1, suc: null, tipo: 'mesa', personas: 4, mesaId: null, pre: {}, amigos: [], hora: '22:30', motivo: '' };
  if (qs.get('paso') === '2') { R.paso = 2; R.suc = qs.get('suc') || 's1'; } // enlace directo al plano
  const estadoLibre = (m) => CC.estadoMesa(m).estado;
  VISTAS.reservar = function () {
    R.suc = R.suc || sucId; const s = CC.suc(R.suc);
    const titulos = ['', 'Tu noche, <em>a tu medida.</em>', 'Escoge tu mesa <em>en el plano.</em>', 'Botellas listas <em>al llegar.</em>', 'Divide y <em>paga.</em>'];
    let body = `<h1>${titulos[R.paso]}</h1><p class="sub">Paso ${R.paso} de 4 · ${esc(CC.fechaLarga(CC.hoy()))}</p><div class="steps">${[1, 2, 3, 4].map(i => `<i class="${i <= R.paso ? 'on' : ''}"></i>`).join('')}</div>`;
    if (R.paso === 1) {
      body += `<label class="lbl">Sucursal</label><div class="seg">${CC.SUCURSALES().map(x => `<button data-suc="${x.id}" class="${R.suc === x.id ? 'on' : ''}">${esc(x.nombre)}</button>`).join('')}</div>
        <label class="lbl">Qué quieres</label>
        <div style="display:grid; gap:8px;">${[['cover', 'Cover', 'Entrada general · ' + money(CC.PRECIOS().cover)], ['barra', 'Barra', 'Acceso con consumo en barra · ' + money(CC.PRECIOS().barra)], ['mesa', 'Mesa', 'Anticipo desde ' + money(3000) + ' · consumo mínimo'], ['vip', 'Mesa VIP', 'Anticipo desde ' + money(6000) + ' · frente al escenario o salón']].map(([id, n, d]) => `<button class="opt ${R.tipo === id ? 'on' : ''}" data-tipo="${id}" aria-pressed="${R.tipo === id}"><span class="dot" style="background:${CC.TIPOS_QR[id].color}"></span><div><b>${n}</b><span>${d}</span></div></button>`).join('')}</div>
        <label class="lbl">Cuántos van</label><div class="row"><div class="stepper"><button id="pMenos" aria-label="Menos">−</button><span id="pNum">${R.personas}</span><button id="pMas" aria-label="Más">+</button></div><div class="small muted">Incluyéndote</div></div>
        <label class="lbl">Hora de llegada</label><div class="seg">${['21:00', '22:30', '23:30', '00:30'].map(hh => `<button data-hora="${hh}" class="${R.hora === hh ? 'on' : ''}">${hh}</button>`).join('')}</div>
        <label class="lbl" for="motivo">Motivo (opcional)</label><input class="txt" id="motivo" placeholder="Cumpleaños, despecho, celebración…" value="${esc(R.motivo)}">
        <button class="btn" id="next" style="margin-top:16px;">Continuar</button>`;
    }
    if (R.paso === 2) {
      body += `<div class="small muted" style="margin-bottom:8px;">${esc(s.nombre)} · ${s.pisos > 1 ? 'planta alta arriba, planta baja abajo' : 'una planta'} · toca una mesa libre</div>
        <div class="plano">${CC.planoSVG(R.suc, { selId: R.mesaId, interactivo: true })}<div class="leyenda">${CC.PLANO_LEYENDA.map(([k, l]) => `<span><i style="background:${CC.PLANO_COLORES[k]};"></i>${l}</span>`).join('')}</div></div>
        <div id="mesaInfo" style="margin-top:10px;">${R.mesaId ? infoMesa(CC.mesa(R.mesaId)) : '<div class="card muted small">Toca una mesa libre para ver capacidad, consumo mínimo y anticipo.</div>'}</div>
        <div class="grid2" style="margin-top:12px;"><button class="btn sec" id="back">Atrás</button><button class="btn" id="next" ${R.mesaId ? '' : 'disabled'}>Continuar</button></div>`;
    }
    if (R.paso === 3) {
      const prods = CC.db.productos.filter(p => p.cat === 'botella' || p.id === 'x_sombrero' || p.id === 'x_pastel');
      const total = Object.entries(R.pre).reduce((a, [id, c]) => a + CC.prod(id).precio * c, 0);
      body += `<p class="lead">Lo que pidas ahora te espera servido en la mesa y cuenta para tu consumo mínimo.</p>
        ${prods.map(p => `<div class="item"><div class="nm"><b>${esc(p.nombre)}</b><span>${money(p.precio)}${p.cat === 'botella' ? ' · preventa' : ''}</span></div><div class="stepper"><button data-m="${p.id}" aria-label="Quitar">−</button><span>${R.pre[p.id] || 0}</span><button data-p="${p.id}" aria-label="Agregar">+</button></div></div>`).join('')}
        <div class="row" style="margin-top:10px;"><b>Preorden</b><b class="price">${money(total)}</b></div>
        <div class="grid2" style="margin-top:12px;"><button class="btn sec" id="back">Atrás</button><button class="btn" id="next">${total ? 'Continuar' : 'Sin preorden'}</button></div>`;
    }
    if (R.paso === 4) {
      const mesa = R.mesaId ? CC.mesa(R.mesaId) : null; const u = user(); const t = totales();
      const tipo = CC.TIPOS_QR[mesa ? mesa.tipo : R.tipo];
      body += `<div class="card"><div class="row"><div><b>${mesa ? 'Mesa ' + mesa.num + ' · Piso ' + mesa.piso + (mesa.salon ? ' · ' + esc(mesa.salon) : '') : tipo.nombre}</b><div class="small muted">${esc(s.nombre)} · ${R.hora} · ${R.personas} personas</div></div><span class="badge" style="background:${tipo.color}; color:${tipo.texto}">${tipo.nombre}</span></div>
        <div class="item" style="margin-top:6px;"><span class="muted">${mesa ? 'Anticipo de mesa' : 'Accesos'}</span><b class="price">${money(t.anticipo)}</b></div>
        ${t.pre ? `<div class="item"><span class="muted">Preorden</span><b class="price">${money(t.pre)}</b></div>` : ''}
        <div class="item"><b>Total a pagar hoy</b><b class="price">${money(t.total)}</b></div>
        ${mesa ? `<div class="tiny muted" style="margin-top:6px;">Consumo mínimo de la mesa: ${money(mesa.minimo)}. El anticipo y la preorden cuentan.</div>` : ''}</div>
        <h2>Dividir con amigos</h2>
        <div class="card" style="padding:4px 14px;">${u.amigos.map(id => { const c = CC.cliente(id); const on = R.amigos.includes(id); return `<button class="friend" data-amigo="${id}" aria-pressed="${on}"><div class="av">${CC.iniciales(c.nombre)}</div><div class="nm"><b>${esc(c.nombre)}</b><span>${c.nivel === 'vip' ? 'Cliente VIP · ' : ''}${c.visitas} visitas</span></div><div class="check ${on ? 'on' : ''}">${on ? '✓' : ''}</div></button>`; }).join('')}</div>
        <div class="card salmon" style="margin-top:10px;"><div class="row"><div><b>${t.n === 1 ? 'Pagas todo tú' : 'Entre ' + t.n + ' personas'}</b><div class="small">${t.n === 1 ? 'Puedes dividir después desde Mi noche.' : 'Tú pagas tu parte ahora; a cada amigo le llega su solicitud en su app.'}</div></div><b class="price">${money(t.parte)}<span class="small" style="font-weight:600;"> c/u</span></b></div></div>
        <div class="grid2" style="margin-top:12px;"><button class="btn sec" id="back">Atrás</button><button class="btn" id="pay">Pagar ${money(t.parte)}</button></div>`;
    }
    $('#main').innerHTML = body;
    $$('[data-suc]').forEach(b => b.onclick = () => { R.suc = b.dataset.suc; R.mesaId = null; setSuc(R.suc); });
    $$('[data-tipo]').forEach(b => b.onclick = () => { R.tipo = b.dataset.tipo; render({ quieto: true }); });
    $$('[data-hora]').forEach(b => b.onclick = () => { R.hora = b.dataset.hora; render({ quieto: true }); });
    const pm = $('#pMenos'), pp = $('#pMas'); if (pm) pm.onclick = () => { R.personas = Math.max(1, R.personas - 1); $('#pNum').textContent = R.personas; }; if (pp) pp.onclick = () => { R.personas = Math.min(16, R.personas + 1); $('#pNum').textContent = R.personas; };
    const mo = $('#motivo'); if (mo) mo.oninput = () => R.motivo = mo.value;
    $$('[data-p]').forEach(b => b.onclick = () => { R.pre[b.dataset.p] = (R.pre[b.dataset.p] || 0) + 1; render({ quieto: true }); });
    $$('[data-m]').forEach(b => b.onclick = () => { if (R.pre[b.dataset.m]) { R.pre[b.dataset.m]--; if (!R.pre[b.dataset.m]) delete R.pre[b.dataset.m]; } render({ quieto: true }); });
    $$('[data-amigo]').forEach(b => b.onclick = () => { const id = b.dataset.amigo; R.amigos = R.amigos.includes(id) ? R.amigos.filter(x => x !== id) : R.amigos.concat(id); render({ quieto: true }); });
    $$('[data-mesa]').forEach(el => el.addEventListener('click', () => { const m = CC.mesa(el.dataset.mesa); const e = estadoLibre(m); if (e !== 'libre') { toast('Esa mesa ya está ' + e); return; } R.mesaId = m.id; R.tipo = m.tipo; render({ quieto: true }); }));
    const nx = $('#next'); if (nx) nx.onclick = () => { if (R.paso === 1 && (R.tipo === 'cover' || R.tipo === 'barra')) { R.mesaId = null; R.paso = 4; } else R.paso++; render(); };
    const bk = $('#back'); if (bk) bk.onclick = back;
    const py = $('#pay'); if (py) py.onclick = confirmarReserva;
  };
  function infoMesa(m) { const t = CC.TIPOS_QR[m.tipo]; return `<div class="card"><div class="row"><div><b>Mesa ${m.num} · Piso ${m.piso}${m.salon ? ' · ' + esc(m.salon) : ''}</b><div class="small muted">Hasta ${m.cap} personas</div></div><span class="badge" style="background:${t.color}; color:${t.texto}">${t.nombre}</span></div><div class="grid2" style="margin-top:10px;"><div class="kpi"><small>Anticipo</small><b class="num">${money(m.anticipo)}</b></div><div class="kpi"><small>Consumo mínimo</small><b class="num">${money(m.minimo)}</b></div></div></div>`; }
  function totales() { const mesa = R.mesaId ? CC.mesa(R.mesaId) : null; const anticipo = mesa ? mesa.anticipo : CC.PRECIOS()[R.tipo === 'cover' ? 'cover' : 'barra'] * R.personas; const pre = Object.entries(R.pre).reduce((a, [id, c]) => a + CC.prod(id).precio * c, 0); const n = 1 + R.amigos.length; return { anticipo, pre, total: anticipo + pre, n, parte: Math.ceil((anticipo + pre) / n) }; }
  function confirmarReserva() {
    const s = CC.suc(R.suc); const mesa = R.mesaId ? CC.mesa(R.mesaId) : null; const u = user(); const t = totales();
    sheetPago(t.parte, (mesa ? 'Anticipo mesa ' + mesa.num : CC.TIPOS_QR[R.tipo].nombre) + ' · ' + s.nombre, (metodo, estado) => {
      const grupo = t.n > 1 ? [{ clienteId: u.id, parte: t.parte, pagado: t.parte, metodo }].concat(R.amigos.map(id => ({ clienteId: id, parte: t.parte, pagado: 0 }))) : [];
      const r = CC.crearReserva({ suc: R.suc, hora: R.hora, tipo: mesa ? mesa.tipo : R.tipo, mesaId: mesa ? mesa.id : null, clienteId: u.id, nombre: u.nombre, personas: R.personas, estado: estado === 'pendiente_caja' ? 'pendiente' : 'confirmada', anticipo: t.total, pagado: t.n > 1 ? t.parte : t.total, metodo, origen: 'app', grupo, preorden: Object.entries(R.pre).map(([id, c]) => ({ prodId: id, cant: c })), motivo: R.motivo });
      CC.registrarPago({ suc: R.suc, clienteId: u.id, reservaId: r.id, concepto: (mesa ? 'Anticipo mesa ' + mesa.num : CC.TIPOS_QR[R.tipo].nombre) + (t.n > 1 ? ' (grupo)' : ''), monto: t.parte, metodo, estado });
      u.puntos += Math.round(t.parte / 10); CC.save();
      Object.assign(R, { paso: 1, mesaId: null, pre: {}, amigos: [], motivo: '' });
      toast(t.n > 1 ? 'Listo. Tu QR está en Mi noche; a tus amigos les llegó su parte.' : 'Listo. Tu QR está en Mi noche.');
      go('noche');
    });
  }

  // ═══════════════ AMIGOS ═══════════════
  VISTAS.amigos = function () {
    const u = user(); const pend = misReservasHoy().flatMap(r => (r.grupo || []).filter(g => g.clienteId === u.id && g.pagado < g.parte).map(g => ({ r, g })));
    let body = `<h1>Tu gente, <em>tu mesa.</em></h1><p class="sub">Invita, divide la cuenta y mándales promos.</p>`;
    if (pend.length) body += `<h2>Te pidieron tu parte</h2>` + pend.map(({ r, g }) => `<div class="card salmon"><div class="row"><div><b>${esc(primerNombre(r.clienteId))} te invitó a la mesa ${(CC.mesa(r.mesaId) || {}).num}</b><div class="small">${esc(r.hora)} · ${r.motivo ? esc(r.motivo) : 'Canta Corazón'}</div></div><button class="btn sm" data-pay="${r.id}">Pagar ${money(g.parte - g.pagado)}</button></div></div>`).join('');
    body += `<h2>Mis amigos en Canta Corazón</h2><div class="card" style="padding:4px 14px;">${u.amigos.map(id => { const c = CC.cliente(id); const dentro = enLocal(id); return `<div class="friend"><div class="av">${CC.iniciales(c.nombre)}</div><div class="nm"><b>${esc(c.nombre)}</b><span>${c.nivel === 'vip' ? 'VIP · ' : ''}${c.visitas} visitas${dentro ? ' · <span style="color:#17583A; font-weight:700;">está en el local</span>' : ''}</span></div><button class="btn sec sm" data-promo="${id}">Mandar promo</button></div>`; }).join('')}</div>
      <div class="card" style="margin-top:10px;"><b>Invita a un amigo</b><p class="small muted" style="margin:6px 0 10px 0;">Cuando se registre con tu link, los dos reciben una cortesía en su siguiente visita.</p><button class="btn sec" id="btnInv">Compartir mi link</button></div>
      <p class="nota-demo">Demo: para ver la app como uno de tus amigos, toca tu avatar arriba a la derecha.</p>`;
    $('#main').innerHTML = body;
    $$('[data-pay]').forEach(b => b.onclick = () => { const r = CC.db.reservas.find(x => x.id === b.dataset.pay); const g = r.grupo.find(x => x.clienteId === u.id); const nMesa = (CC.mesa(r.mesaId) || {}).num; sheetPago(g.parte - g.pagado, 'Tu parte de la mesa ' + nMesa, (metodo, estado) => { g.pagado = g.parte; g.metodo = metodo; CC.registrarPago({ suc: r.suc, clienteId: u.id, reservaId: r.id, concepto: 'Parte de mesa ' + nMesa, monto: g.parte, metodo, estado }); if (r.grupo.every(x => x.pagado >= x.parte)) r.pagado = r.anticipo; CC.save(); toast('Pagado. Tu QR ya está en Mi noche'); render({ quieto: true }); }); });
    $$('[data-promo]').forEach(b => b.onclick = () => PR.elegirPromoPara(b.dataset.promo));
    $('#btnInv').onclick = () => { const url = location.origin + location.pathname + '?ref=' + u.id; if (navigator.share) navigator.share({ title: 'Canta Corazón', text: 'Bájate la app de Canta Corazón con mi link y los dos tenemos cortesía.', url }).catch(() => { }); else { if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => { }); toast('Link copiado'); } };
  };

  // ═══════════════ PUNTOS ═══════════════
  VISTAS.recompensas = function () {
    const u = user(); const meta = 2500; const falt = Math.max(0, meta - u.puntos);
    const canjes = [['Botella de cortesía', 'En tu octava visita', 2500], ['Sombrero de la casa', 'Canje inmediato', 800], ['Cover gratis para un amigo', 'Válido jueves', 600], ['Shot Baby Mango para la mesa', 'Una ronda', 400]];
    $('#main').innerHTML = `<h1>${u.nivel === 'vip' ? 'Cliente VIP.' : u.nivel === 'frecuente' ? 'Cliente frecuente.' : 'Bienvenido.'} <em>${u.puntos.toLocaleString('es-MX')} puntos.</em></h1><p class="sub">Ganas 1 punto por cada $10 de consumo, en las dos sucursales.</p>
      <div class="card ink"><div class="row"><div><div class="small" style="color:#E9CFC6;">Nivel ${esc(u.nivel)}</div><b class="num" style="font-size:28px;">${u.puntos.toLocaleString('es-MX')} pts</b></div><div style="text-align:right;"><div class="small" style="color:#E9CFC6;">${u.visitas} visitas</div><div class="small" style="color:#E9CFC6;">${money(u.gasto)} en total</div></div></div>
        <div class="bar" style="margin-top:12px; background:#4a2a2a;"><i style="width:${Math.min(100, u.puntos / meta * 100)}%"></i></div><div class="small" style="margin-top:8px; color:#E9CFC6;">${falt ? 'Te faltan ' + falt.toLocaleString('es-MX') + ' pts para tu botella de cortesía' : 'Ya tienes tu botella de cortesía: canjéala abajo'}</div></div>
      <h2>Canjea tus puntos</h2>
      ${canjes.map(([n, d, c]) => `<div class="card"><div class="row"><div><b>${n}</b><div class="small muted">${d}</div></div><button class="btn sm ${c > u.puntos ? 'sec' : ''}" ${c > u.puntos ? 'disabled' : ''} data-canje="${n}" data-pts="${c}">${c.toLocaleString('es-MX')} pts</button></div></div>`).join('')}
      <div class="card salmon" style="margin-top:10px;"><b>Tu cumpleaños es el ${Number(u.cumple.split('-')[1])} de ${CC.MESES_L[Number(u.cumple.split('-')[0]) - 1]}</b><div class="small">Dos semanas antes te llega tu paquete: mesa, pastel y la primera canción va por la casa.</div></div>
      <button class="btn sec" id="verPromos" style="margin-top:14px;">Ver las promociones de la casa</button>`;
    $$('[data-canje]').forEach(b => b.onclick = () => { const pts = Number(b.dataset.pts); if (u.puntos < pts) return; if (!confirm('¿Canjear ' + pts + ' puntos por «' + b.dataset.canje + '»?')) return; u.puntos -= pts; CC.log('app', 'Canje: ' + b.dataset.canje); CC.save(); toast('Canje aplicado: ' + b.dataset.canje); render({ quieto: true }); });
    $('#verPromos').onclick = () => go('promos');
  };

  // ═══════════════ PERFIL ═══════════════
  VISTAS.perfil = function () {
    const u = user(); const visitas = CC.db.accesos.filter(a => a.nombre === u.nombre).slice(-5).reverse();
    $('#main').innerHTML = `<h1>${esc(u.nombre)}</h1><p class="sub">${u.nivel === 'vip' ? 'Cliente VIP' : u.nivel === 'frecuente' ? 'Cliente frecuente' : 'Cliente nuevo'} · desde la app</p>
      <div class="card lista-perfil">
        <button id="irPuntos">${I.estrella}Puntos y recompensas<span>${u.puntos.toLocaleString('es-MX')} pts</span></button>
        <button id="irPromos">${I.promos}Promociones de la casa<span>${CC.db.promos.length}</span></button>
      </div>
      <h2>Mis datos</h2>
      <div class="card"><div class="item"><span class="muted">Teléfono</span><b class="num">${esc(u.tel.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3'))}</b></div><div class="item"><span class="muted">Correo</span><b class="small">${esc(u.email)}</b></div><div class="item"><span class="muted">Sucursal favorita</span><b>${esc(CC.suc(u.sucFav).nombre)}</b></div></div>
      <h2>Métodos de pago</h2><div class="card"><div class="item"><b>${AP}</b><span class="pill ok">Predeterminado</span></div><div class="item"><b class="num">Visa •••• 4821</b><span class="small muted">09/29</span></div><button class="btn sec" id="btnTarjeta" style="margin-top:8px;">Agregar tarjeta</button></div>
      <h2>Facturación</h2><div class="card"><div class="row"><div><b>Factura tu consumo</b><div class="small muted">CFDI desde el recibo de cada noche, sin ir a caja.</div></div><button class="btn sec sm" id="btnCfdi">Datos fiscales</button></div></div>
      <h2>Mis noches</h2><div class="card">${visitas.map(a => `<div class="item"><div class="nm"><b>${esc(CC.fechaLarga(a.fecha))}</b><span>${esc(CC.suc(a.suc).nombre)} · ${esc(CC.TIPOS_QR[a.tipo].nombre)} · ${esc(a.hora)}</span></div><span class="pill ok">Entró</span></div>`).join('')}${CL_hoy(u)}<div class="item"><div class="nm"><b>${u.visitas} ${u.visitas === 1 ? 'visita' : 'visitas'} en total</b><span>${money(u.gasto)} de consumo · ${u.puntos.toLocaleString('es-MX')} puntos</span></div></div></div>
      <div class="card lista-perfil" style="margin-top:16px;"><button id="btnSalir">${I.salir}Cerrar sesión</button></div>
      <h2>Demo</h2><div class="grid2"><button class="btn sec sm" id="btnSwitch" style="width:100%;">Cambiar de usuario</button><button class="btn ghost sm" id="btnReset" style="width:100%;">Reiniciar datos</button></div>
      <a class="btn sec sm" href="../" style="width:100%; margin-top:8px; text-decoration:none;">Volver a la portada del demo</a>`;
    $('#irPuntos').onclick = () => go('recompensas'); $('#irPromos').onclick = () => go('promos');
    $('#btnTarjeta').onclick = () => toast('En la fase real se agrega con el procesador de pagos, sin guardar el número aquí');
    $('#btnCfdi').onclick = () => toast('En la fase real: RFC, régimen y uso de CFDI guardados una sola vez');
    $('#btnSalir').onclick = () => go('entrar');
    $('#btnSwitch').onclick = sheetUsuarios; $('#btnReset').onclick = () => { if (confirm('¿Reiniciar todos los datos del demo en este navegador?')) { CC.reset(); toast('Datos reiniciados'); render(); } };
  };
  // la reserva de hoy, si todavía no entra
  function CL_hoy(u) { const r = misReservasHoy().find(x => !(x.entradas || {})[u.id]); if (!r) return ''; const m = r.mesaId ? CC.mesa(r.mesaId) : null; return `<div class="item"><div class="nm"><b>Hoy · ${esc(CC.fechaLarga(r.fecha))}</b><span>${esc(CC.suc(r.suc).nombre)} · ${m ? 'Mesa ' + m.num : CC.TIPOS_QR[r.tipo].nombre} · ${esc(r.hora)}</span></div><span class="pill warn">Por llegar</span></div>`; }
  function sheetUsuarios() {
    sheet(`${cab('¿Quién eres en el demo?')}<div class="small muted">Cada pestaña puede ser una persona distinta: así se ve al grupo dividir la cuenta y mandarse promos.</div><div style="margin-top:8px;">${CC.db.clientes.slice(0, 6).map(c => `<button class="friend" data-u="${c.id}"><div class="av" ${c.id === user().id ? 'style="background:var(--terra); color:var(--paper);"' : ''}>${CC.iniciales(c.nombre)}</div><div class="nm"><b>${esc(c.nombre)}</b><span>${c.nivel} · ${c.visitas} visitas</span></div>${c.id === user().id ? '<span class="pill ok">Tú</span>' : ''}</button>`).join('')}</div>`);
    $$('[data-u]').forEach(el => el.onclick = () => { closeSheet(); setUser(el.dataset.u); toast('Ahora eres ' + primerNombre(el.dataset.u)); });
  }

  // ═══════════════ render ═══════════════
  function render(o = {}) {
    const u = user(); $('#btnUser').textContent = CC.iniciales(u.nombre); $('#chipSuc').textContent = CC.suc(sucId).nombre;
    const completa = view === 'entrar';
    $('#top').classList.toggle('oculto', completa); $('nav.bottom').classList.toggle('oculto', completa);
    renderNav();
    const y = window.scrollY;
    (VISTAS[view] || VISTAS.noche)();
    const m = $('#main'); m.classList.toggle('sin-margen', completa);
    if (o.quieto) window.scrollTo(0, y); else { window.scrollTo(0, 0); m.classList.remove('anim'); void m.offsetWidth; m.classList.add('anim'); }
  }
  function iniciar() {
    const h = location.hash.replace('#', '');
    view = mesaCtx ? 'entrar' : (VISTAS[h] ? h : 'noche');
    if (mesaCtx) sucId = mesaCtx.suc;
    $('#btnUser').onclick = sheetUsuarios;
    $('#chipSuc').onclick = () => setSuc(sucId === 's1' ? 's2' : 's1');
    $('#btnBack').onclick = back;
    $('#btnMarca').onclick = () => go('noche');
    // otra pestaña cambió algo: repinta sin mover la pantalla, salvo que haya una hoja o el QR abiertos
    CC.on((origen) => { if (origen === 'local') { renderNav(); return; } if (!$('#sheetBg') && !$('.qrfull') && !$('.hist') && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) render({ quieto: true }); else renderNav(); });
    if (window.CCSync) CCSync.on(pintarRed);
    window.addEventListener('hashchange', () => { const h = location.hash.replace('#', ''); if (VISTAS[h] && h !== view) go(h); });
    render();
  }

  window.CL = { $, $$, esc, money, I, user, setUser, sucId: () => sucId, mesaCtx, go, back, sheet, closeSheet, cab, toast, render, registrar: (id, fn) => { VISTAS[id] = fn; }, misReservasHoy, primerNombre, sheetPago, iniciar, vista: () => view };
})();
