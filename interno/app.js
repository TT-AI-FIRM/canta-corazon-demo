/* Canta Corazón · Sistema interno (demo): menú por rol, tablero, mesas, pedidos, inventario, compras, caja,
   clientes, personal, asistente y configuración. La puerta (escáner QR) vive en puerta.js y las promociones en promos.js. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s); const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = CC.money, pct = CC.pct;
  const qs = new URLSearchParams(location.search); const qsRol = qs.get('rol'); if (qsRol) sessionStorage.setItem('cc_rol', qsRol); const qsSuc = qs.get('suc'); if (qsSuc) sessionStorage.setItem('cc_isuc', qsSuc);
  let rol = sessionStorage.getItem('cc_rol') || null;
  let suc = sessionStorage.getItem('cc_isuc') || 's1';
  let view = (function () { const h = location.hash.replace('#', ''); return ({ barra: 'pedidos' })[h] || h || 'tablero'; })();
  let sel = { mesaId: null, clienteId: null };
  const charts = {};
  let toastT = null;
  function toast(m) { const t = $('#toast'); t.innerHTML = `<div class="toast">${esc(m)}</div>`; clearTimeout(toastT); toastT = setTimeout(() => t.innerHTML = '', 2600); }
  function sheet(html) { $('#overlay').innerHTML = `<div class="sheet-bg" id="sheetBg"><div class="sheet">${html}</div></div>`; $('#sheetBg').addEventListener('click', e => { if (e.target.id === 'sheetBg') closeSheet(); }); }
  function closeSheet() { $('#overlay').innerHTML = ''; }
  const S = () => CC.suc(suc) || { id: 'all', nombre: 'Ambas sucursales', aforo: CC.SUCURSALES().reduce((a, x) => a + x.aforo, 0), pisos: 2 };
  const tipoBadge = (t) => { const x = CC.TIPOS_QR[t] || { nombre: t, color: '#555', texto: '#fff' }; return `<span class="badge" style="background:${x.color}; color:${x.texto}">${x.nombre}</span>`; };

  const I = (n) => `<svg viewBox="0 0 24 24">${ICONS[n] || ''}</svg>`;
  const ICONS = {
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h3v3h-3zM18 18h2v2h-2zM18 14h2M14 20h3"/>',
    pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    table: '<rect x="3" y="7" width="18" height="6" rx="2"/><path d="M6 13v6M18 13v6M9 13v4M15 13v4"/>',
    glass: '<path d="M6 3h12l-1 8a5 5 0 0 1-10 0z"/><path d="M12 16v5M8 21h8"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.8"/><path d="M2.5 20c.5-4 3.5-6 6.5-6s6 2 6.5 6M15 14.5c2.8 0 5.5 1.6 6 5.5"/>',
    receipt: '<path d="M6 2h9l5 5v15H6z M14 2v6h6"/><path d="M9 13h6M9 17h6"/>',
    team: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5 18c.6-2.4 2.2-3.5 4-3.5s3.4 1.1 4 3.5M14 9h5M14 13h5"/>',
    star: '<path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M14.6 9.6c-.5-.9-1.5-1.4-2.6-1.4-1.7 0-3 .9-3 2s1.3 1.6 3 2 3 1 3 2-1.3 1.9-3 1.9c-1.1 0-2.1-.5-2.6-1.4M12 6.2v2M12 15.8v2"/>',
    ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M10 8v8" stroke-dasharray="2 2"/>',
    bottle: '<path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 14h8"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11L21 7H6"/>',
    card: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M6 15h4"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    fire: '<path d="M12 3c1 3 4 4.5 4 9a4 4 0 0 1-8 0c0-2 1-3.2 1-3.2s0 3.2 2 3.2c1 0 1-1 1-2 0-3-2-4 0-7z"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    tag: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="8" cy="8" r="1.5"/>',
    truck: '<path d="M2 6h11v10H2zM13 10h5l4 3v3h-9"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    mega: '<path d="M3 10v4h3l6 4V6L6 10z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    heart: '<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/>',
    chat: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.2A8.5 8.5 0 1 1 20.5 11.5z"/>',
    send: '<path d="M21.5 3.5L10 14M21.5 3.5l-7 17-4.5-6.5L3.5 10.5z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'
  };
  const TODOS = ['socio', 'gerente', 'hostess', 'puerta', 'barra', 'caja', 'compras', 'mesero'];
  // secciones (páginas) y grupos (botones del menú). Una página vive dentro de un grupo.
  const SECCIONES = [
    { id: 'tablero', label: 'Tablero', grupo: 'tablero', roles: ['socio', 'gerente'] },
    { id: 'puerta', label: 'Puerta', grupo: 'puerta', roles: ['socio', 'gerente', 'puerta', 'hostess'] },
    { id: 'mesas', label: 'Mesas', grupo: 'local', roles: ['socio', 'gerente', 'hostess', 'puerta', 'mesero'], icon: 'table' },
    { id: 'pedidos', label: 'Pedidos', grupo: 'local', roles: ['socio', 'gerente', 'barra', 'mesero'], icon: 'glass' },
    { id: 'clientes', label: 'Clientes', grupo: 'local', roles: ['socio', 'gerente', 'hostess'], icon: 'people' },
    { id: 'promos', label: 'Promociones', grupo: 'local', roles: ['socio', 'gerente'], icon: 'mega' },
    { id: 'inventario', label: 'Inventario', grupo: 'insumos', roles: ['socio', 'gerente', 'barra', 'compras'], icon: 'bottle' },
    { id: 'compras', label: 'Compras', grupo: 'insumos', roles: ['socio', 'gerente', 'compras'], icon: 'receipt' },
    { id: 'caja', label: 'Caja', grupo: 'caja', roles: ['socio', 'gerente', 'caja'] },
    { id: 'mas', label: 'Más', grupo: 'mas', roles: TODOS },
    { id: 'personal', label: 'Personal', grupo: 'mas', roles: ['socio', 'gerente'], icon: 'team' },
    { id: 'asistente', label: 'Asistente IA', grupo: 'mas', roles: ['socio', 'gerente'], icon: 'star' },
    { id: 'config', label: 'Configuración', grupo: 'mas', roles: ['socio', 'gerente'], icon: 'gear' }
  ];
  const GRUPOS = [
    { id: 'tablero', label: 'Tablero', icon: 'chart' },
    { id: 'puerta', label: 'Puerta', icon: 'qr' },
    { id: 'local', label: 'Local', icon: 'pin' },
    { id: 'insumos', label: 'Insumos', icon: 'box' },
    { id: 'caja', label: 'Caja', icon: 'cash' },
    { id: 'mas', label: 'Más', icon: 'more' }
  ];
  const ALIAS = { barra: 'pedidos' };
  const ROLES_DEMO = [['socio', 'Socio', 'Todo: tablero, IA, configuración'], ['gerente', 'Gerente', 'Operación completa de la sucursal'], ['hostess', 'Hostess', 'Mesas, reservas, clientes, puerta'], ['puerta', 'Puerta', 'Escáner QR y aforo'], ['barra', 'Barra', 'Pedidos, botellas abiertas, conteo'], ['caja', 'Caja', 'Pagos, efectivo, cortes'], ['compras', 'Compras', 'Facturas XML, inventario, proveedores'], ['mesero', 'Mesero', 'Mesas y pedidos']];
  const seccion = (id) => SECCIONES.find(x => x.id === id);
  const permitido = (id) => { const x = seccion(id); return !!(x && rol && x.roles.includes(rol)); };
  const home = () => (SECCIONES.find(x => x.id !== 'mas' && permitido(x.id)) || seccion('mas')).id;
  const primeraDelGrupo = (g) => { const x = SECCIONES.find(x => x.grupo === g && permitido(x.id)); return x ? x.id : home(); };
  const grupoDe = (v) => (seccion(v) || {}).grupo || 'tablero';
  // historial propio para el botón «atrás»
  const hist = [];
  function go(v) { v = ALIAS[v] || v; if (v === view) return; stopScan(); hist.push(view); view = v; location.hash = v; render(); }
  function back() { stopScan(); let p = hist.pop(); while (p && !permitido(p)) p = hist.pop(); if (!p && view === home()) { salirRol(); return; } view = p || home(); location.hash = view; render(); }
  function salirRol() { stopScan(); rol = null; sessionStorage.removeItem('cc_rol'); hist.length = 0; render(); }
  function stopScan() { if (window.PT) PT.parar(); }
  function irHome() { stopScan(); hist.length = 0; view = home(); location.hash = view; render(); }
  const sucActiva = () => suc === 'all' ? 's1' : suc;

  // ═════════════ login ═════════════
  function vLogin() {
    $('#root').innerHTML = `<div class="login"><a class="volver" href="../">${I('back')}<span>Portada del demo</span></a><div class="box"><div class="head"><img src="../shared/img/logo_dark.png" alt="Canta Corazón"><h1 style="font-size:28px; margin:0 0 6px 0;">Sistema interno · <span style="color:var(--terra)">demo</span></h1><p class="muted" style="margin:0 auto; max-width:520px;">Elige con qué rol entras. Cada rol ve solo lo que le corresponde. Los datos son ilustrativos y viven en este navegador.</p></div>
      <div class="roles">${ROLES_DEMO.map(([id, n, d]) => `<button data-rol="${id}"><b>${n}</b><span>${d}</span></button>`).join('')}</div>
      <div class="row" style="margin-top:18px;"><span class="tiny muted">Las dos apps del demo comparten los mismos datos en este dispositivo. Abre la app del cliente en otra pestaña para verlas conversar.</span><a class="btn sec sm" href="../cliente/" target="_blank" style="text-decoration:none; white-space:nowrap;">Abrir app del cliente</a></div></div></div>`;
    $$('[data-rol]').forEach(b => b.onclick = () => { rol = b.dataset.rol; sessionStorage.setItem('cc_rol', rol); hist.length = 0; view = permitido(view) ? view : home(); location.hash = view; render(); });
  }

  // ═════════════ shell ═════════════
  function shell(contentHTML, title, sub) {
    const abiertos = CC.db.pedidos.filter(p => (suc === 'all' || p.suc === suc) && (p.estado === 'nuevo' || p.estado === 'preparando')).length;
    const pend = CC.M.cajaHoy(suc).pendientes.length;
    const badges = { local: permitido('pedidos') ? abiertos : 0, caja: pend, pedidos: abiertos };
    const gActual = grupoDe(view);
    const grupos = GRUPOS.filter(g => SECCIONES.some(x => x.grupo === g.id && permitido(x.id)));
    const subs = SECCIONES.filter(x => x.grupo === gActual && x.id !== 'mas' && permitido(x.id));
    const subtabs = (subs.length > 1 && view !== 'mas') ? `<div class="subtabs">${subs.map(x => `<button data-go="${x.id}" class="${view === x.id ? 'on' : ''}">${I(x.icon)}${x.label}${badges[x.id] ? `<span class="n">${badges[x.id]}</span>` : ''}</button>`).join('')}</div>` : '';
    $('#root').innerHTML = `<div id="app"><aside><img class="logo" src="../shared/img/logo_dark.png" alt="Canta Corazón"><div class="who"><b>${esc(CC.ROLES[rol])}</b><span>${esc(S().nombre)} · ${esc(CC.fechaLarga(CC.hoy()))}</span></div><nav>${grupos.map(g => `<button data-g="${g.id}" class="${gActual === g.id ? 'on' : ''}">${I(g.icon)}<span>${g.label}</span>${badges[g.id] ? `<span class="n">${badges[g.id]}</span>` : ''}</button>`).join('')}</nav><div class="foot">Demo · datos ilustrativos<br><button class="btn sec sm" id="btnSalir" style="margin-top:8px;">Cambiar rol</button></div></aside>
      <div><div class="topbar"><div class="tb-left"><button class="back" id="btnBack" aria-label="Atrás" title="Atrás">${I('back')}</button><div style="min-width:0;"><h1>${title}</h1><div class="sub">${sub || ''}</div></div></div><div class="seg">${CC.SUCURSALES().map(s => `<button data-suc="${s.id}" class="${suc === s.id ? 'on' : ''}">${esc(s.nombre)}</button>`).join('')}<button data-suc="all" class="${suc === 'all' ? 'on' : ''}">Ambas</button></div><span class="red" id="redPill" aria-live="polite"></span><button class="home" id="btnHome" title="Inicio" aria-label="Inicio"><img src="../shared/img/logo_dark.png" alt="Canta Corazón"></button></div>${subtabs}<main id="main">${contentHTML}</main></div></div>`;
    $$('[data-g]').forEach(b => b.onclick = () => go(primeraDelGrupo(b.dataset.g)));
    $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    $$('[data-suc]').forEach(b => b.onclick = () => { suc = b.dataset.suc; sessionStorage.setItem('cc_isuc', suc); render(); });
    $('#btnSalir').onclick = salirRol;
    $('#btnBack').onclick = back; $('#btnHome').onclick = irHome;
    tarjetas($('#main')); pintarRed(); mountCharts();
    const st = $('.subtabs button.on'); if (st && st.scrollIntoView) st.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  // en el celular cada renglón de tabla se vuelve tarjeta: cada celda lleva el nombre de su columna
  function tarjetas(root) {
    $$('table', root).forEach(t => {
      const th = $$('thead th', t).map(x => (x.childNodes[0] ? x.childNodes[0].textContent : x.textContent).trim()); if (!th.length) return;
      const tt = Math.max(0, th.findIndex(x => /^(Nombre|Cliente|Producto|Botella|Proveedor|Concepto|Mesa)$/.test(x))); t.classList.add('rsp');
      $$('tbody tr', t).forEach(tr => $$('td', tr).forEach((td, i) => { if (th[i] != null) td.dataset.l = th[i]; if (i === tt) td.classList.add('tt'); if (td.querySelector('.stk')) td.classList.add('ancho'); }));
    });
  }
  // estado de la red: en línea, sin internet (con cambios guardados en el equipo) o subiendo
  let redE = null;
  function pintarRed(e) {
    if (e) redE = e; e = redE; const el = $('#redPill'); if (!el || !e) return;
    const t = !e.enLinea ? `Sin internet · ${e.pendientes} ${e.pendientes === 1 ? 'cambio' : 'cambios'} en este equipo` : e.subiendo ? 'Subiendo cambios…' : e.recienSubidos ? `${e.recienSubidos} ${e.recienSubidos === 1 ? 'cambio subido' : 'cambios subidos'}` : 'En línea';
    el.className = 'red ' + (!e.enLinea ? 'off' : e.subiendo || e.recienSubidos ? 'sube' : 'ok'); el.innerHTML = `<i></i><span>${t}</span>`;
    el.title = e.listo ? 'El demo está guardado en este equipo y funciona sin internet' : 'Guardando el demo para usarlo sin internet…';
  }
  function chart(id, cfg) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } const el = document.getElementById(id); if (!el) return; Chart.defaults.color = '#B69A92'; Chart.defaults.borderColor = '#2E2022'; Chart.defaults.font.family = 'Montserrat, sans-serif'; Chart.defaults.font.size = 11; charts[id] = new Chart(el, cfg); }

  // KPI cuadrado con icono
  function kpi(o) { return `<div class="k ${o.mini ? 'mini' : ''}"><div class="top"><span class="ic">${I(o.icon || 'chart')}</span>${o.delta != null ? `<span class="d ${o.delta >= 0 ? 'up' : 'dn'}">${o.delta >= 0 ? '▲' : '▼'} ${Math.abs(o.delta).toFixed(1)}%</span>` : ''}</div><small>${o.label}</small><b class="${o.cls || ''}">${o.value}</b>${o.sub ? `<span class="s">${o.sub}</span>` : ''}</div>`; }

  // Tarjeta de gráfica con selector de tipo (barras, línea, dona, tabla) y meta
  const CT = { bar: 'Barras', line: 'Línea', doughnut: 'Dona', table: 'Tabla' };
  const PALETA = ['#C25B32', '#E9A98F', '#C99A2E', '#7E8B6C', '#3FA8A6', '#D0609F', '#AF4030', '#F3C8B4', '#5A2B22', '#8FD0FF'];
  let ct = {}; try { ct = JSON.parse(sessionStorage.getItem('cc_ct') || '{}'); } catch (e) { ct = {}; }
  let pendCharts = {};
  const metas = () => (CC.db.config.metas = CC.db.config.metas || {});
  function chartCard(o) {
    pendCharts[o.id] = o; const tipo = ct[o.id] || o.tipo || 'bar'; const fmt = o.fmt || ((v) => money(v)); const meta = metas()[o.id];
    const alc = meta && o.metaRef != null ? o.metaRef / meta * 100 : null;
    const tabla = `<div class="ch-tbl"><table><thead><tr><th>${esc(o.eje || '')}</th>${o.series.map(sr => `<th class="num">${esc(sr.label)}</th>`).join('')}</tr></thead><tbody>${o.labels.map((l, i) => `<tr><td>${esc(l)}</td>${o.series.map(sr => `<td class="num">${sr.data[i] == null ? '—' : fmt(sr.data[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<div class="card chc" id="card-${o.id}"><div class="ch-head"><div><h3>${o.title} <span>· ${o.sub || ''}</span></h3><div class="ch-stat"><span class="ch-big">${o.big}</span>${o.delta != null ? `<span class="d ${o.delta >= 0 ? 'up' : 'dn'}">${o.delta >= 0 ? '▲' : '▼'} ${Math.abs(o.delta).toFixed(1)}%</span>` : ''}${o.deltaTxt ? `<span class="small muted">${o.deltaTxt}</span>` : ''}</div></div>
      <div class="ch-tools">${meta ? `<span class="pill ${alc >= 100 ? 'ok' : 'warn'}" title="${esc(o.metaLabel || 'meta')}">Meta ${fmt(meta)}${alc != null ? ' · ' + alc.toFixed(0) + '%' : ''}</span>` : ''}${o.metaRef != null ? `<button class="btn sec sm" data-meta="${o.id}">${I('target')}${meta ? 'Cambiar meta' : 'Fijar meta'}</button>` : ''}<select class="mini" data-ct="${o.id}" aria-label="Tipo de gráfica">${Object.entries(CT).map(([k, l]) => `<option value="${k}" ${tipo === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
      ${tipo === 'table' ? tabla : `<div class="ch-cv" style="height:${o.h || 170}px"><canvas id="${o.id}"></canvas></div>`}</div>`;
  }
  function drawChart(o) {
    const tipo = ct[o.id] || o.tipo || 'bar'; if (tipo === 'table') return; const fmt = o.fmt || ((v) => money(v)); const meta = metas()[o.id];
    const tick = o.tick || ((v) => '$' + (v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : (v / 1000).toFixed(0) + 'k'));
    if (tipo === 'doughnut') { const sr = o.series[0]; chart(o.id, { type: 'doughnut', data: { labels: o.labels, datasets: [{ data: sr.data, backgroundColor: o.labels.map((_, i) => PALETA[i % PALETA.length]), borderWidth: 0, hoverOffset: 6 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 10 } }, tooltip: { callbacks: { label: (c) => ' ' + c.label + ': ' + fmt(c.parsed) } } } } }); return; }
    const ds = o.series.map((sr, i) => ({ label: sr.label, data: sr.data, type: sr.type || undefined, borderColor: sr.color || PALETA[i], backgroundColor: sr.colors || sr.color || PALETA[i], borderDash: sr.dash || undefined, tension: .35, pointRadius: tipo === 'line' ? 3 : 0, borderRadius: 6, borderWidth: tipo === 'line' || sr.type === 'line' ? 2 : 0, fill: false, maxBarThickness: 34 }));
    if (meta) ds.push({ label: 'Meta', type: 'line', data: o.labels.map(() => meta), borderColor: '#F1C453', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false });
    chart(o.id, { type: tipo, data: { labels: o.labels, datasets: ds }, options: { responsive: true, maintainAspectRatio: false, indexAxis: o.horizontal && tipo === 'bar' ? 'y' : 'x', plugins: { legend: { display: ds.length > 1, position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + fmt(c.parsed[o.horizontal && tipo === 'bar' ? 'x' : 'y']) } } }, scales: { x: { grid: { display: !!(o.horizontal && tipo === 'bar') }, ticks: o.horizontal && tipo === 'bar' ? { callback: tick } : {} }, y: { grid: { display: !(o.horizontal && tipo === 'bar') }, ticks: o.horizontal && tipo === 'bar' ? {} : { callback: tick }, beginAtZero: true } } } });
  }
  function mountOne(o) {
    drawChart(o);
    const sl = document.querySelector(`select[data-ct="${o.id}"]`); if (sl) sl.onchange = () => { ct[o.id] = sl.value; sessionStorage.setItem('cc_ct', JSON.stringify(ct)); const el = document.getElementById('card-' + o.id); if (el) { el.outerHTML = chartCard(o); mountOne(o); } };
    const bm = document.querySelector(`[data-meta="${o.id}"]`); if (bm) bm.onclick = () => sheetMeta(o);
  }
  function mountCharts() { const ps = Object.values(pendCharts); pendCharts = {}; ps.forEach(mountOne); }
  function sheetMeta(o) {
    const fmt = o.fmt || ((v) => money(v)); const actual = metas()[o.id];
    sheet(`<div class="row"><h3 style="margin:0;">Fijar meta · ${o.title}</h3><button class="btn sec sm" id="cls">Cerrar</button></div><div class="small muted" style="margin:6px 0 0 0;">${esc(o.metaLabel || 'Meta para esta gráfica')}. Hoy: <b style="color:var(--darktext)">${fmt(o.metaRef)}</b>.</div><label class="lbl">Meta</label><input class="txt" id="mV" type="number" value="${actual || Math.round((o.metaRef || 0) * 1.1)}"><div style="display:flex; gap:8px; margin-top:14px;"><button class="btn" id="mGo" style="flex:1;">Guardar meta</button>${actual ? '<button class="btn sec" id="mDel">Quitar</button>' : ''}</div>`);
    $('#cls').onclick = closeSheet;
    $('#mGo').onclick = () => { metas()[o.id] = Number($('#mV').value) || 0; if (!metas()[o.id]) delete metas()[o.id]; CC.save(); closeSheet(); toast('Meta guardada'); render(); };
    const d = $('#mDel'); if (d) d.onclick = () => { delete metas()[o.id]; CC.save(); closeSheet(); render(); };
  }
 
  // ═════════════ TABLERO ═════════════
  function vTablero() {
    const n = CC.M.noche(suc); const comp = CC.M.comparativo(); const dias = CC.M.porDiaSemana(suc, 90); const mejor = dias.slice().sort((a, b) => b.prom - a.prom)[0]; const horas = CC.M.porHora(suc); const meses = CC.M.porMes(suc); const top = CC.M.topProductos(suc, 6); const merma = CC.M.mermaUltima(suc); const teo = suc === 'all' ? [] : CC.M.teoricoBotellas(suc);
    const alertas = [];
    CC.M.cajaHoy(suc).pendientes.slice(0, 2).forEach(p => alertas.push(['warn', `Pago en efectivo pendiente de confirmar: ${esc(p.concepto)} · ${money(p.monto)}`]));
    teo.filter(t => t.alerta).slice(0, 3).forEach(t => alertas.push(['bad', `${esc(t.nombre)} bajo mínimo en ${esc(S().nombre)}: quedan ${t.existencia - t.vendidasHoy}`]));
    merma.items.filter(i => i.dif <= -0.6).slice(0, 2).forEach(i => alertas.push(['bad', `Merma fuera de rango: ${esc(i.nombre)} ${i.dif} botellas en ${esc(CC.suc(i.suc).nombre)}`]));
    const porLlegar = CC.db.reservas.filter(x => x.fecha === CC.hoy() && x.estado === 'confirmada' && (suc === 'all' || x.suc === suc)).length; if (porLlegar) alertas.push(['warn', `${porLlegar} mesas reservadas sin llegar todavía`]);
    if (!alertas.length) alertas.push(['ok', 'Sin alertas. Cortesías dentro del tope.']);
    const prev = comp.filter(c => suc === 'all' || c.suc.id === suc).reduce((a, c) => a + c.prev, 0); const deltaAll = prev ? (n.total - prev) / prev * 100 : 0;
    const real = horas.reduce((a, x) => a + (x.venta || 0), 0), prog = horas.filter(x => x.venta != null).reduce((a, x) => a + x.programado, 0);
    const promDias = dias.reduce((a, d) => a + d.prom, 0) / Math.max(1, dias.length); const mejorMes = meses.slice().sort((a, b) => b.total - a.total)[0]; const promMes = meses.reduce((a, m) => a + m.total, 0) / Math.max(1, meses.length);
    const html = `<div class="kgrid">
      ${kpi({ icon: 'money', label: 'Venta de la noche', value: money(n.total), delta: deltaAll, sub: 'contra el sábado pasado a esta hora' })}
      ${kpi({ icon: 'people', label: 'Personas', value: n.personas.toLocaleString('es-MX'), sub: `${pct(n.ocupPct, 0)} del aforo · cover ${money(n.cover)}` })}
      ${kpi({ icon: 'table', label: 'Ocupación de mesas', value: pct(n.mesasPct, 0), cls: 'good', sub: `${n.sentadas} sentadas · ${n.confirmadas} por llegar · ${n.noshow} no llegaron` })}
      ${kpi({ icon: 'ticket', label: 'Ticket promedio', value: money(n.ticket), sub: 'por persona · sin propina' })}
      ${kpi({ icon: 'bottle', label: 'Costo de barra', value: pct(n.costoBarraPct), cls: n.costoBarraPct <= 25 ? 'good' : 'amber', sub: 'contra venta de barra · meta 25%' })}
      ${kpi({ icon: 'drop', label: 'Merma último cierre', value: pct(merma.pct), cls: 'warm', sub: 'teórico contra físico' })}
    </div>
    <div class="grid g32">
      ${chartCard({ id: 'chHoras', title: 'Venta por hora', sub: 'esta noche · real hasta las 23 h contra lo programado', big: money(real), delta: prog ? (real - prog) / prog * 100 : null, deltaTxt: 'contra lo programado a esta hora', tipo: 'line', labels: horas.map(x => (x.hora % 24) + ':00'), series: [{ label: 'Real', data: horas.map(x => x.venta), color: '#C25B32' }, { label: 'Programado', data: horas.map(x => x.programado), color: '#E9CFC6', dash: [4, 4] }], eje: 'Hora', h: 190 })}
      ${chartCard({ id: 'chSuc', title: 'Por sucursal', sub: 'esta noche contra el sábado pasado a esta hora', big: money(comp.reduce((a, c) => a + c.hoy, 0)), delta: comp.reduce((a, c) => a + c.prev, 0) ? (comp.reduce((a, c) => a + c.hoy, 0) - comp.reduce((a, c) => a + c.prev, 0)) / comp.reduce((a, c) => a + c.prev, 0) * 100 : null, deltaTxt: 'las dos sucursales', tipo: 'bar', labels: comp.map(c => c.suc.nombre), series: [{ label: 'Hoy', data: comp.map(c => c.hoy), color: '#C25B32' }, { label: 'Sábado pasado a esta hora', data: comp.map(c => c.prev), color: '#E9A98F' }], eje: 'Sucursal', metaRef: comp.reduce((a, c) => a + c.hoy, 0), metaLabel: 'Meta de venta por noche, las dos sucursales', h: 190 })}
    </div>
    <div class="grid g3">
      ${chartCard({ id: 'chDias', title: 'Qué días rinden más', sub: 'promedio por noche, 90 días', big: mejor.dia, delta: promDias ? (mejor.prom - promDias) / promDias * 100 : null, deltaTxt: `${money(mejor.prom)} · sobre el promedio`, tipo: 'bar', labels: dias.map(d => d.dia), series: [{ label: 'Promedio por noche', data: dias.map(d => d.prom), colors: dias.map(d => d.dia === mejor.dia ? '#C25B32' : '#5A2B22'), color: '#C25B32' }], eje: 'Día', metaRef: mejor.prom, metaLabel: 'Meta de venta por noche' })}
      ${chartCard({ id: 'chMeses', title: 'Temporada', sub: 'venta por mes', big: mejorMes ? mejorMes.mes : '—', delta: mejorMes && promMes ? (mejorMes.total - promMes) / promMes * 100 : null, deltaTxt: mejorMes ? `${money(mejorMes.total)} · sobre el promedio` : '', tipo: 'bar', labels: meses.map(m => m.mes), series: [{ label: 'Venta del mes', data: meses.map(m => m.total), color: '#C25B32' }], eje: 'Mes', metaRef: mejorMes ? mejorMes.total : null, metaLabel: 'Meta de venta mensual' })}
      ${chartCard({ id: 'chTop', title: 'Lo más vendido', sub: 'esta noche', big: top.length ? esc(top[0].nombre) : '—', deltaTxt: top.length ? money(top[0].venta) + ' · el más vendido' : 'sin pedidos todavía', tipo: 'bar', horizontal: true, labels: top.map(t => t.nombre.replace(/ 750 ml$/, '')), series: [{ label: 'Venta', data: top.map(t => t.venta), color: '#C25B32' }], eje: 'Producto' })}
    </div>
    <div class="grid g3">
      <div class="card"><h3>Alertas de la noche</h3>${alertas.map(([t, m]) => `<div class="alert"><i style="background:${t === 'bad' ? '#FB7185' : t === 'warn' ? '#F1C453' : '#7ED3A0'}"></i><span>${m}</span></div>`).join('')}</div>
      <div class="card"><h3>Merma por producto <span>· último cierre</span></h3>${merma.items.slice(0, 6).map(i => `<div class="row small" style="padding:7px 0; border-bottom:1px solid var(--darkline);"><span>${esc(i.nombre)} <span class="muted">· ${esc(CC.suc(i.suc).nombre)}</span></span><b class="num" style="color:${i.dif <= -0.6 ? '#FB7185' : i.dif < 0 ? '#F1C453' : '#7ED3A0'}">${i.dif > 0 ? '+' : ''}${i.dif}</b></div>`).join('') || '<div class="muted small">Sin cierres registrados.</div>'}</div>
      <div class="card"><h3>Actividad en vivo</h3><div class="feed">${CC.db.bitacora.slice(0, 8).map(b => `<div><time>${new Date(b.t).toTimeString().slice(0, 5)}</time>${esc(b.quien)} · ${esc(b.que)}</div>`).join('')}</div></div>
    </div>`;
    shell(html, 'Tablero de socios', `Noche en vivo · ${esc(CC.fechaLarga(CC.hoy()))} · datos ilustrativos`);
  }

  // ═════════════ MESAS (hostess) ═════════════
  const estadoMesa = (m) => CC.estadoMesa(m);
  function vMesas() {
    const sucId = sucActiva(); const s = CC.suc(sucId);
    const resHoy = CC.db.reservas.filter(r => r.suc === sucId && r.fecha === CC.hoy() && r.estado !== 'liberada');
    const m = sel.mesaId ? CC.mesa(sel.mesaId) : null; const em = m ? estadoMesa(m) : null;
    if (m && m.suc !== sucId) { sel.mesaId = null; return vMesas(); }
    let panel = '';
    if (!m) panel = `<div class="card"><h3>Toca una mesa</h3><div class="small muted">Verás la reserva, el cliente, su grupo, la preorden y la cuenta. Desde aquí se sienta, se libera o se registra una reserva nueva.</div><button class="btn" id="btnNueva" style="margin-top:12px;">Registrar reserva</button></div>`;
    else if (!em.r) panel = `<div class="card"><h3>Mesa ${m.num} · Piso ${m.piso} <span>· libre</span></h3><div class="small muted">${CC.TIPOS_QR[m.tipo].nombre} · hasta ${m.cap} personas · mínimo ${money(m.minimo)} · anticipo ${money(m.anticipo)}${m.salon ? ' · ' + esc(m.salon) : ''}</div><div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;"><button class="btn" id="btnNueva">Registrar reserva en esta mesa</button><button class="btn sec" id="btnTarjeta">${I('qr')}Tarjeta de la mesa</button></div></div>`;
    else { const r = em.r; const c = r.clienteId ? CC.cliente(r.clienteId) : null; const cta = CC.M.cuentaMesa(r.id); panel = `<div class="card"><div class="row"><h3 style="margin:0;">Mesa ${m.num} · Piso ${m.piso}${m.salon ? ' · ' + esc(m.salon) : ''}</h3>${tipoBadge(r.tipo)}</div>
        <div style="margin-top:10px;"><b style="font-size:16px;">${esc(r.nombre)}</b> ${c && c.nivel === 'vip' ? '<span class="pill warn">VIP</span>' : ''}<div class="small muted">${r.personas} personas · llega ${esc(r.hora)} · ${r.origen === 'app' ? 'compró por la app' : r.origen === 'qr' ? 'entró con QR' : 'registrada por hostess'} · ${r.estado}</div>${r.motivo ? `<div class="pill" style="margin-top:6px;">🎂 ${esc(r.motivo)}</div>` : ''}</div>
        ${c ? `<div class="cliente-ficha" style="margin-top:10px;"><span class="tag">${c.visitas} visitas</span><span class="tag">${money(c.gasto)} histórico</span><span class="tag">${c.puntos} pts</span><span class="tag">cumple ${c.cumple.split('-')[1]}/${c.cumple.split('-')[0]}</span>${c.notas ? `<div class="small" style="margin-top:6px; color:#F1C453;">Nota: ${esc(c.notas)}</div>` : ''}</div>` : ''}
        ${r.grupo && r.grupo.length ? `<div class="small" style="margin-top:10px;"><b>Grupo</b> · ${r.grupo.filter(g => g.pagado >= g.parte).length}/${r.grupo.length} pagaron<div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:5px;">${r.grupo.map(g => `<span class="pill ${g.pagado >= g.parte ? 'ok' : 'warn'}">${esc(CC.cliente(g.clienteId).nombre.split(' ')[0])} ${money(g.parte)}</span>`).join('')}</div></div>` : ''}
        ${r.preorden && r.preorden.length ? `<div class="small" style="margin-top:10px;"><b>Preorden para servir al llegar</b><br>${r.preorden.map(x => x.cant + ' × ' + esc(CC.prod(x.prodId).nombre)).join(' · ')}</div>` : ''}
        <div class="row" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--darkline);"><span class="small muted">Anticipo ${money(r.anticipo || 0)} · pagado ${money(cta.pagado)}</span><b class="num">Cuenta ${money(cta.total)}</b></div>
        ${cta.items.length ? `<table style="margin-top:6px;"><tbody>${cta.items.slice(-5).map(i => `<tr><td>${i.cant} × ${esc(i.nombre)}</td><td class="small muted">${esc(i.hora)}</td><td><span class="pill ${i.estado === 'entregado' ? 'ok' : i.estado === 'preparando' ? 'warn' : 'info'}">${i.estado}</span></td><td class="num">${money(i.precio * i.cant)}</td></tr>`).join('')}</tbody></table>` : ''}
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">${r.estado !== 'sentada' ? `<button class="btn ok" id="btnSentar">Sentar</button><button class="btn sec" id="btnNoShow">No llegó</button>` : `<button class="btn sec" id="btnPedidoMesero">Pedido de mesero</button><button class="btn sec" id="btnLiberar">Liberar mesa</button>`}<button class="btn sec" id="btnCliente">Ficha del cliente</button><button class="btn sec" id="btnTarjeta">${I('qr')}Tarjeta de la mesa</button></div></div>`; }
    const ocupadas = resHoy.filter(r => r.estado === 'sentada').length, apartadas = resHoy.filter(r => r.estado === 'confirmada' || r.estado === 'pendiente').length, libres = CC.db.mesas.filter(x => x.suc === sucId).length - ocupadas - apartadas;
    const html = `<div class="grid g23" style="margin-top:0;"><div><div class="row" style="margin-bottom:10px;"><span class="small muted"><b style="color:var(--darktext)">${esc(s.nombre)}</b> · ${s.pisos > 1 ? 'planta alta arriba, planta baja abajo' : 'una planta'}</span><span class="small muted">${ocupadas} ocupadas · ${apartadas} apartadas · ${libres} libres</span></div><div class="card plano" style="padding:8px;">${CC.planoSVG(sucId, { selId: sel.mesaId, interactivo: true, nombres: true })}<div class="leyenda">${CC.PLANO_LEYENDA.filter(([k]) => k !== 'sel').map(([k, l]) => `<span><i style="background:${CC.PLANO_COLORES[k]};"></i>${l}</span>`).join('')}<span><i style="background:${CC.PLANO_COLORES.sel}; outline:2px solid #fff; outline-offset:-1px;"></i>Seleccionada</span></div></div></div>
      <div class="mesas-panel">${panel}<div class="card" style="margin-top:12px;"><h3>Reservas de la noche <span>· ${esc(s.nombre)}</span></h3><table><thead><tr><th>Hora</th><th>Mesa</th><th>Nombre</th><th class="num">Pers.</th><th>Estado</th><th>Origen</th></tr></thead><tbody>${resHoy.slice().sort((a, b) => (a.hora || '') < (b.hora || '') ? -1 : 1).map(r => `<tr data-row="${r.mesaId || ''}" style="cursor:pointer;"><td class="num">${esc(r.hora || '')}</td><td><span class="cellrow"><b class="num">${r.mesaId ? CC.mesa(r.mesaId).num : '—'}</b>${tipoBadge(r.tipo)}</span></td><td>${esc(r.nombre)}</td><td class="num">${r.personas}</td><td><span class="pill ${r.estado === 'sentada' ? 'ok' : r.estado === 'noshow' ? 'bad' : r.estado === 'pendiente' ? 'warn' : 'info'}">${r.estado}</span></td><td class="small muted">${r.origen}</td></tr>`).join('')}</tbody></table></div>
      <div class="card" style="margin-top:12px;"><h3>Lista de espera</h3><div class="small muted">Cuando una mesa se libera, se ofrece en orden a quien está esperando.</div><div class="feed" style="margin-top:6px;"><div>Grupo de 6 · Andrea S. · desde 22:10</div><div>Grupo de 4 · Raúl Z. · desde 22:35</div></div></div></div></div>`;
    shell(html, 'Mesas y reservas', 'Plano vivo del local · adiós al formulario');
    $$('[data-mesa]').forEach(g => g.addEventListener('click', () => { sel.mesaId = g.dataset.mesa; render(); }));
    $$('[data-row]').forEach(tr => tr.onclick = () => { if (tr.dataset.row) { sel.mesaId = tr.dataset.row; render(); } });
    const bn = $('#btnNueva'); if (bn) bn.onclick = () => sheetReserva(sucId, m);
    const bs = $('#btnSentar'); if (bs) bs.onclick = () => { const r = em.r; r.estado = 'sentada'; r.entrada = CC.ahoraHM(); CC.registrarAcceso({ suc: sucId, reservaId: r.id, tipo: r.tipo, nombre: r.nombre, personas: r.personas, resultado: 'ok', puerta: 'Hostess' }); CC.log('hostess', 'Sentó a ' + r.nombre + ' en mesa ' + m.num); CC.save(); toast('Mesa sentada'); render(); };
    const bns = $('#btnNoShow'); if (bns) bns.onclick = () => { em.r.estado = 'noshow'; CC.log('hostess', 'No llegó: ' + em.r.nombre); CC.save(); toast('Marcada como no llegó; la mesa queda libre'); sel.mesaId = null; render(); };
    const bl = $('#btnLiberar'); if (bl) bl.onclick = () => { em.r.estado = 'liberada'; CC.log('hostess', 'Liberó mesa ' + m.num); CC.save(); toast('Mesa liberada'); sel.mesaId = null; render(); };
    const bp = $('#btnPedidoMesero'); if (bp) bp.onclick = () => sheetPedidoMesero(em.r);
    const bcli = $('#btnCliente'); if (bcli) bcli.onclick = () => { if (em.r.clienteId) { sel.clienteId = em.r.clienteId; go('clientes'); } else toast('Este acceso no está ligado a un cliente registrado'); };
    const bt = $('#btnTarjeta'); if (bt) bt.onclick = () => sheetTarjeta(m);
  }
  // tarjeta física que va en la mesa: el cliente la escanea y entra a la app con su cuenta, ya ligado a esa mesa
  function sheetTarjeta(m) {
    const url = new URL('../cliente/?mesa=' + m.num + '&suc=' + m.suc, location.href).href;
    sheet(`<div class="row"><h3 style="margin:0;">Tarjeta de la mesa ${m.num}</h3><button class="btn sec sm" id="cls">Cerrar</button></div>
      <div class="tent"><img src="../shared/img/logo_cream.png" alt="Canta Corazón"><b>Mesa ${m.num}</b><div class="tq" id="tentQR"></div><p>Escanea con tu cámara: pide, divide la cuenta y pide tu canción desde tu mesa.</p><span>${esc(CC.suc(m.suc).nombre)}${m.salon ? ' · ' + esc(m.salon) : ' · Piso ' + m.piso}</span></div>
      <div class="small muted" style="margin-top:10px; line-height:1.5;">Abre la app del cliente con su cuenta (correo y contraseña, o crear cuenta) y ya ligada a esta mesa. En la fase real también puede llevar un chip NFC para solo acercar el teléfono.</div>
      <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Abrir como cliente</a><button class="btn sec" id="tCopiar">Copiar enlace</button></div>`);
    $('#cls').onclick = closeSheet;
    new QRCode($('#tentQR'), { text: url, width: 360, height: 360, colorDark: '#320707', colorLight: '#F6EFE4', correctLevel: QRCode.CorrectLevel.M });
    $('#tCopiar').onclick = () => { if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => { }); toast('Enlace copiado'); };
  }
  function sheetReserva(sucId, mesa) {
    const mesasLibres = CC.db.mesas.filter(m => m.suc === sucId && estadoMesa(m).estado === 'libre');
    sheet(`<div class="row"><h3 style="margin:0;">Registrar reserva</h3><button class="btn sec sm" id="cls">Cerrar</button></div>
      <label class="lbl">Cliente</label><input class="txt" id="rNombre" list="cl" placeholder="Nombre o busca un cliente"><datalist id="cl">${CC.db.clientes.map(c => `<option value="${esc(c.nombre)}">`).join('')}</datalist>
      <div class="grid g3" style="margin-top:0;"><div><label class="lbl">Tipo</label><select class="txt" id="rTipo"><option value="mesa">Mesa</option><option value="vip">Mesa VIP</option><option value="cover">Cover</option><option value="barra">Barra</option></select></div><div><label class="lbl">Personas</label><input class="txt" id="rPers" type="number" value="4"></div><div><label class="lbl">Hora</label><input class="txt" id="rHora" value="22:30"></div></div>
      <label class="lbl">Mesa</label><select class="txt" id="rMesa"><option value="">Sin mesa</option>${mesasLibres.map(m => `<option value="${m.id}" ${mesa && m.id === mesa.id ? 'selected' : ''}>Mesa ${m.num} · Piso ${m.piso} · ${CC.TIPOS_QR[m.tipo].nombre} · mín ${money(m.minimo)}</option>`).join('')}</select>
      <label class="lbl">Motivo / notas</label><input class="txt" id="rMotivo" placeholder="Cumpleaños, alergias, mesa cerca del escenario…">
      <label class="lbl">Anticipo</label><select class="txt" id="rPago"><option value="efectivo">Paga en caja (pendiente)</option><option value="tarjeta">Cobrado con terminal</option><option value="spei">Transferencia recibida</option><option value="link">Mandar link de pago</option></select>
      <button class="btn" id="rGo" style="margin-top:14px; width:100%;">Guardar y generar QR</button>`);
    $('#cls').onclick = closeSheet;
    $('#rGo').onclick = async () => { const nombre = $('#rNombre').value.trim(); if (!nombre) { toast('Escribe el nombre'); return; } const mId = $('#rMesa').value || null; const mm = mId ? CC.mesa(mId) : null; const tipo = mm ? mm.tipo : $('#rTipo').value; const cli = CC.db.clientes.find(c => c.nombre.toLowerCase() === nombre.toLowerCase()); const pago = $('#rPago').value; const anticipo = mm ? mm.anticipo : CC.PRECIOS()[tipo === 'cover' ? 'cover' : 'barra'] * Number($('#rPers').value || 1);
      const r = CC.crearReserva({ suc: sucId, hora: $('#rHora').value, tipo, mesaId: mId, clienteId: cli ? cli.id : null, nombre, personas: Number($('#rPers').value || 1), estado: pago === 'efectivo' || pago === 'link' ? 'pendiente' : 'confirmada', anticipo, pagado: pago === 'efectivo' || pago === 'link' ? 0 : anticipo, metodo: pago, origen: 'hostess', motivo: $('#rMotivo').value.trim() });
      CC.registrarPago({ suc: sucId, clienteId: cli ? cli.id : null, reservaId: r.id, concepto: (mm ? 'Anticipo mesa ' + mm.num : CC.TIPOS_QR[tipo].nombre) + ' · hostess', monto: anticipo, metodo: pago === 'link' ? 'tarjeta' : pago, estado: pago === 'efectivo' || pago === 'link' ? 'pendiente_caja' : 'aprobado' });
      closeSheet(); sel.mesaId = mId; toast('Reserva guardada. QR enviado por WhatsApp (simulado).'); render(); };
  }
  function sheetPedidoMesero(r) {
    const carrito = {}; const meseros = CC.db.personal.filter(e => e.suc === r.suc && e.rol === 'mesero');
    const draw = () => { const total = Object.entries(carrito).reduce((a, [id, c]) => a + CC.prod(id).precio * c, 0); $('#pmBody').innerHTML = `<div style="max-height:40vh; overflow:auto;">${CC.db.productos.filter(p => p.cat !== 'extra').map(p => `<div class="row" style="padding:6px 0; border-bottom:1px solid var(--darkline);"><span class="small">${esc(p.nombre)} <span class="muted">${money(p.precio)}</span></span><span><button class="btn sec sm" data-m="${p.id}">−</button> <b class="num">${carrito[p.id] || 0}</b> <button class="btn sec sm" data-p="${p.id}">+</button></span></div>`).join('')}</div><label class="lbl">Mesero</label><select class="txt" id="pmMesero">${meseros.map(e => `<option value="${e.id}">${esc(e.nombre)}</option>`).join('')}</select><button class="btn" id="pmGo" style="margin-top:12px; width:100%;" ${total ? '' : 'disabled'}>Enviar a barra · ${money(total)}</button>`; $$('[data-p]', $('#pmBody')).forEach(b => b.onclick = () => { carrito[b.dataset.p] = (carrito[b.dataset.p] || 0) + 1; draw(); }); $$('[data-m]', $('#pmBody')).forEach(b => b.onclick = () => { if (carrito[b.dataset.m]) { carrito[b.dataset.m]--; if (!carrito[b.dataset.m]) delete carrito[b.dataset.m]; } draw(); }); const g = $('#pmGo'); if (g) g.onclick = () => { CC.crearPedido({ suc: r.suc, mesaId: r.mesaId, reservaId: r.id, items: Object.entries(carrito).map(([id, c]) => ({ prodId: id, cant: c, precio: CC.prod(id).precio, porClienteId: r.clienteId })), origen: 'mesero', meseroId: $('#pmMesero').value }); closeSheet(); toast('Pedido enviado a barra'); render(); }; };
    sheet(`<div class="row"><h3 style="margin:0;">Pedido de mesero · mesa ${CC.mesa(r.mesaId).num}</h3><button class="btn sec sm" id="cls">Cerrar</button></div><div id="pmBody" style="margin-top:8px;"></div>`); $('#cls').onclick = closeSheet; draw();
  }

  // ═════════════ PEDIDOS (barra en vivo) ═════════════
  function vPedidos() {
    const sucId = sucActiva(); const ped = CC.db.pedidos.filter(p => p.suc === sucId).sort((a, b) => b.creado - a.creado);
    const ventaPed = ped.reduce((a, p) => a + p.items.reduce((x, i) => x + i.precio * i.cant, 0), 0); const ticketPed = ped.length ? ventaPed / ped.length : 0;
    const col = (estado, titulo) => `<div class="card"><h3>${titulo} <span>· ${ped.filter(p => p.estado === estado).length}</span></h3>${ped.filter(p => p.estado === estado).slice(0, 12).map(p => { const m = CC.mesa(p.mesaId); return `<div class="ocard ${p.origen}"><div class="row"><b>Mesa ${m ? m.num : '—'}${m && m.piso > 1 ? ' · P' + m.piso : ''}</b><span class="cellrow"><span class="pill ${p.origen === 'app' ? '' : 'info'}">${p.origen === 'app' ? 'desde la app' : 'mesero'}</span></span></div><div class="it">${p.items.map(i => `${i.cant} × ${esc((CC.prod(i.prodId) || {}).nombre)}`).join('<br>')}</div><div class="row"><span class="meta">${esc(p.hora)}${p.meseroId ? ' · ' + esc((CC.emp(p.meseroId) || {}).nombre || '').split(' ')[0] : ''}</span>${estado === 'nuevo' ? `<button class="btn sm" data-adv="${p.id}" data-to="preparando">Preparar</button>` : estado === 'preparando' ? `<button class="btn ok sm" data-adv="${p.id}" data-to="entregado">Entregado</button>` : `<span class="pill ok">✓</span>`}</div></div>`; }).join('') || '<div class="muted small">Nada por ahora.</div>'}</div>`;
    const canc = CC.db.canciones.filter(c => c.suc === sucId);
    const teo = CC.M.teoricoBotellas(sucId);
    const html = `<div class="kgrid">${kpi({ icon: 'bell', label: 'Nuevos', value: ped.filter(p => p.estado === 'nuevo').length, cls: ped.some(p => p.estado === 'nuevo') ? 'amber' : '', sub: 'por preparar' })}${kpi({ icon: 'fire', label: 'En preparación', value: ped.filter(p => p.estado === 'preparando').length, sub: 'en la barra' })}${kpi({ icon: 'check', label: 'Entregados', value: ped.filter(p => p.estado === 'entregado').length, cls: 'good', sub: 'esta noche' })}${kpi({ icon: 'money', label: 'Venta por pedidos', value: money(ventaPed), sub: `${ped.length} pedidos · ${money(ticketPed)} por pedido` })}</div>
      <div class="kds">${col('nuevo', 'Nuevos')}${col('preparando', 'En preparación')}${col('entregado', 'Entregados')}</div>
      <div class="grid g2 apila"><div class="card"><h3>Canciones y dedicatorias <span>· cola del mariachi</span></h3>${canc.map(c => `<div class="row" style="padding:7px 0; border-bottom:1px solid var(--darkline);"><span class="small"><b>${esc(c.cancion)}</b>${c.dedicatoria ? ' · «' + esc(c.dedicatoria) + '»' : ''} <span class="muted">· mesa ${c.mesaId ? CC.mesa(c.mesaId).num : '—'} · ${esc(c.hora)}</span></span>${c.estado === 'cantada' ? '<span class="pill ok">Cantada</span>' : `<button class="btn sec sm" data-song="${c.id}">Cantada</button>`}</div>`).join('') || '<div class="muted small">Sin canciones pedidas.</div>'}</div>
      <div class="card"><h3>Botellas abiertas y teórico <span>· hoy</span></h3><table><thead><tr><th>Botella</th><th class="num">Abiertas</th><th class="num">Vendidas</th><th class="num">ml en tragos</th><th class="num">Teórico</th></tr></thead><tbody>${teo.map(t => `<tr><td>${esc(t.nombre)}${t.alerta ? ' <span class="pill bad">bajo mínimo</span>' : ''}</td><td class="num">${t.abiertas}</td><td class="num">${t.vendidasHoy}</td><td class="num">${t.mlHoy}</td><td class="num">${t.teorico}</td></tr>`).join('')}</tbody></table></div></div>`;
    shell(html, 'Pedidos', 'De meseros, de mesa y desde la app: la barra los surte y la cuenta se actualiza sola');
    $$('[data-adv]').forEach(b => b.onclick = () => { const p = CC.db.pedidos.find(x => x.id === b.dataset.adv); p.estado = b.dataset.to; if (b.dataset.to === 'entregado') { const inv = CC.db.inventario[p.suc]; p.items.forEach(i => { const pr = CC.prod(i.prodId); if (pr && inv[pr.id] && pr.cat !== 'trago') inv[pr.id].existencia = Math.max(0, inv[pr.id].existencia - i.cant); }); } CC.log('barra', 'Pedido ' + b.dataset.to + ' · mesa ' + (CC.mesa(p.mesaId) || {}).num); CC.save(); render(); });
    $$('[data-song]').forEach(b => b.onclick = () => { const c = CC.db.canciones.find(x => x.id === b.dataset.song); c.estado = 'cantada'; CC.save(); render(); });
  }

  // ═════════════ INVENTARIO ═════════════
  function stockBar(exist, minimo) {
    const par = Math.max(1, minimo * 3); const p = Math.max(0, Math.min(100, exist / par * 100)); const cls = exist <= minimo ? 'bad' : exist <= minimo * 1.6 ? 'warn' : 'ok';
    return `<div class="stk"><div class="bar"><i class="${cls}" style="width:${p.toFixed(0)}%"></i></div><span class="v">${exist} <span>/ ${par}</span></span></div>${cls === 'bad' ? '<div class="tiny" style="color:#FB7185; margin-top:3px;">reordenar · mínimo ' + minimo + '</div>' : ''}`;
  }
  function vInventario() {
    const sucId = sucActiva(); const inv = CC.db.inventario[sucId]; const teo = CC.M.teoricoBotellas(sucId); const merma = CC.M.mermaUltima(sucId);
    const otros = CC.db.productos.filter(p => inv[p.id] && p.cat !== 'botella');
    const html = `<div class="kgrid">${kpi({ icon: 'bottle', label: 'Botellas en existencia', value: teo.reduce((a, t) => a + t.existencia, 0), sub: `${teo.filter(t => t.alerta).length} bajo mínimo` })}${kpi({ icon: 'glass', label: 'Abiertas en barra', value: teo.reduce((a, t) => a + t.abiertas, 0), sub: 'controladas por sello' })}${kpi({ icon: 'drop', label: 'Merma último cierre', value: pct(merma.pct), cls: 'warm', sub: 'teórico contra físico' })}${kpi({ icon: 'money', label: 'Valor del inventario', value: money(CC.db.productos.reduce((a, p) => a + (inv[p.id] ? inv[p.id].existencia * p.costo : 0), 0)), sub: 'a costo de compra' })}</div>
      <div class="grid g32 apila"><div class="card"><div class="row wrap"><h3 style="margin:0;">Botellas <span>· ${esc(CC.suc(sucId).nombre)}</span></h3><div class="acciones"><button class="btn sec sm" id="btnTraspaso">Traspaso entre sucursales</button><button class="btn sm" id="btnConteo">Conteo de cierre</button></div></div>
        <table style="margin-top:10px;"><thead><tr><th>Producto</th><th>Existencia <span style="text-transform:none; letter-spacing:0;">· contra el nivel ideal</span></th><th class="num">Abiertas</th><th class="num">Vendidas hoy</th><th class="num">Teórico</th></tr></thead><tbody>${teo.map(t => `<tr><td class="nw"><b>${esc(t.nombre)}</b></td><td>${stockBar(t.existencia, t.minimo)}</td><td class="num">${t.abiertas}</td><td class="num">${t.vendidasHoy}${t.mlHoy ? ' <span class="muted">+' + t.mlHoy + ' ml</span>' : ''}</td><td class="num">${t.teorico}</td></tr>`).join('')}</tbody></table></div>
      <div><div class="card"><h3>Merma por producto <span>· último cierre</span></h3>${merma.items.map(i => `<div class="row small" style="padding:7px 0; border-bottom:1px solid var(--darkline);"><span>${esc(i.nombre)}</span><span class="cellrow"><span class="muted">${i.teorico} → ${i.fisico}</span> <b class="num" style="color:${i.dif <= -0.6 ? '#FB7185' : i.dif < 0 ? '#F1C453' : '#7ED3A0'}">${i.dif > 0 ? '+' : ''}${i.dif}</b></span></div>`).join('')}<div class="tiny muted" style="margin-top:8px;">Las recetas descuentan mililitros por trago; el cierre compara con el conteo físico de la barra.</div></div>
        <div class="card" style="margin-top:12px;"><h3>Cerveza, cocina y extras</h3><table><thead><tr><th>Producto</th><th>Existencia</th></tr></thead><tbody>${otros.map(p => `<tr><td class="nw">${esc(p.nombre)}</td><td>${stockBar(inv[p.id].existencia, inv[p.id].minimo || 1)}</td></tr>`).join('')}</tbody></table></div></div></div>`;
    shell(html, 'Inventario y merma', 'Cada trago descuenta la botella; cada botella tiene un costo');
    $('#btnConteo').onclick = () => sheetConteo(sucId, teo);
    $('#btnTraspaso').onclick = () => sheetTraspaso(sucId);
  }
  function sheetConteo(sucId, teo) {
    sheet(`<div class="row"><h3 style="margin:0;">Conteo de cierre · ${esc(CC.suc(sucId).nombre)}</h3><button class="btn sec sm" id="cls">Cerrar</button></div><div class="small muted" style="margin:6px 0 10px 0;">Cuenta las botellas físicas (enteras más fracción de las abiertas). El sistema compara con el teórico.</div>
      <table><thead><tr><th>Botella</th><th class="num">Teórico</th><th class="num">Físico</th></tr></thead><tbody>${teo.map(t => `<tr><td>${esc(t.nombre)}</td><td class="num">${t.teorico}</td><td><input class="txt" data-f="${t.prodId}" type="number" step="0.1" value="${(t.teorico - (Math.random() < 0.3 ? 0.4 : 0)).toFixed(1)}" style="width:90px; text-align:right;"></td></tr>`).join('')}</tbody></table><button class="btn" id="cGo" style="margin-top:12px; width:100%;">Guardar cierre y calcular merma</button>`);
    $('#cls').onclick = closeSheet;
    $('#cGo').onclick = () => { const items = teo.map(t => ({ prodId: t.prodId, teorico: t.teorico, fisico: Number($(`[data-f="${t.prodId}"]`).value) })); CC.db.mermas.push({ id: CC.uid('mm'), suc: sucId, fecha: CC.hoy(), turno: 'Noche', items, responsable: rol }); items.forEach(i => { CC.db.inventario[sucId][i.prodId].existencia = Math.round(i.fisico); }); CC.log('barra', 'Conteo de cierre guardado'); CC.save(); closeSheet(); toast('Cierre guardado; la merma ya está en el tablero'); render(); };
  }
  function sheetTraspaso(sucId) {
    const otra = CC.SUCURSALES().find(s => s.id !== sucId); const bots = CC.db.productos.filter(p => p.cat === 'botella');
    sheet(`<div class="row"><h3 style="margin:0;">Traspaso a ${esc(otra.nombre)}</h3><button class="btn sec sm" id="cls">Cerrar</button></div><label class="lbl">Producto</label><select class="txt" id="tProd">${bots.map(p => `<option value="${p.id}">${esc(p.nombre)} · hay ${CC.db.inventario[sucId][p.id].existencia}</option>`).join('')}</select><label class="lbl">Cantidad</label><input class="txt" id="tCant" type="number" value="6"><button class="btn" id="tGo" style="margin-top:12px; width:100%;">Registrar traspaso</button>`);
    $('#cls').onclick = closeSheet; $('#tGo').onclick = () => { const p = $('#tProd').value, c = Number($('#tCant').value); CC.db.inventario[sucId][p].existencia -= c; CC.db.inventario[otra.id][p].existencia += c; CC.log(rol, 'Traspaso ' + c + ' × ' + CC.prod(p).nombre + ' a ' + otra.nombre); CC.save(); closeSheet(); toast('Traspaso registrado en ambas sucursales'); render(); };
  }

  // ═════════════ COMPRAS (facturas XML) ═════════════
  const XML_EJEMPLO = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="4.0" Serie="A" Folio="2591" Fecha="${CC.hoy()}T10:22:14" SubTotal="23520.00" Moneda="MXN" Total="27283.20" TipoDeComprobante="I" MetodoPago="PPD" LugarExpedicion="37000">
  <cfdi:Emisor Rfc="DBA980512K12" Nombre="DESTILADOS DEL BAJIO SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="CCS210101AB1" Nombre="CANTA CORAZON SALOON" UsoCFDI="G01"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="50202306" Cantidad="12" ClaveUnidad="H87" Descripcion="Tequila reposado 750 ml caja 12" ValorUnitario="960.00" Importe="11520.00"/>
    <cfdi:Concepto ClaveProdServ="50202306" Cantidad="6" ClaveUnidad="H87" Descripcion="Mezcal joven 750 ml" ValorUnitario="800.00" Importe="4800.00"/>
    <cfdi:Concepto ClaveProdServ="50202306" Cantidad="12" ClaveUnidad="H87" Descripcion="Aperol 750 ml" ValorUnitario="600.00" Importe="7200.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="3763.20"/>
  <cfdi:Complemento><tfd:TimbreFiscalDigital Version="1.1" UUID="6B2D9F1E-DEMO-4C1A-9E7B-CANTACORAZON" FechaTimbrado="${CC.hoy()}T10:22:20"/></cfdi:Complemento>
</cfdi:Comprobante>`;
  function parseCFDI(txt) {
    const doc = new DOMParser().parseFromString(txt, 'application/xml'); const q = (sel) => doc.getElementsByTagNameNS('*', sel)[0];
    const comp = q('Comprobante'); if (!comp) throw new Error('No es un CFDI');
    const em = q('Emisor'); const tfd = q('TimbreFiscalDigital');
    const conceptos = Array.from(doc.getElementsByTagNameNS('*', 'Concepto')).map(c => ({ desc: c.getAttribute('Descripcion'), cant: Number(c.getAttribute('Cantidad')), unit: Number(c.getAttribute('ValorUnitario')), importe: Number(c.getAttribute('Importe')) }));
    return { folio: (comp.getAttribute('Serie') || '') + '-' + (comp.getAttribute('Folio') || ''), fecha: (comp.getAttribute('Fecha') || '').slice(0, 10), subtotal: Number(comp.getAttribute('SubTotal')), total: Number(comp.getAttribute('Total')), emisor: em ? em.getAttribute('Nombre') : '', rfc: em ? em.getAttribute('Rfc') : '', uuid: tfd ? tfd.getAttribute('UUID') : '', conceptos };
  }
  function adivinarProducto(desc) { const d = desc.toLowerCase(); return (CC.db.productos.find(p => d.includes(p.nombre.toLowerCase().split(' ')[0]) && (p.cat === 'botella' || p.cat === 'cerveza' || p.cat === 'comida' || p.id === 'x_sombrero') && (d.includes(p.nombre.toLowerCase().split(' ')[1] || '') || p.cat !== 'botella')) || CC.db.productos.find(p => d.includes(p.nombre.toLowerCase().split(' ')[0])) || {}).id || ''; }
  function vCompras() {
    const facts = CC.db.facturas.filter(f => suc === 'all' || f.suc === suc);
    const precios = {}; CC.db.facturas.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1).forEach(f => f.conceptos.forEach(c => { if (!c.prodId) return; precios[c.prodId] = precios[c.prodId] || []; precios[c.prodId].push({ fecha: f.fecha, unit: c.unit, prov: f.provId }); }));
    const cambios = Object.entries(precios).map(([pid, arr]) => ({ pid, nombre: (CC.prod(pid) || {}).nombre, primero: arr[0].unit, ultimo: arr[arr.length - 1].unit, delta: (arr[arr.length - 1].unit - arr[0].unit) / arr[0].unit * 100, n: arr.length })).filter(x => x.n > 1).sort((a, b) => b.delta - a.delta);
    const porPagar = facts.filter(f => f.estado === 'por pagar').reduce((a, f) => a + f.total, 0);
    const html = `<div class="kgrid">${kpi({ icon: 'receipt', label: 'Facturas registradas', value: facts.length, sub: 'últimos 60 días' })}${kpi({ icon: 'cart', label: 'Compras del periodo', value: money(facts.reduce((a, f) => a + f.total, 0)), sub: 'con IVA' })}${kpi({ icon: 'clock', label: 'Por pagar', value: money(porPagar), cls: 'amber', sub: `${facts.filter(f => f.estado === 'por pagar').length} facturas` })}${kpi({ icon: 'truck', label: 'Proveedores', value: CC.db.proveedores.length, sub: 'con precio histórico' })}</div>
      <div class="grid g32 apila"><div class="card"><div class="row wrap"><h3 style="margin:0;">Facturas de proveedor</h3><div class="acciones"><button class="btn sec sm" id="btnManualF">Capturar a mano</button><button class="btn sm" id="btnXML">Importar XML (CFDI)</button></div></div>
        <table style="margin-top:10px;"><thead><tr><th>Fecha</th><th>Proveedor</th><th>Folio</th><th>Sucursal</th><th class="num">Total</th><th>Estado</th></tr></thead><tbody>${facts.slice(0, 14).map(f => `<tr><td class="num">${esc(f.fecha)}</td><td>${esc((CC.prov(f.provId) || { nombre: f.emisor }).nombre)}</td><td>${esc(f.folio)}</td><td>${esc(CC.suc(f.suc).nombre)}</td><td class="num">${money(f.total, 2)}</td><td>${f.estado === 'pagada' ? '<span class="pill ok">pagada</span>' : `<button class="btn sec sm" data-pagar="${f.id}">Marcar pagada</button>`}</td></tr>`).join('')}</tbody></table></div>
      <div><div class="card"><h3>Precios que subieron <span>· por producto</span></h3>${cambios.slice(0, 6).map(c => `<div class="row small" style="padding:6px 0; border-bottom:1px solid var(--darkline);"><span>${esc(c.nombre)}</span><span><span class="muted">${money(c.primero, 0)} → ${money(c.ultimo, 0)}</span> <b class="num" style="color:${c.delta > 5 ? '#FB7185' : c.delta < -2 ? '#7ED3A0' : '#F1C453'}">${c.delta > 0 ? '+' : ''}${c.delta.toFixed(1)}%</b></span></div>`).join('') || '<div class="muted small">Sin variaciones.</div>'}</div>
        <div class="card" style="margin-top:12px;"><h3>Proveedores</h3>${CC.db.proveedores.map(p => `<div class="row small" style="padding:6px 0; border-bottom:1px solid var(--darkline);"><span><b>${esc(p.nombre)}</b><br><span class="muted">${esc(p.cat)} · ${esc(p.rfc)}</span></span><span class="num">${money(CC.db.facturas.filter(f => f.provId === p.id).reduce((a, f) => a + f.total, 0))}</span></div>`).join('')}</div></div></div>`;
    shell(html, 'Compras y facturas', 'El XML del proveedor da de alta la compra y el inventario, sin capturar');
    $$('[data-pagar]').forEach(b => b.onclick = () => { CC.db.facturas.find(f => f.id === b.dataset.pagar).estado = 'pagada'; CC.save(); render(); });
    $('#btnXML').onclick = () => sheetXML(); $('#btnManualF').onclick = () => sheetXML(true);
  }
  function sheetXML(manual = false) {
    const sucId = sucActiva(); let data = manual ? { folio: '', fecha: CC.hoy(), emisor: '', rfc: '', uuid: '', subtotal: 0, total: 0, conceptos: [{ desc: '', cant: 1, unit: 0, importe: 0 }] } : null;
    const draw = () => { $('#xBody').innerHTML = !data ? `<input type="file" id="xFile" accept=".xml,text/xml" class="txt"><div class="row" style="margin-top:10px;"><span class="small muted">O usa una factura de ejemplo con el formato real del SAT (CFDI 4.0).</span><button class="btn sec sm" id="xDemo">Cargar XML de ejemplo</button></div>` : `<div class="grid g3" style="margin-top:0;"><div><label class="lbl">Proveedor</label><input class="txt" id="xEm" value="${esc(data.emisor)}"></div><div><label class="lbl">RFC</label><input class="txt" id="xRfc" value="${esc(data.rfc)}"></div><div><label class="lbl">Folio</label><input class="txt" id="xFol" value="${esc(data.folio)}"></div></div>${data.uuid ? `<div class="tiny muted" style="margin-top:6px;">UUID ${esc(data.uuid)} · fecha ${esc(data.fecha)}</div>` : ''}
      <table style="margin-top:10px;"><thead><tr><th>Concepto en la factura</th><th class="num">Cant.</th><th class="num">Unitario</th><th>Producto en inventario</th></tr></thead><tbody>${data.conceptos.map((c, i) => `<tr><td><input class="txt" data-d="${i}" value="${esc(c.desc)}" placeholder="Descripción"></td><td><input class="txt" data-c="${i}" type="number" value="${c.cant}" style="width:70px; text-align:right;"></td><td><input class="txt" data-u="${i}" type="number" value="${c.unit}" style="width:100px; text-align:right;"></td><td><select class="txt" data-p="${i}"><option value="">— no entra a inventario —</option>${CC.db.productos.filter(p => p.cat !== 'trago' && p.id !== 'x_cancion').map(p => `<option value="${p.id}" ${(c.prodId || adivinarProducto(c.desc)) === p.id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table>
      ${manual ? '<button class="btn sec sm" id="xMas" style="margin-top:8px;">Agregar renglón</button>' : ''}
      <div class="row" style="margin-top:12px;"><span class="small muted">Sucursal que recibe: <b style="color:var(--darktext)">${esc(CC.suc(sucId).nombre)}</b></span><b class="num">Total ${money(data.total || data.conceptos.reduce((a, c) => a + c.cant * c.unit, 0) * 1.16, 2)}</b></div>
      <button class="btn" id="xGo" style="margin-top:12px; width:100%;">Registrar factura y dar entrada al inventario</button>`;
      const f = $('#xFile'); if (f) f.onchange = () => { const r = new FileReader(); r.onload = () => { try { data = parseCFDI(r.result); draw(); } catch (e) { toast('No se pudo leer el XML: ' + e.message); } }; r.readAsText(f.files[0]); };
      const dm = $('#xDemo'); if (dm) dm.onclick = () => { data = parseCFDI(XML_EJEMPLO); draw(); };
      const xm = $('#xMas'); if (xm) xm.onclick = () => { leer(); data.conceptos.push({ desc: '', cant: 1, unit: 0, importe: 0 }); draw(); };
      const leer = () => { data.emisor = $('#xEm').value; data.rfc = $('#xRfc').value; data.folio = $('#xFol').value; data.conceptos.forEach((c, i) => { c.desc = $(`[data-d="${i}"]`).value; c.cant = Number($(`[data-c="${i}"]`).value); c.unit = Number($(`[data-u="${i}"]`).value); c.importe = c.cant * c.unit; c.prodId = $(`[data-p="${i}"]`).value || null; }); };
      const g = $('#xGo'); if (g) g.onclick = () => { leer(); const prov = CC.db.proveedores.find(p => p.rfc === data.rfc) || (data.rfc ? (CC.db.proveedores.push({ id: CC.uid('p'), nombre: data.emisor, rfc: data.rfc, cat: 'Nuevo', contacto: '' }), CC.db.proveedores[CC.db.proveedores.length - 1]) : null); const sub = data.conceptos.reduce((a, c) => a + c.importe, 0); CC.db.facturas.unshift({ id: CC.uid('f'), provId: prov ? prov.id : null, emisor: data.emisor, suc: sucId, fecha: data.fecha || CC.hoy(), folio: data.folio, uuid: data.uuid, subtotal: sub, iva: sub * 0.16, total: data.total || sub * 1.16, conceptos: data.conceptos, estado: 'por pagar', origen: manual ? 'manual' : 'xml' }); data.conceptos.forEach(c => { if (c.prodId && CC.db.inventario[sucId][c.prodId]) CC.db.inventario[sucId][c.prodId].existencia += c.cant; }); CC.log(rol, 'Factura ' + data.folio + ' registrada · entrada a inventario'); CC.save(); closeSheet(); toast('Factura registrada. El inventario ya subió.'); render(); };
    };
    sheet(`<div class="row"><h3 style="margin:0;">${manual ? 'Capturar factura' : 'Importar factura XML'}</h3><button class="btn sec sm" id="cls">Cerrar</button></div><div id="xBody" style="margin-top:10px;"></div>`); $('#cls').onclick = closeSheet; draw();
  }

  // ═════════════ CAJA ═════════════
  function vCaja() {
    const c = CC.M.cajaHoy(suc); const nombres = { applepay: 'Apple Pay', tarjeta: 'Tarjeta', spei: 'Transferencia', efectivo: 'Efectivo' };
    const term = c.porMetodo.filter(m => m.metodo === 'tarjeta' || m.metodo === 'applepay').reduce((a, m) => a + m.monto, 0); const termLote = Math.round(term * 0.997);
    const propinas = c.pagos.reduce((a, p) => a + (p.propina || 0), 0);
    const iconos = { applepay: 'phone', tarjeta: 'card', spei: 'bank', efectivo: 'cash' };
    const html = `<div class="kgrid">${kpi({ icon: 'money', label: 'Cobrado hoy', value: money(c.total), sub: `${c.pagos.length} pagos` })}${['applepay', 'tarjeta', 'spei', 'efectivo'].map(m => { const x = c.porMetodo.find(y => y.metodo === m) || { monto: 0, n: 0, pendientes: 0 }; return kpi({ icon: iconos[m], label: nombres[m], value: money(x.monto), sub: `${x.n} pagos${x.pendientes ? ' · <span style="color:#F1C453">' + money(x.pendientes) + ' por confirmar</span>' : ''}` }); }).join('')}</div>
      <div class="grid g32"><div class="card"><h3>Efectivo pendiente de confirmar <span>· ${c.pendientes.length}</span></h3><div class="small muted" style="margin-bottom:8px;">Reservas apartadas con «pago en caja»: al confirmar, el QR del cliente se activa por completo.</div><table><thead><tr><th>Hora</th><th>Concepto</th><th class="num">Monto</th><th></th></tr></thead><tbody>${c.pendientes.map(p => `<tr><td class="num">${esc(p.hora)}</td><td>${esc(p.concepto)}<br><span class="small muted">${esc((CC.cliente(p.clienteId) || { nombre: '—' }).nombre)}</span></td><td class="num">${money(p.monto)}</td><td><button class="btn ok sm" data-conf="${p.id}">Confirmar cobro</button></td></tr>`).join('') || '<tr><td class="muted small">Nada pendiente.</td></tr>'}</tbody></table>
        <h3 style="margin-top:16px;">Últimos pagos</h3><table><thead><tr><th>Hora</th><th>Concepto</th><th>Método</th><th class="num">Monto</th><th>Estado</th></tr></thead><tbody>${c.pagos.slice(-10).reverse().map(p => `<tr><td class="num">${esc(p.hora)}</td><td>${esc(p.concepto)}</td><td>${nombres[p.metodo] || p.metodo}</td><td class="num">${money(p.monto)}</td><td><span class="pill ${p.estado === 'pendiente_caja' ? 'warn' : 'ok'}">${p.estado === 'pendiente_caja' ? 'pendiente' : p.estado}</span></td></tr>`).join('')}</tbody></table></div>
      <div><div class="card"><h3>Conciliación con la terminal</h3><div class="row small" style="padding:6px 0; border-bottom:1px solid var(--darkline);"><span>Tarjeta y Apple Pay en el sistema</span><b class="num">${money(term)}</b></div><div class="row small" style="padding:6px 0; border-bottom:1px solid var(--darkline);"><span>Lote de la terminal (simulado)</span><b class="num">${money(termLote)}</b></div><div class="row small" style="padding:6px 0;"><span>Diferencia</span><b class="num" style="color:${term - termLote ? '#F1C453' : '#7ED3A0'}">${money(term - termLote)}</b></div><div class="tiny muted" style="margin-top:6px;">En la fase real el lote llega solo del procesador de pagos.</div></div>
        <div class="card" style="margin-top:12px;"><h3>Corte de turno</h3><div class="row small" style="padding:4px 0;"><span>Propinas registradas</span><b class="num">${money(propinas)}</b></div><div class="row small" style="padding:4px 0;"><span>Efectivo contado</span><input class="txt" id="cashCount" type="number" style="width:130px; text-align:right;" value="${(c.porMetodo.find(m => m.metodo === 'efectivo') || { monto: 0 }).monto}"></div><button class="btn" id="btnCorte" style="margin-top:10px; width:100%;">Cerrar turno</button>
        ${CC.db.cortes.filter(x => suc === 'all' || x.suc === suc).slice(0, 4).map(x => `<div class="small muted" style="margin-top:8px;">Corte ${esc(x.fecha)} ${esc(x.hora)} · ${money(x.total)} · efectivo ${money(x.efectivo)} · ${x.diferencia ? 'diferencia ' + money(x.diferencia) : 'cuadró'}</div>`).join('')}</div></div></div>`;
    shell(html, 'Caja y cortes', 'Cada peso con su comprobante y su renglón');
    $$('[data-conf]').forEach(b => b.onclick = () => { const p = CC.db.pagos.find(x => x.id === b.dataset.conf); p.estado = 'confirmado'; const r = p.reservaId ? CC.db.reservas.find(x => x.id === p.reservaId) : null; if (r) { r.pagado = (r.pagado || 0) + p.monto; if (r.estado === 'pendiente') r.estado = 'confirmada'; } CC.log('caja', 'Confirmó efectivo ' + p.concepto); CC.save(); toast('Cobro confirmado; el QR del cliente ya está activo'); render(); });
    $('#btnCorte').onclick = () => { const ef = (c.porMetodo.find(m => m.metodo === 'efectivo') || { monto: 0 }).monto; const contado = Number($('#cashCount').value); CC.db.cortes.unshift({ id: CC.uid('ct'), suc: suc === 'all' ? 's1' : suc, fecha: CC.hoy(), hora: CC.ahoraHM(), total: c.total, efectivo: contado, diferencia: contado - ef, propinas, responsable: rol }); CC.log('caja', 'Corte de turno ' + money(c.total)); CC.save(); toast('Corte guardado'); render(); };
  }

  // ═════════════ CLIENTES ═════════════
  function vClientes() {
    const q = (sel.q || '').toLowerCase(); const mesN = new Date().getMonth() + 1;
    let lista = CC.db.clientes.filter(c => !q || c.nombre.toLowerCase().includes(q) || c.tel.includes(q));
    if (sel.seg === 'vip') lista = lista.filter(c => c.nivel === 'vip'); if (sel.seg === 'cumple') lista = lista.filter(c => Number(c.cumple.split('-')[0]) === mesN); if (sel.seg === 'frecuente') lista = lista.filter(c => c.nivel === 'frecuente');
    lista = lista.slice().sort((a, b) => b.gasto - a.gasto);
    const c = sel.clienteId ? CC.cliente(sel.clienteId) : null;
    const ficha = c ? (() => { const res = CC.db.reservas.filter(r => r.clienteId === c.id); const acc = CC.db.accesos.filter(a => a.nombre === c.nombre); const pag = CC.db.pagos.filter(p => p.clienteId === c.id); return `<div class="card"><div class="row"><div><b style="font-size:17px;">${esc(c.nombre)}</b><div class="small muted">${esc(c.tel.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3'))} · ${esc(c.email)}</div></div>${c.nivel === 'vip' ? tipoBadge('clientevip') : `<span class="pill">${c.nivel}</span>`}</div>
        <div class="kgrid" style="grid-template-columns: repeat(4,1fr); margin-top:10px;"><div class="k mini"><small>Visitas</small><b>${c.visitas}</b></div><div class="k mini"><small>Gasto</small><b style="font-size:18px;">${money(c.gasto)}</b></div><div class="k mini"><small>Puntos</small><b>${c.puntos}</b></div><div class="k mini"><small>Cumple</small><b style="font-size:18px;">${c.cumple.split('-')[1]} ${CC.MESES[Number(c.cumple.split('-')[0]) - 1]}</b></div></div>
        <label class="lbl">Notas para hostess y barra</label><textarea class="txt" id="cNotas" rows="2">${esc(c.notas || '')}</textarea>
        <div class="small" style="margin-top:10px;"><b>Amigos en la app</b>: ${c.amigos.map(id => esc(CC.cliente(id).nombre.split(' ')[0])).join(', ') || '—'}</div>
        <div class="small" style="margin-top:8px;"><b>Esta noche</b>: ${res.filter(r => r.fecha === CC.hoy()).map(r => `${CC.TIPOS_QR[r.tipo].nombre}${r.mesaId ? ' mesa ' + CC.mesa(r.mesaId).num : ''} · ${r.estado}`).join(', ') || 'sin reserva'}</div>
        <div class="small muted" style="margin-top:8px;">${acc.length} accesos registrados · ${pag.length} pagos · ${money(pag.reduce((a, p) => a + p.monto, 0))} en este periodo</div>
        <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;"><button class="btn sec sm" id="cGuardar">Guardar notas</button><button class="btn sec sm" id="cVip">${c.nivel === 'vip' ? 'Quitar VIP' : 'Hacer VIP'}</button><button class="btn sm" id="cPromo">Enviar promo por WhatsApp</button></div></div>`; })() : `<div class="card"><h3>Ficha del cliente</h3><div class="small muted">Selecciona un cliente para ver su historia, sus notas y su grupo.</div></div>`;
    const html = `<div class="grid g32" style="margin-top:0;"><div class="card"><div class="buscador"><input class="txt" id="cq" type="search" placeholder="Buscar por nombre o teléfono" aria-label="Buscar cliente" value="${esc(sel.q || '')}"><div class="chips">${[['', 'Todos'], ['vip', 'VIP'], ['frecuente', 'Frecuentes'], ['cumple', 'Cumplen este mes']].map(([id, l]) => `<button data-seg="${id}" style="${sel.seg === id ? 'background:var(--terra); color:var(--paper);' : ''}">${l}</button>`).join('')}</div></div>
      <table style="margin-top:10px;"><thead><tr><th>Cliente</th><th>Nivel</th><th class="num">Visitas</th><th class="num">Gasto</th><th class="num">Puntos</th><th>Cumple</th></tr></thead><tbody>${lista.slice(0, 18).map(x => `<tr data-cli="${x.id}" style="cursor:pointer; ${sel.clienteId === x.id ? 'background:#241819;' : ''}"><td><b>${esc(x.nombre)}</b></td><td>${x.nivel === 'vip' ? tipoBadge('clientevip') : `<span class="pill">${x.nivel}</span>`}</td><td class="num">${x.visitas}</td><td class="num">${money(x.gasto)}</td><td class="num">${x.puntos}</td><td class="small">${x.cumple.split('-')[1]} ${CC.MESES[Number(x.cumple.split('-')[0]) - 1]}</td></tr>`).join('')}</tbody></table></div><div>${ficha}<div class="card" style="margin-top:12px;"><h3>Campañas</h3><div class="small muted">Segmenta y manda por WhatsApp: cumpleaños del mes, VIP que no han venido, reactivación a 60 días. Cada campaña queda ligada a las visitas que genera.</div><button class="btn sec sm" style="margin-top:8px;" id="cCamp">Campaña de cumpleaños del mes</button></div></div></div>`;
    shell(html, 'Clientes', 'Cada cliente con historia · CRM de la casa');
    $('#cq').oninput = (e) => { sel.q = e.target.value; render(); setTimeout(() => { const i = $('#cq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); };
    $$('[data-seg]').forEach(b => b.onclick = () => { sel.seg = b.dataset.seg; render(); });
    $$('[data-cli]').forEach(tr => tr.onclick = () => { sel.clienteId = tr.dataset.cli; render(); });
    const g = $('#cGuardar'); if (g) g.onclick = () => { c.notas = $('#cNotas').value; CC.save(); toast('Notas guardadas'); };
    const v = $('#cVip'); if (v) v.onclick = () => { c.nivel = c.nivel === 'vip' ? 'frecuente' : 'vip'; CC.save(); render(); };
    const p = $('#cPromo'); if (p) p.onclick = () => toast('Promo enviada por WhatsApp (simulado)');
    $('#cCamp').onclick = () => toast(`Campaña programada para ${CC.db.clientes.filter(x => Number(x.cumple.split('-')[0]) === mesN).length} clientes que cumplen este mes`);
  }

  // ═════════════ PERSONAL ═════════════
  function vPersonal() {
    const emp = CC.db.personal.filter(e => (suc === 'all' || e.suc === suc) && e.rol !== 'socio');
    const ventasMesero = {}; CC.db.pedidos.filter(p => p.meseroId).forEach(p => { ventasMesero[p.meseroId] = (ventasMesero[p.meseroId] || 0) + p.items.reduce((a, i) => a + i.precio * i.cant, 0); });
    const html = `<div class="kgrid">${kpi({ icon: 'team', label: 'Personal activo', value: emp.length, sub: suc === 'all' ? 'ambas sucursales' : esc(S().nombre) })}${kpi({ icon: 'check', label: 'En turno ahora', value: emp.filter(e => e.checkin).length, cls: 'good', sub: 'check-in registrado' })}${kpi({ icon: 'clock', label: 'Sin check-in', value: emp.filter(e => !e.checkin && e.turno.startsWith('Noche')).length, cls: 'amber', sub: 'del turno de noche' })}${kpi({ icon: 'money', label: 'Propinas hoy', value: money(CC.db.pagos.filter(p => p.fecha === CC.hoy() && (suc === 'all' || p.suc === suc)).reduce((a, p) => a + (p.propina || 0), 0)), sub: 'se reparten por regla' })}</div>
      <div class="card" style="margin-top:12px;"><h3>Equipo</h3><table><thead><tr><th>Nombre</th><th>Rol</th><th>Sucursal</th><th>Turno</th><th>Check-in</th><th class="num">Ventas hoy</th><th></th></tr></thead><tbody>${emp.map(e => `<tr><td><b>${esc(e.nombre)}</b><br><span class="small muted">desde ${e.ingreso} · ${esc(e.tel.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3'))}</span></td><td>${esc(CC.ROLES[e.rol] || e.rol)}</td><td>${esc(CC.suc(e.suc).nombre)}</td><td class="small">${esc(e.turno)}</td><td>${e.checkin ? `<span class="pill ok">${esc(e.checkin)}</span>` : '<span class="pill warn">sin registrar</span>'}</td><td class="num">${e.rol === 'mesero' ? money(ventasMesero[e.id] || 0) : '—'}</td><td>${e.checkin ? '' : `<button class="btn sec sm" data-ci="${e.id}">Check-in</button>`}</td></tr>`).join('')}</tbody></table></div>`;
    shell(html, 'Personal', 'Quién está en piso, quién vendió qué, propinas y asistencia');
    $$('[data-ci]').forEach(b => b.onclick = () => { CC.emp(b.dataset.ci).checkin = CC.ahoraHM(); CC.save(); render(); });
  }

  // ═════════════ ASISTENTE ═════════════
  const chatHist = [];
  function vAsistente() {
    const sugeridas = ['¿Qué sucursal vendió más esta noche?', '¿Cómo va la merma?', '¿Cuál es el mejor día?', '¿A qué hora vendemos más?', '¿Qué temporada es la mejor?', '¿Cómo van los clientes VIP?', '¿Qué es lo más vendido?', '¿Qué hay pendiente en caja?'];
    const html = `<div class="grid g23" style="margin-top:0;"><div class="card"><h3>Asistente de socios <span>· responde con los números del sistema</span></h3><div class="chat" id="chat">${chatHist.length ? chatHist.map(m => `<div class="cb ${m.me ? 'me' : 'ai'}">${esc(m.t)}</div>`).join('') : '<div class="cb ai">Pregúntame por ventas, merma, mejor día u hora, temporada, VIP, productos o caja. Los números salen de la base; en el demo la redacción es por reglas y en la fase real la hace Claude o GPT.</div>'}</div>
      <div class="row" style="margin-top:10px;"><input class="txt" id="q" placeholder="Escribe tu pregunta…"><button class="btn" id="ask">Preguntar</button></div><div class="chips" style="margin-top:8px;">${sugeridas.map(s => `<button data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
      <div><div class="card cream"><h3 style="color:var(--terra);">Qué hace en la fase real</h3><div class="small" style="line-height:1.55;"><b>Responde</b> con el número exacto y su fuente.<br><b>Analiza</b> por sucursal, día, hora, producto y persona.<br><b>Critica</b> lo que no cuadra: cortesías, precios, no-shows.<br><b>Encuentra</b> merma, cortes descuadrados, VIP que dejaron de venir.<br><b>Resuelve</b>: prepara el mensaje o la alerta y da seguimiento.</div></div><div class="card" style="margin-top:12px;"><h3>Reglas</h3><div class="small muted" style="line-height:1.55;">Los números los saca el sistema; la IA los explica y nunca inventa. Cada rol pregunta solo sobre lo suyo. Llaves en el servidor, bitácora y tope de gasto.</div></div></div></div>`;
    shell(html, 'Asistente de IA', 'Cualquier número que necesiten, al momento');
    const ask = () => { const q = $('#q').value.trim(); if (!q) return; chatHist.push({ me: true, t: q }); chatHist.push({ me: false, t: CC.asistente(q) }); render(); setTimeout(() => { const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight; }, 0); };
    $('#ask').onclick = ask; $('#q').onkeydown = (e) => { if (e.key === 'Enter') ask(); };
    $$('[data-q]').forEach(b => b.onclick = () => { $('#q').value = b.dataset.q; ask(); });
    const c = $('#chat'); c.scrollTop = c.scrollHeight;
  }

  // ═════════════ CONFIG ═════════════
  function vConfig() {
    const sucId = sucActiva(); const mesas = CC.db.mesas.filter(m => m.suc === sucId);
    const html = `<div class="grid g32 apila" style="margin-top:0;"><div class="card"><h3>Mesas de ${esc(CC.suc(sucId).nombre)} <span>· capacidad, tipo, mínimo y anticipo</span></h3><table><thead><tr><th>Mesa</th><th>Piso</th><th>Tipo</th><th class="num">Cap.</th><th class="num">Mínimo</th><th class="num">Anticipo</th></tr></thead><tbody>${mesas.map(m => `<tr><td><b>${m.num}</b>${m.salon ? ' · ' + esc(m.salon) : ''}</td><td>${m.piso}</td><td><select class="txt" data-t="${m.id}" style="padding:4px 8px; width:auto;">${['mesa', 'vip'].map(t => `<option value="${t}" ${m.tipo === t ? 'selected' : ''}>${CC.TIPOS_QR[t].nombre}</option>`).join('')}</select></td><td><input class="txt" data-cap="${m.id}" type="number" value="${m.cap}" style="width:64px; text-align:right; padding:4px 8px;"></td><td><input class="txt" data-min="${m.id}" type="number" value="${m.minimo}" style="width:96px; text-align:right; padding:4px 8px;"></td><td><input class="txt" data-ant="${m.id}" type="number" value="${m.anticipo}" style="width:96px; text-align:right; padding:4px 8px;"></td></tr>`).join('')}</tbody></table><button class="btn" id="cfgGuardar" style="margin-top:12px;">Guardar cambios</button></div>
      <div><div class="card"><h3>Tipos de QR</h3>${Object.entries(CC.TIPOS_QR).map(([k, t]) => `<div class="row small" style="padding:6px 0; border-bottom:1px solid var(--darkline);"><span>${tipoBadge(k)}</span><span class="muted">${esc(t.desc)}</span></div>`).join('')}</div>
        <div class="card" style="margin-top:12px;"><h3>Precios y visibilidad</h3><label class="lbl">Cover</label><input class="txt" id="pCover" type="number" value="${CC.PRECIOS().cover}"><label class="lbl">Acceso barra</label><input class="txt" id="pBarra" type="number" value="${CC.PRECIOS().barra}"><label class="lbl">El cliente ve el cupo de la noche</label><select class="txt" id="pCupo"><option value="1" ${CC.db.config.cupoVisible ? 'selected' : ''}>Sí, muestra el porcentaje</option><option value="0" ${!CC.db.config.cupoVisible ? 'selected' : ''}>No</option></select><button class="btn sec" id="cfgPrecios" style="margin-top:10px; width:100%;">Guardar</button></div>
        <div class="card" style="margin-top:12px;"><h3>Demo</h3><div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="btn sec sm" id="btnExport">Exportar datos (JSON)</button><button class="btn bad sm" id="btnReset">Reiniciar datos del demo</button></div></div></div></div>`;
    shell(html, 'Configuración', 'Planos, tipos de QR, precios y reglas');
    $('#cfgGuardar').onclick = () => { mesas.forEach(m => { m.tipo = $(`[data-t="${m.id}"]`).value; m.cap = Number($(`[data-cap="${m.id}"]`).value); m.minimo = Number($(`[data-min="${m.id}"]`).value); m.anticipo = Number($(`[data-ant="${m.id}"]`).value); }); CC.save(); toast('Mesas actualizadas en ambas apps'); };
    $('#cfgPrecios').onclick = () => { CC.db.config.precios.cover = Number($('#pCover').value); CC.db.config.precios.barra = Number($('#pBarra').value); CC.db.config.cupoVisible = $('#pCupo').value === '1'; CC.save(); toast('Guardado'); };
    $('#btnExport').onclick = () => { const a = document.createElement('a'); a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(CC.db, null, 1)); a.download = 'canta-corazon-demo.json'; a.click(); };
    $('#btnReset').onclick = () => { if (confirm('¿Reiniciar todos los datos del demo en este navegador?')) { CC.reset(); toast('Datos reiniciados'); render(); } };
  }

  // ═════════════ MÁS (hub) ═════════════
  function vMas() {
    const tiles = SECCIONES.filter(x => x.grupo === 'mas' && x.id !== 'mas' && permitido(x.id));
    const desc = { personal: 'Quién está en piso, ventas por mesero, propinas y asistencia.', asistente: 'Pregunta por ventas, merma, mejor día u hora; responde con los números del sistema.', config: 'Mesas, tipos de QR, precios y reglas de la casa.' };
    const html = `<div class="tiles">${tiles.map(x => `<button class="tile" data-go="${x.id}"><span class="ic">${I(x.icon)}</span><b>${x.label}</b><span class="small muted">${desc[x.id] || ''}</span></button>`).join('')}
      <a class="tile" href="../cliente/" target="_blank" rel="noopener"><span class="ic">${I('phone')}</span><b>App del cliente</b><span class="small muted">La app con la que el cliente reserva, paga, entra y pide. Comparte los datos de este demo.</span></a>
      <button class="tile" id="btnRol"><span class="ic">${I('user')}</span><b>Cambiar rol</b><span class="small muted">Entraste como ${esc(CC.ROLES[rol])}. Cambia para ver lo que ve cada puesto.</span></button>
      <button class="tile" id="btnResetMas"><span class="ic">${I('reset')}</span><b>Reiniciar demo</b><span class="small muted">Regresa los datos ilustrativos a como estaban al principio.</span></button></div>
      <div class="card" style="margin-top:12px;"><h3>Sobre este demo</h3><div class="small muted" style="line-height:1.55;">Sistema integral para Canta Corazón: Polanco y Pedregal en una sola base. Los datos son ilustrativos y viven en este navegador; los pagos, WhatsApp y facturas están simulados.<br><br><b style="color:var(--darktext)">Sin internet:</b> al abrirlo una vez con internet, el demo completo queda guardado en el equipo. Si se cae la red, todo sigue funcionando y lo que se haga se guarda aquí; al volver la red se sube solo. En el demo la subida se simula; en la fase real va a la base de Canta Corazón y llega a las demás tabletas.</div></div>`;
    shell(html, 'Más', 'Personal, asistente de IA, configuración y ajustes del demo');
    $('#btnRol').onclick = () => { stopScan(); rol = null; sessionStorage.removeItem('cc_rol'); render(); };
    $('#btnResetMas').onclick = () => { if (confirm('¿Reiniciar todos los datos del demo en este navegador?')) { CC.reset(); toast('Datos reiniciados'); render(); } };
  }

  // ═════════════ render ═════════════
  function render() {
    pendCharts = {};
    if (!rol) { vLogin(); return; }
    view = ALIAS[view] || view;
    if (!permitido(view)) view = home();
    (VISTAS[view] || vTablero)();
  }
  const VISTAS = { tablero: vTablero, mesas: vMesas, pedidos: vPedidos, inventario: vInventario, compras: vCompras, caja: vCaja, clientes: vClientes, personal: vPersonal, asistente: vAsistente, config: vConfig, mas: vMas };
  window.addEventListener('hashchange', () => { const v = ALIAS[location.hash.replace('#', '')] || location.hash.replace('#', ''); if (v && v !== view) { stopScan(); hist.push(view); view = v; render(); } });
  CC.on(() => { if ($('#sheetBg')) return; if (window.PT && PT.activo()) return; if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return; const y = window.scrollY; render(); window.scrollTo(0, y); });
  window.CI = { $, $$, esc, money, pct, I, sheet, closeSheet, toast, shell, kpi, tipoBadge, go, render, sucActiva, rol: () => rol, suc: () => suc, registrar: (id, fn) => { VISTAS[id] = fn; } };
  // arranca cuando puerta.js y promos.js ya se registraron
  window.addEventListener('DOMContentLoaded', () => { if (window.CCSync) CCSync.on(pintarRed); render(); });
})();
