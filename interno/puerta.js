/* Canta Corazón · Sistema interno · Puerta: escáner de QR (cámara real), simulación para el demo y resultado a
   pantalla completa con la información correcta de ese cliente, su reserva y su mesa.
   Cada persona del grupo trae su propio QR: el primero que entra sienta la mesa; los demás entran como parte del grupo.
   El QR va firmado: si alguien lo altera o lo inventa, la puerta lo rechaza. */
(function () {
  'use strict';
  const { $, $$, esc, money, pct, I, sheet, closeSheet, toast, shell, tipoBadge } = CI;
  let stream = null, raf = null, ultimo = '', audio = null;

  function parar() { if (raf) cancelAnimationFrame(raf); raf = null; if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }
  const nombreCorto = (id) => ((CC.cliente(id) || {}).nombre || '').split(' ')[0];

  CI.registrar('puerta', function () {
    const sucId = CI.sucActiva(); const n = CC.M.noche(sucId); const s = CC.suc(sucId);
    const acc = CC.db.accesos.filter(a => a.suc === sucId && a.fecha === CC.hoy()).slice(-12).reverse();
    const hoy = CC.db.reservas.filter(r => r.suc === sucId && r.fecha === CC.hoy());
    const porLlegar = hoy.filter(r => r.estado === 'confirmada' || r.estado === 'pendiente').sort((a, b) => (a.clienteId === 'c1' ? -1 : 0) - (b.clienteId === 'c1' ? -1 : 0) || (a.hora < b.hora ? -1 : 1));
    // integrantes del grupo que aún no entran (cada quien con su QR)
    const invitados = hoy.filter(r => r.estado === 'sentada' && r.grupo && r.grupo.length).flatMap(r => r.grupo.filter(g => g.clienteId !== r.clienteId && !(r.entradas || {})[g.clienteId]).map(g => ({ r, id: g.clienteId })));
    const fila = (r, portador, etiqueta) => `<div class="sim"><span class="small">${tipoBadge(r.tipo)} <b>${esc(portador ? CC.cliente(portador).nombre : r.nombre)}</b><span class="muted"> · ${etiqueta}</span></span><button class="btn sec sm" data-sim="${r.id}" data-por="${portador || ''}">${I('qr')}Escanear</button></div>`;
    const html = `<div class="grid g23" style="margin-top:0;">
      <div>
        <div class="scanwrap" id="scanwrap"><video id="video" playsinline muted></video><div class="frame"></div>
          <div class="scan-off" id="scanOff"><span class="ic">${I('camera')}</span><button class="btn" id="btnCam">Encender cámara</button><span class="small muted">Apunta al QR del cliente: se lee solo.</span></div>
          <div class="hint" id="scanHint" hidden>Leyendo…</div></div>
        <div class="row wrap" style="margin-top:10px;"><button class="btn sec" id="btnParar" hidden>Apagar cámara</button><button class="btn sec" id="btnManual">Pegar código</button><button class="btn sec" id="btnFalso">Probar un QR falso</button></div>
        <div class="card" style="margin-top:12px;"><h3>Simular escaneo <span>· sin segundo teléfono</span></h3>
          <div class="small muted" style="margin-bottom:6px;">Por llegar a ${esc(s.nombre)}:</div>
          ${porLlegar.slice(0, 6).map(r => fila(r, r.clienteId, (r.mesaId ? 'mesa ' + CC.mesa(r.mesaId).num + ' · ' : '') + r.personas + ' personas · ' + r.hora)).join('') || '<div class="muted small">Todas las reservas ya entraron.</div>'}
          ${invitados.length ? `<div class="small muted" style="margin:12px 0 6px;">Invitados de grupo que aún no entran (cada quien con su QR):</div>${invitados.slice(0, 5).map(x => fila(x.r, x.id, 'mesa ' + CC.mesa(x.r.mesaId).num + ' de ' + nombreCorto(x.r.clienteId))).join('')}` : ''}
        </div>
      </div>
      <div>
        <div class="card"><div class="row"><h3 style="margin:0;">Aforo en vivo</h3><b class="num">${n.personas.toLocaleString('es-MX')} / ${s.aforo}</b></div><div class="bar" style="margin-top:10px;"><i style="width:${Math.min(100, n.ocupPct)}%"></i></div><div class="small muted" style="margin-top:8px;">${pct(n.ocupPct, 0)} del aforo · ${n.sentadas} mesas sentadas · ${n.confirmadas} por llegar</div></div>
        <div class="card" style="margin-top:12px;"><h3>Últimos accesos</h3><table><thead><tr><th>Hora</th><th>Tipo</th><th>Nombre</th><th class="num">Pers.</th><th>Resultado</th></tr></thead><tbody>${acc.map(a => `<tr><td class="num">${esc(a.hora)}</td><td>${tipoBadge(a.tipo)}</td><td>${esc(a.nombre)}</td><td class="num">${a.personas || 1}</td><td><span class="pill ${a.resultado === 'ok' ? 'ok' : 'bad'}">${a.resultado === 'ok' ? 'Entró' : a.resultado === 'invalido' ? 'QR falso' : a.resultado === 'usado' ? 'QR ya usado' : 'Rechazado'}</span></td></tr>`).join('')}</tbody></table></div>
      </div></div>`;
    shell(html, 'Puerta · escáner QR', 'Cada QR dice quién es, qué trae, a qué mesa va y si ya pagó');
    $('#btnCam').onclick = encender; $('#btnParar').onclick = () => { parar(); CI.render(); };
    $('#btnManual').onclick = () => { const t = prompt('Pega el código del QR (empieza con CC1.)'); if (t) procesar(t.trim()); };
    $('#btnFalso').onclick = () => procesar('CC1.eyJ2IjoxLCJpZCI6InJfZmFsc28iLCJuIjoiSW52aXRhZG8gZmFsc28ifQ.0000000000000000');
    $$('[data-sim]').forEach(b => b.onclick = async () => { const r = CC.db.reservas.find(x => x.id === b.dataset.sim); procesar(await CC.tokenQR(r, b.dataset.por || null)); });
  });

  async function encender() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } } });
      const v = $('#video'); v.srcObject = stream; await v.play();
      $('#scanOff').hidden = true; $('#scanHint').hidden = false; $('#btnParar').hidden = false;
      const c = document.createElement('canvas'); const ctx = c.getContext('2d', { willReadFrequently: true });
      const leer = () => {
        if (!stream) return;
        if (v.readyState === v.HAVE_ENOUGH_DATA) {
          const k = Math.min(1, 720 / v.videoWidth); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
          ctx.drawImage(v, 0, 0, c.width, c.height); const img = ctx.getImageData(0, 0, c.width, c.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (code && code.data && code.data !== ultimo && !$('#sheetBg')) { ultimo = code.data; procesar(code.data); setTimeout(() => ultimo = '', 5000); }
        }
        raf = requestAnimationFrame(leer);
      };
      leer();
    } catch (e) { toast('No se pudo abrir la cámara: usa «Simular escaneo» o «Pegar código»'); }
  }

  function sonido(ok) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const tonos = ok ? [[880, 0, .12]] : [[260, 0, .14], [220, .18, .16]];
      tonos.forEach(([f, t, d]) => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = f; o.type = 'sine'; g.gain.setValueAtTime(.0001, audio.currentTime + t); g.gain.exponentialRampToValueAtTime(.25, audio.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + t + d); o.connect(g).connect(audio.destination); o.start(audio.currentTime + t); o.stop(audio.currentTime + t + d + .05); });
    } catch (e) { }
    if (navigator.vibrate) navigator.vibrate(ok ? 60 : [80, 60, 80]);
  }

  // lee el QR y arma el resultado: puede pasar · pasa con pendiente · no pasa
  async function procesar(txt) {
    const v = await CC.verificarQR(txt); const sucPuerta = CI.sucActiva();
    if (!v.ok) { sonido(false); CC.registrarAcceso({ suc: sucPuerta, tipo: 'cover', nombre: 'QR no válido', personas: 0, resultado: 'invalido' }); mostrar({ nivel: 'no', titulo: 'No pasa', big: 'QR no válido', motivo: v.motivo + '. No es un QR emitido por Canta Corazón.' }); return; }
    const p = v.payload; const r = CC.db.reservas.find(x => x.id === p.id);
    const portador = p.c || (r && r.clienteId) || null; const cli = portador ? CC.cliente(portador) : null;
    const nombre = p.h || (cli ? cli.nombre : p.n);
    const mesa = r && r.mesaId ? CC.mesa(r.mesaId) : (p.m ? CC.db.mesas.find(x => x.suc === p.s && x.num === p.m) : null);
    const parte = r && r.grupo ? r.grupo.find(g => g.clienteId === portador) : null;
    const clave = portador || 'titular';
    const entradas = r ? (r.entradas || {}) : {};
    const yaEntro = entradas[clave] || (!r && CC.db.accesos.some(a => a.reservaId === p.id && a.portador === clave && a.resultado === 'ok') ? '—' : null);
    let pendiente = parte ? Math.max(0, parte.parte - parte.pagado) : r ? (r.estado === 'pendiente' ? Math.max(0, (r.anticipo || 0) - (r.pagado || 0)) : 0) : (p.pg ? 0 : null);
    // pagó en su propio teléfono: el QR firmado ya trae el pago aunque esta tableta todavía no lo sepa
    const pagoEnQR = p.pg === 1 && pendiente > 0; if (pagoEnQR) pendiente = 0;
    const ctx = { p, r, cli, portador, clave, nombre, mesa, parte, pendiente, pagoEnQR };
    let nivel = 'ok', titulo = 'Puede pasar', motivo = '';
    if (p.f !== CC.hoy()) { nivel = 'no'; titulo = 'No pasa'; motivo = 'Este QR es para el ' + CC.fechaLarga(p.f) + ', no para hoy.'; }
    else if (p.s !== sucPuerta) { nivel = 'no'; titulo = 'No pasa'; motivo = 'Este QR es de ' + CC.suc(p.s).nombre + '. Esta puerta es de ' + CC.suc(sucPuerta).nombre + '.'; }
    else if (r && r.estado === 'liberada') { nivel = 'no'; titulo = 'No pasa'; motivo = 'La reserva se canceló.'; }
    else if (yaEntro) { nivel = 'no'; titulo = 'QR ya usado'; motivo = nombre.split(' ')[0] + ' ya entró' + (yaEntro !== '—' ? ' a las ' + yaEntro : '') + '. Cada QR sirve una sola vez.'; }
    else if (pendiente) { nivel = 'aviso'; titulo = 'Pasa con pendiente'; motivo = (parte ? 'Su parte de la mesa' : 'El anticipo') + ' está pendiente: ' + money(pendiente) + '.'; }
    else if (pendiente === null) { nivel = 'aviso'; titulo = 'Revisar pago'; motivo = 'El QR no trae el pago confirmado.'; }
    if (nivel === 'no' && yaEntro) CC.registrarAcceso({ suc: sucPuerta, reservaId: p.id, tipo: p.t, nombre, personas: 0, resultado: 'usado', portador: clave });
    sonido(nivel !== 'no');
    const primero = !r || r.estado !== 'sentada';
    const grupoTxt = r && r.grupo && r.grupo.length ? r.grupo.map(g => `<span class="pill ${(r.entradas || {})[g.clienteId] ? 'ok' : g.pagado >= g.parte ? '' : 'warn'}">${esc(nombreCorto(g.clienteId))}${(r.entradas || {})[g.clienteId] ? ' · dentro' : g.pagado < g.parte ? ' · debe ' + money(g.parte - g.pagado) : ''}</span>`).join(' ') : '';
    mostrar({
      nivel, titulo, motivo,
      big: mesa ? 'Mesa ' + mesa.num + ' · Piso ' + mesa.piso : (CC.TIPOS_QR[p.t] || CC.TIPOS_QR.cover).nombre,
      detalle: `${tipoBadge(p.t)} ${cli && cli.nivel === 'vip' ? tipoBadge('clientevip') : ''}
        <div class="quien"><span class="av">${CC.iniciales(nombre)}</span><div><b>${esc(nombre)}</b><span>${cli ? `${cli.visitas} visitas · ${money(cli.gasto)} histórico` : 'Cliente sin registro'}${p.h ? ' · invitado de ' + esc(p.n.split(' ')[0]) : ''}</span></div></div>
        <div class="r"><span>Reserva</span><span>${esc(p.n)} · ${p.q} personas · ${esc((r && r.hora) || '')} · ${esc(CC.suc(p.s).nombre)}</span></div>
        ${mesa && r && r.estado === 'sentada' ? `<div class="r"><span>Mesa</span><span>Ya está sentada: pasa directo a la ${mesa.num}</span></div>` : ''}
        <div class="r"><span>Pago</span><span>${pendiente ? `<span class="pill warn">Pendiente ${money(pendiente)}</span>` : pendiente === 0 ? `<span class="pill ok">Pagado${parte ? ' · su parte ' + money(parte.parte) : r && r.anticipo ? ' · ' + money(r.anticipo) : ''}</span>` : '<span class="pill warn">Sin confirmar</span>'}</span></div>
        ${grupoTxt ? `<div class="r"><span>Grupo</span><span class="grp">${grupoTxt}</span></div>` : ''}
        ${r && r.preorden && r.preorden.length ? `<div class="r"><span>Preorden</span><span>${r.preorden.map(x => x.cant + ' × ' + esc(CC.prod(x.prodId).nombre)).join(', ')} · servir al sentar</span></div>` : ''}
        ${r && r.motivo ? `<div class="r"><span>Motivo</span><span>${esc(r.motivo)}${r.notas ? ' · ' + esc(r.notas) : ''}</span></div>` : ''}
        ${cli && cli.notas ? `<div class="r nota"><span>Nota</span><span>${esc(cli.notas)}</span></div>` : ''}
        <div class="r"><span>Firma</span><span class="pill ok">Válida · QR original</span></div>`,
      botones: nivel === 'no' ? `<button class="btn sec" id="pCerrar">Cerrar</button>` : `${pendiente ? `<button class="btn gold" id="pCobrar">Cobrar ${money(pendiente)} y dejar pasar</button>` : `<button class="btn ok" id="pEntrar">${primero && mesa ? 'Registrar entrada y sentar mesa ' + mesa.num : 'Registrar entrada'}</button>`}<button class="btn sec" id="pRech">No dejar pasar</button>`,
      ctx
    });
  }

  function mostrar(o) {
    const ico = { ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', aviso: '<path d="M12 7v6M12 17h.01"/>', no: '<path d="M7 7l10 10M17 7L7 17"/>' }[o.nivel];
    sheet(`<div class="pase-puerta ${o.nivel}"><div class="pp-h"><span class="pp-ic"><svg viewBox="0 0 24 24">${ico}</svg></span><div><b>${esc(o.titulo)}</b>${o.motivo ? `<span>${esc(o.motivo)}</span>` : ''}</div></div>
      <div class="pp-b"><div class="big">${esc(o.big || '')}</div>${o.detalle || ''}<div class="pp-acc">${o.botones || '<button class="btn sec" id="pCerrar">Cerrar</button>'}</div></div></div>`);
    const c = $('#pCerrar'); if (c) c.onclick = cerrar;
    const e = $('#pEntrar'); if (e) e.onclick = () => entrar(o.ctx, false);
    const cb = $('#pCobrar'); if (cb) cb.onclick = () => entrar(o.ctx, true);
    const rj = $('#pRech'); if (rj) rj.onclick = () => { const x = o.ctx; CC.registrarAcceso({ suc: x.p.s, reservaId: x.p.id, tipo: x.p.t, nombre: x.nombre, personas: 0, resultado: 'rechazado', portador: x.clave }); cerrar(); toast('No se le dejó pasar · queda en la bitácora'); };
  }
  function cerrar() { closeSheet(); CI.render(); }

  function entrar(x, cobrar) {
    const { p, r, cli, clave, nombre, mesa, parte } = x; const hora = CC.ahoraHM();
    if (cobrar && x.pendiente) {
      CC.registrarPago({ suc: p.s, clienteId: x.portador, reservaId: p.id, concepto: (parte ? 'Parte de mesa ' + (mesa ? mesa.num : '') : 'Anticipo') + ' · cobrado en puerta', monto: x.pendiente, metodo: 'tarjeta', estado: 'aprobado' });
      if (parte) parte.pagado = parte.parte; else if (r) { r.pagado = r.anticipo; if (r.estado === 'pendiente') r.estado = 'confirmada'; }
      if (r && r.grupo && r.grupo.length && r.grupo.every(g => g.pagado >= g.parte)) r.pagado = r.anticipo;
    }
    if (x.pagoEnQR) { if (parte) parte.pagado = parte.parte; else if (r) { r.pagado = r.anticipo; if (r.estado === 'pendiente') r.estado = 'confirmada'; } }
    let personas = 1, sento = false; let res = r;
    if (!res) { // reserva hecha en otro teléfono: el QR trae los datos para registrarla aquí
      res = { id: p.id, suc: p.s, fecha: p.f, hora, tipo: p.t, mesaId: mesa ? mesa.id : null, clienteId: x.portador, nombre: p.n, personas: p.q, estado: 'confirmada', anticipo: mesa ? mesa.anticipo : 0, pagado: p.pg ? (mesa ? mesa.anticipo : 0) : 0, metodo: 'app', origen: 'qr', grupo: [], preorden: [] };
      CC.db.reservas.push(res);
    }
    res.entradas = res.entradas || {};
    if (res.estado !== 'sentada') { const conApp = (res.grupo || []).filter(g => g.clienteId !== res.clienteId).length; personas = Math.max(1, res.personas - conApp); res.estado = 'sentada'; res.entrada = hora; sento = !!mesa; }
    res.entradas[clave] = hora;
    CC.registrarAcceso({ suc: p.s, reservaId: p.id, tipo: p.t, nombre, personas, resultado: 'ok', portador: clave });
    if (cli) cli.visitas += 1;
    CC.log('puerta', 'Entró ' + nombre + (mesa ? ' · mesa ' + mesa.num + (sento ? ' sentada' : '') : ''));
    CC.save(); closeSheet(); CI.render();
    toast(sento ? `Entró ${nombre.split(' ')[0]} · mesa ${mesa.num} sentada${res.preorden && res.preorden.length ? ' · preorden a la barra' : ''}` : `Entró ${nombre.split(' ')[0]}${mesa ? ' · a la mesa ' + mesa.num : ''}`);
  }

  window.PT = { parar, activo: () => !!stream, procesar };
})();
