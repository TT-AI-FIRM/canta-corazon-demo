/* Canta Corazón · App del cliente · Promociones estilo Instagram.
   Solo publica la casa (desde el sistema interno). Los clientes ven las publicaciones, dan me gusta
   (también con doble toque), comentan, las guardan y se las mandan entre amigos dentro de la app. */
(function () {
  'use strict';
  const { $, $$, esc, toast, sheet, closeSheet, cab, go } = CL;
  const SVG = (d, extra = '') => `<svg viewBox="0 0 24 24" ${extra}>${d}</svg>`;
  const IC = {
    corazon: SVG('<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/>'),
    comentar: SVG('<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.6-4.2A8.5 8.5 0 1 1 20.5 11.5z"/>'),
    enviar: SVG('<path d="M21.5 3.5L10 14M21.5 3.5l-7 17-4.5-6.5L3.5 10.5z"/>'),
    guardar: SVG('<path d="M6 3.5h12v17l-6-4.5-6 4.5z"/>'),
    mas: SVG('<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>'),
    ir: SVG('<path d="M9 5l7 7-7 7"/>'),
    x: SVG('<path d="M6 6l12 12M18 6L6 18"/>'),
    verif: '<svg class="verif" viewBox="0 0 24 24" aria-label="Cuenta oficial"><path fill="#3F8CFF" d="M12 1.8l2.4 1.9 3-.3 1 2.9 2.7 1.4-.4 3 1.6 2.6-2 2.3.2 3-2.9.9-1.2 2.8-3-.4L12 22.2l-2.4-1.8-3 .4-1.2-2.8-2.9-.9.2-3-2-2.3 1.6-2.6-.4-3 2.7-1.4 1-2.9 3 .3z"/><path d="M8 12.3l2.7 2.7L16.3 9.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  // estrella dibujada a mano, motivo de la marca
  const ESTRELLA = '<svg class="estrella" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4 C53 30 58 38 96 44 C62 52 57 58 52 97 C47 60 40 54 5 50 C38 42 46 34 50 4 Z"/></svg>';
  const AVATAR_CASA = '<img src="../shared/img/fav.svg" alt="">';
  const vistas = new Set(JSON.parse(sessionStorage.getItem('cc_hist_vistas') || '[]'));

  const u = () => CL.user();
  const nombreDe = (id) => id === 'casa' ? 'cantacorazon' : (CC.cliente(id) || { nombre: 'Cliente' }).nombre;
  const recibidas = () => CC.db.buzon.filter(b => b.para === u().id);
  function sinLeer() { return recibidas().filter(b => !b.visto).length; }
  const visibles = () => CC.db.promos.filter(p => !p.oculta && (p.suc === 'all' || !p.suc || p.suc === CL.sucId()));

  function media(p, enHistoria = false) {
    if (p.tipo === 'cartel') return `<div class="cartel ${esc(p.tema || '')}">${ESTRELLA}${ESTRELLA.replace('class="estrella"', 'class="estrella b"')}<div><div class="kick">Canta Corazón</div></div><div><div class="g">${esc(p.grande || '')}</div><div class="t">${esc(p.titulo)}</div>${p.sub ? `<div class="s">${esc(p.sub)}</div>` : ''}</div><div class="pie"><img src="../shared/img/logo.png" alt="Canta Corazón"><span class="kick">${p.suc === 's2' ? 'Pedregal' : p.suc === 's1' ? 'Polanco' : 'Polanco · Pedregal'}</span></div></div>`;
    const alt = { 'post_noche.webp': 'El salón lleno con el letrero de Canta Corazón al fondo', 'post_sombrero.webp': 'Una cantante con sombrero de mariachi frente al público', 'post_fachada.webp': 'La fachada de Canta Corazón', 'post_frase.webp': 'Collage con la frase «Una cantadita y se te reinicia la vida»' }[p.img] || p.titulo;
    return `<img src="../shared/img/${esc(p.img)}" alt="${esc(alt)}" loading="${enHistoria ? 'eager' : 'lazy'}" decoding="async" width="1080" height="${p.img === 'post_sombrero.webp' ? 1350 : 1080}">`;
  }
  function likesTxt(p) {
    const yo = p.likes.includes(u().id); const amigos = p.likes.filter(id => id !== u().id && (u().amigos || []).includes(id));
    const total = p.likesBase + p.likes.length;
    if (amigos.length) return `Les gusta a <b>${esc(CL.primerNombre(amigos[0]))}</b> y ${(total - 1).toLocaleString('es-MX')} personas más`;
    return `${total.toLocaleString('es-MX')} Me gusta${yo ? ' · incluido el tuyo' : ''}`;
  }
  function tarjeta(p) {
    const yo = u().id; const cm = p.coment;
    return `<article class="post" id="post_${p.id}" data-post="${p.id}">
      <header class="ph"><span class="pa">${AVATAR_CASA}</span><div class="who"><b>cantacorazon ${IC.verif}</b><span>${p.suc === 's2' ? 'Pedregal' : p.suc === 's1' ? 'Polanco' : 'Canta Corazón'} · ${esc(CC.hace(p))}</span></div><button class="mas" data-mas="${p.id}" aria-label="Más opciones">${IC.mas}</button></header>
      <div class="media" data-media="${p.id}" role="button" aria-label="Toca dos veces para dar me gusta">${media(p)}</div>
      ${p.cta ? `<button class="cta" data-cta="${p.id}"><span>${esc(p.cta.txt)}</span>${IC.ir}</button>` : ''}
      <div class="acts">
        <button data-like="${p.id}" class="${p.likes.includes(yo) ? 'on-like' : ''}" aria-pressed="${p.likes.includes(yo)}" aria-label="Me gusta">${IC.corazon}</button>
        <button data-com="${p.id}" aria-label="Comentar">${IC.comentar}</button>
        <button data-env="${p.id}" aria-label="Mandar a un amigo">${IC.enviar}</button>
        <button data-guar="${p.id}" class="der ${p.guardados.includes(yo) ? 'on-guardar' : ''}" aria-pressed="${p.guardados.includes(yo)}" aria-label="Guardar">${IC.guardar}</button>
      </div>
      <div class="txt"><div class="likes" data-likes="${p.id}">${likesTxt(p)}</div>
        <p><b>cantacorazon</b> ${p.grande ? '<b>' + esc(p.grande) + ' ' + esc(p.titulo) + '.</b> ' : '<b>' + esc(p.titulo) + '.</b> '}${esc(p.texto || '')}</p>
        ${cm.length > 2 ? `<button class="vc" data-com="${p.id}">Ver los ${cm.length} comentarios</button>` : ''}
        ${cm.slice(-2).map(c => `<div class="cm"><b>${c.clienteId === 'casa' ? 'cantacorazon' : esc(CL.primerNombre(c.clienteId).toLowerCase() + '.' + (nombreDe(c.clienteId).split(' ')[1] || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))}</b> ${esc(c.texto)}</div>`).join('')}
        <time>${esc(CC.hace(p))}</time></div>
    </article>`;
  }

  CL.registrar('promos', function () {
    const ps = visibles(); const rec = recibidas().filter(b => !b.visto);
    const hist = ps.filter(p => p.historia);
    $('#main').innerHTML = `<div class="feed-h"><h1>Promos</h1></div>
      <div class="stories" role="list">${hist.map((p, i) => `<button class="story" role="listitem" data-hist="${i}"><span class="ring ${vistas.has(p.id) ? 'visto' : ''}"><span>${p.tipo === 'cartel' ? `<span class="mini" style="background:${p.tema === 'ink' ? 'var(--ink)' : p.tema === 'gold' ? 'var(--gold)' : 'var(--terra)'}">${esc((p.grande || '').slice(0, 5))}</span>` : `<img src="../shared/img/${esc(p.img)}" alt="">`}</span></span><small>${esc(p.historia)}</small></button>`).join('')}</div>
      ${rec.map(b => { const p = CC.promo(b.promoId); if (!p) return ''; return `<button class="buzon" data-buzon="${b.id}"><span class="th">${p.tipo === 'foto' ? `<img src="../shared/img/${esc(p.img)}" alt="">` : esc((p.grande || '').slice(0, 4))}</span><div style="min-width:0;"><b>${esc(CL.primerNombre(b.de))} te mandó una promo</b><span>${b.nota ? '«' + esc(b.nota) + '»' : esc((p.grande ? p.grande + ' ' : '') + p.titulo)} · ${esc(CC.hace(b))}</span></div><span class="ir">Ver</span></button>`; }).join('')}
      ${ps.map(tarjeta).join('')}
      <p class="nota-demo">Promociones de ejemplo. Solo Canta Corazón publica; en el sistema interno se crean y se ve cuántos las vieron, comentaron, compartieron y usaron.</p>`;
    cablear();
  });

  function cablear() {
    $$('[data-hist]').forEach(b => b.onclick = () => historias(Number(b.dataset.hist)));
    $$('[data-buzon]').forEach(b => b.onclick = () => { const bz = CC.db.buzon.find(x => x.id === b.dataset.buzon); bz.visto = true; CC.save(); CL.render({ quieto: true }); const el = $('#post_' + bz.promoId); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('resalta'); setTimeout(() => el.classList.remove('resalta'), 2200); } });
    $$('[data-like]').forEach(b => b.onclick = () => darLike(b.dataset.like));
    $$('[data-com]').forEach(b => b.onclick = () => comentarios(b.dataset.com));
    $$('[data-env]').forEach(b => b.onclick = () => mandar(b.dataset.env));
    $$('[data-guar]').forEach(b => b.onclick = () => { const on = CC.guardarPromo(b.dataset.guar, u().id); b.classList.toggle('on-guardar', on); b.setAttribute('aria-pressed', on); toast(on ? 'Guardada en tu perfil' : 'Quitada de guardados'); });
    $$('[data-cta]').forEach(b => b.onclick = () => usar(CC.promo(b.dataset.cta)));
    $$('[data-mas]').forEach(b => b.onclick = () => opciones(CC.promo(b.dataset.mas)));
    // doble toque en la foto = me gusta, como en Instagram
    $$('[data-media]').forEach(m => { let ult = 0; m.addEventListener('click', () => { const t = Date.now(); if (t - ult < 320) { corazon(m); const p = CC.promo(m.dataset.media); if (!p.likes.includes(u().id)) darLike(p.id); ult = 0; } else ult = t; }); });
  }
  function corazon(m) { const c = document.createElement('div'); c.className = 'corazon'; c.innerHTML = IC.corazon; m.appendChild(c); setTimeout(() => c.remove(), 850); }
  function darLike(id) {
    const on = CC.likePromo(id, u().id);
    const b = $(`[data-like="${id}"]`); if (b) { b.classList.toggle('on-like', on); b.setAttribute('aria-pressed', on); }
    const l = $(`[data-likes="${id}"]`); if (l) l.innerHTML = likesTxt(CC.promo(id));
  }

  // ── comentarios ──
  function comentarios(id) {
    const p = CC.promo(id);
    const pintar = () => { $('#coms').innerHTML = p.coment.map(c => `<div class="com"><span class="av ${c.clienteId === 'casa' ? 'casa' : ''}">${c.clienteId === 'casa' ? AVATAR_CASA : CC.iniciales(nombreDe(c.clienteId))}</span><div><b>${c.clienteId === 'casa' ? 'cantacorazon ' + IC.verif : esc(nombreDe(c.clienteId))}</b> <time>${esc(CC.hace(c))}</time><p>${esc(c.texto)}</p></div></div>`).join('') || '<div class="muted small">Sé el primero en comentar.</div>'; };
    sheet(`${cab('Comentarios')}<div class="coms" id="coms"></div><form class="com-in" id="comForm"><input class="txt" id="comTxt" placeholder="Agrega un comentario…" autocomplete="off" maxlength="220" aria-label="Tu comentario"><button class="btn sm" type="submit">Publicar</button></form>`);
    pintar();
    $('#comForm').onsubmit = (e) => { e.preventDefault(); const t = $('#comTxt').value.trim(); if (!t) return; CC.comentar(id, u().id, t); $('#comTxt').value = ''; pintar(); const cs = $('#coms'); cs.lastElementChild.scrollIntoView({ block: 'nearest' }); CL.render({ quieto: true }); };
  }

  // ── mandar a amigos dentro de la app ──
  function mandar(id, preSel) {
    const p = CC.promo(id); const sel = new Set(preSel ? [preSel] : []);
    const pintar = () => {
      $('#envLista').innerHTML = u().amigos.map(aid => { const c = CC.cliente(aid); const on = sel.has(aid); return `<button class="friend" data-sel="${aid}" aria-pressed="${on}"><div class="av">${CC.iniciales(c.nombre)}</div><div class="nm"><b>${esc(c.nombre)}</b><span>${c.nivel === 'vip' ? 'VIP · ' : ''}en la app</span></div><div class="check ${on ? 'on' : ''}">${on ? '✓' : ''}</div></button>`; }).join('');
      $$('[data-sel]').forEach(b => b.onclick = () => { const k = b.dataset.sel; if (sel.has(k)) sel.delete(k); else sel.add(k); pintar(); });
      const go2 = $('#envGo'); go2.disabled = !sel.size; go2.textContent = sel.size ? `Mandar a ${sel.size === 1 ? CL.primerNombre([...sel][0]) : sel.size + ' amigos'}` : 'Elige a quién';
    };
    sheet(`${cab('Mandar «' + esc(p.grande ? p.grande + ' ' + p.titulo : p.titulo) + '»')}<div id="envLista"></div>
      <label class="lbl" for="envNota">Mensaje (opcional)</label><input class="txt" id="envNota" placeholder="¿Vamos el jueves?" maxlength="120" autocomplete="off">
      <button class="btn" id="envGo" style="margin-top:14px;">Elige a quién</button>
      <button class="btn sec" id="envFuera" style="margin-top:8px;">Compartir fuera de la app</button>`);
    pintar();
    $('#envGo').onclick = () => { if (!sel.size) return; const a = [...sel]; CC.enviarPromo(id, u().id, a, $('#envNota').value.trim()); closeSheet(); toast(a.length === 1 ? 'Se la mandaste a ' + CL.primerNombre(a[0]) : 'Se la mandaste a ' + a.length + ' amigos'); };
    $('#envFuera').onclick = () => { const url = location.origin + location.pathname + '#promos'; const txt = (p.grande ? p.grande + ' ' : '') + p.titulo + ' en Canta Corazón'; if (navigator.share) navigator.share({ title: 'Canta Corazón', text: txt, url }).catch(() => { }); else { if (navigator.clipboard) navigator.clipboard.writeText(txt + ' ' + url).catch(() => { }); toast('Link copiado'); } };
  }
  // desde Amigos: «Mandar promo» a una persona
  function elegirPromoPara(amigoId) {
    sheet(`${cab('¿Qué promo le mandas a ' + esc(CL.primerNombre(amigoId)) + '?')}<div>${visibles().map(p => `<button class="friend" data-el="${p.id}"><span class="av" style="border-radius:10px; overflow:hidden; background:var(--terra); color:var(--paper);">${p.tipo === 'foto' ? `<img src="../shared/img/${esc(p.img)}" alt="" style="width:100%; height:100%; object-fit:cover;">` : esc((p.grande || '').slice(0, 4))}</span><div class="nm"><b>${esc(p.grande ? p.grande + ' ' + p.titulo : p.titulo)}</b><span>${esc(p.sub || CC.hace(p))}</span></div></button>`).join('')}</div>`);
    $$('[data-el]').forEach(b => b.onclick = () => mandar(b.dataset.el, amigoId));
  }

  // ── usar la promo: reservar o mostrar el código al mesero ──
  function usar(p) {
    if (!p || !p.cta) return;
    if (p.cta.accion === 'reservar') { go('reservar'); return; }
    const pts = /(\d+)\s*pts/.exec(p.cta.txt); const costo = pts ? Number(pts[1]) : 0;
    if (costo && u().puntos < costo) { toast('Te faltan ' + (costo - u().puntos) + ' puntos para esta promo'); return; }
    const codigo = 'CC-' + p.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) + '-' + CC.iniciales(u().nombre) + String(u().id).replace(/\D/g, '').padStart(2, '0');
    sheet(`${cab(esc(p.grande ? p.grande + ' ' + p.titulo : p.titulo))}<div style="text-align:center; padding:6px 0 4px;"><div id="promoQR" style="width:200px; height:200px; margin:6px auto 12px; background:#fff; padding:10px; border-radius:16px;"></div><b class="num" style="font-size:22px; letter-spacing:.04em;">${codigo}</b><p class="small muted" style="margin:6px 0 0;">${esc(p.sub || '')}<br>Muéstralo al mesero o en la barra al pedir.</p></div><button class="btn" id="promoOk" style="margin-top:14px;">${costo ? 'Canjear ' + costo + ' puntos' : 'Listo'}</button>`);
    new QRCode($('#promoQR'), { text: codigo, width: 360, height: 360, colorDark: '#320707', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.M });
    $$('#promoQR img, #promoQR canvas').forEach(x => { x.style.width = '100%'; x.style.height = '100%'; });
    $('#promoOk').onclick = () => { if (costo) { u().puntos -= costo; } p.canjes += 1; CC.log('app', 'Promo usada: ' + (p.grande ? p.grande + ' ' : '') + p.titulo); CC.save(); closeSheet(); toast(costo ? 'Canjeada: te quedan ' + u().puntos.toLocaleString('es-MX') + ' puntos' : 'Promo lista para usar'); };
  }
  function opciones(p) {
    sheet(`${cab('Publicación')}<div class="card lista-perfil"><button id="opEnv">Mandar a un amigo</button><button id="opGuar">${p.guardados.includes(u().id) ? 'Quitar de guardados' : 'Guardar'}</button><button id="opCopiar">Copiar enlace</button></div>`);
    $('#opEnv').onclick = () => mandar(p.id);
    $('#opGuar').onclick = () => { CC.guardarPromo(p.id, u().id); closeSheet(); CL.render({ quieto: true }); };
    $('#opCopiar').onclick = () => { if (navigator.clipboard) navigator.clipboard.writeText(location.origin + location.pathname + '#promos').catch(() => { }); closeSheet(); toast('Enlace copiado'); };
  }

  // ── historias a pantalla completa (tocar a la derecha: siguiente; a la izquierda: anterior) ──
  function historias(inicio) {
    const hs = visibles().filter(p => p.historia); let i = inicio, t = null;
    const o = document.createElement('div'); o.className = 'hist'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Historias de Canta Corazón'); document.body.appendChild(o);
    const cerrar = () => { clearTimeout(t); o.remove(); document.removeEventListener('keydown', tecla); CL.render({ quieto: true }); };
    const tecla = (e) => { if (e.key === 'Escape') cerrar(); if (e.key === 'ArrowRight') paso(1); if (e.key === 'ArrowLeft') paso(-1); };
    document.addEventListener('keydown', tecla);
    function paso(d) { i += d; if (i < 0) i = 0; if (i >= hs.length) { cerrar(); return; } pintar(); }
    function pintar() {
      const p = hs[i]; vistas.add(p.id); sessionStorage.setItem('cc_hist_vistas', JSON.stringify([...vistas])); clearTimeout(t);
      o.innerHTML = `<div class="marco"><div class="barras">${hs.map((_, k) => `<i class="${k < i ? 'hecho' : k === i ? 'va' : ''}"><b></b></i>`).join('')}</div>
        <div class="cab"><span class="pa">${AVATAR_CASA}</span><div><b>cantacorazon</b> <span>${esc(p.historia)} · ${esc(CC.hace(p))}</span></div><button class="x" aria-label="Cerrar">${IC.x}</button></div>
        <div class="cuadro">${media(p, true)}</div>
        <button class="zona izq" aria-label="Anterior"></button><button class="zona der" aria-label="Siguiente"></button>
        ${p.cta ? `<div class="hpie"><button class="btn" id="hCta">${esc(p.cta.txt)}</button></div>` : ''}</div>`;
      $('.x', o).onclick = cerrar; $('.zona.izq', o).onclick = () => paso(-1); $('.zona.der', o).onclick = () => paso(1);
      const c = $('#hCta', o); if (c) c.onclick = () => { cerrar(); usar(p); };
      t = setTimeout(() => paso(1), 5000);
    }
    pintar();
  }

  window.PR = { sinLeer, elegirPromoPara, mandar };
})();
