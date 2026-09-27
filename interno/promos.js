/* Canta Corazón · Sistema interno · Promociones: la casa publica (cartel de diseño o foto) y ve qué hizo cada
   publicación: me gusta, comentarios, envíos entre clientes y canjes. Lo publicado aparece al instante en la app
   del cliente (en el demo, en otra pestaña del mismo navegador). */
(function () {
  'use strict';
  const { $, $$, esc, I, sheet, closeSheet, toast, shell, kpi } = CI;
  const FOTOS = [['post_noche.webp', 'Salón lleno'], ['post_sombrero.webp', 'Sombrero'], ['post_fachada.webp', 'Fachada'], ['post_frase.webp', 'La frase']];
  const TEMAS = [['terra', 'Terracota', '#C25B32'], ['ink', 'Vino', '#320707'], ['gold', 'Oro', '#C99A2E'], ['salmon', 'Salmón', '#F3C8B4']];
  const ACCIONES = [['canje', 'Usar promo'], ['reservar', 'Reservar mesa'], ['', 'Sin botón']];
  const B = { tipo: 'cartel', tema: 'terra', img: 'post_noche.webp', grande: '3×2', titulo: 'en cubetas de cerveza', sub: 'Jueves de 8 a 10 pm', texto: 'Cubeta de 3 cervezas al precio de 2. Muéstrala en tu app al pedir.', accion: 'canje', historia: true, suc: 'all' };

  const nombre = (id) => id === 'casa' ? 'Canta Corazón' : (CC.cliente(id) || { nombre: 'Cliente' }).nombre;
  const mini = (p) => p.tipo === 'foto' ? `<img src="../shared/img/${esc(p.img)}" alt="">` : `<span style="background:${(TEMAS.find(t => t[0] === p.tema) || TEMAS[0])[2]}; color:${p.tema === 'gold' || p.tema === 'salmon' ? '#320707' : '#F6EFE4'}">${esc((p.grande || '').slice(0, 5))}</span>`;

  CI.registrar('promos', function () {
    const ps = CC.db.promos; const likes = ps.reduce((a, p) => a + p.likesBase + p.likes.length, 0); const coms = ps.reduce((a, p) => a + p.coment.length, 0);
    const envios = ps.reduce((a, p) => a + p.envios, 0); const canjes = ps.reduce((a, p) => a + p.canjes, 0);
    const html = `<div class="kgrid">${kpi({ icon: 'mega', label: 'Publicaciones', value: ps.filter(p => !p.oculta).length, sub: 'visibles en la app' })}${kpi({ icon: 'heart', label: 'Me gusta', value: likes.toLocaleString('es-MX'), sub: 'de clientes con la app' })}${kpi({ icon: 'chat', label: 'Comentarios', value: coms, sub: 'la casa puede contestar' })}${kpi({ icon: 'send', label: 'Envíos entre clientes', value: envios, cls: 'good', sub: 'promos que un cliente mandó a otro' })}${kpi({ icon: 'ticket', label: 'Canjes', value: canjes, sub: 'promos usadas en el local' })}</div>
      <div class="grid g23"><div class="card"><div class="row wrap"><h3 style="margin:0;">Publicaciones <span>· solo publica la casa</span></h3><div class="acciones"><a class="btn sec sm" href="../cliente/#promos" target="_blank" rel="noopener">${I('phone')}Ver en la app</a><button class="btn sm" id="btnNueva">${I('mega')}Nueva publicación</button></div></div>
        <div class="plist">${ps.map(p => `<div class="pitem ${p.oculta ? 'oculta' : ''}"><span class="pmini">${mini(p)}</span><div class="pinfo"><b>${esc(p.grande ? p.grande + ' ' + p.titulo : p.titulo)}</b><span>${esc(CC.hace(p))} · ${p.suc === 's1' ? 'Polanco' : p.suc === 's2' ? 'Pedregal' : 'las dos sucursales'}${p.historia ? ' · también en historias' : ''}${p.oculta ? ' · oculta' : ''}</span>
          <div class="pmet"><span>${I('heart')}${(p.likesBase + p.likes.length).toLocaleString('es-MX')}</span><span>${I('chat')}${p.coment.length}</span><span>${I('send')}${p.envios}</span><span>${I('ticket')}${p.canjes}</span></div></div>
          <div class="pbtn"><button class="btn sec sm" data-ver="${p.id}">Comentarios</button><button class="btn sec sm" data-ocultar="${p.id}">${p.oculta ? 'Mostrar' : 'Ocultar'}</button></div></div>`).join('')}</div></div>
        <div><div class="card cream"><h3 style="color:var(--terra);">Cómo funciona</h3><div class="small" style="line-height:1.55;"><b>Solo la casa publica.</b> Los clientes ven las promociones en su app, dan me gusta, comentan y se las mandan entre ellos.<br><b>Cada envío es un cliente invitando a otro:</b> se mide cuántas visitas genera.<br><b>Cada canje queda ligado a la venta</b> del ticket, para saber qué promoción sí deja dinero.</div></div>
          <div class="card" style="margin-top:12px;"><h3>Comentarios recientes</h3>${ps.flatMap(p => p.coment.filter(c => c.clienteId !== 'casa').map(c => ({ c, p }))).sort((a, b) => CC.minutos(a.c) - CC.minutos(b.c)).slice(0, 5).map(({ c, p }) => `<div class="alert"><i style="background:var(--terra)"></i><span><b>${esc(nombre(c.clienteId))}</b> en «${esc(p.grande ? p.grande + ' ' + p.titulo : p.titulo)}»: ${esc(c.texto)} <span class="muted">· ${esc(CC.hace(c))}</span></span></div>`).join('')}</div></div></div>`;
    shell(html, 'Promociones', 'Lo que la casa publica en la app del cliente y lo que hace cada publicación');
    $('#btnNueva').onclick = nueva;
    $$('[data-ver]').forEach(b => b.onclick = () => verComentarios(CC.promo(b.dataset.ver)));
    $$('[data-ocultar]').forEach(b => b.onclick = () => { const p = CC.promo(b.dataset.ocultar); p.oculta = !p.oculta; CC.log('promos', (p.oculta ? 'Ocultó' : 'Mostró') + ' «' + p.titulo + '»'); CC.save(); CI.render(); });
  });

  function verComentarios(p) {
    const pintar = () => { $('#icoms').innerHTML = p.coment.map(c => `<div class="alert"><i style="background:${c.clienteId === 'casa' ? 'var(--terra)' : 'var(--darkmuted)'}"></i><span><b>${esc(nombre(c.clienteId))}</b> <span class="muted">· ${esc(CC.hace(c))}</span><br>${esc(c.texto)}</span></div>`).join('') || '<div class="muted small">Sin comentarios todavía.</div>'; };
    sheet(`<div class="row"><h3 style="margin:0;">Comentarios · ${esc(p.grande ? p.grande + ' ' + p.titulo : p.titulo)}</h3><button class="btn sec sm" id="cls">Cerrar</button></div><div id="icoms" style="margin-top:10px; max-height:46vh; overflow:auto;"></div>
      <form id="iResp" style="display:flex; gap:8px; margin-top:12px;"><input class="txt" id="iRespTxt" placeholder="Contestar como Canta Corazón…" autocomplete="off" maxlength="220"><button class="btn" type="submit">Contestar</button></form>`);
    $('#cls').onclick = closeSheet; pintar();
    $('#iResp').onsubmit = (e) => { e.preventDefault(); const t = $('#iRespTxt').value.trim(); if (!t) return; CC.comentar(p.id, 'casa', t); $('#iRespTxt').value = ''; pintar(); toast('Respuesta publicada en la app'); };
  }

  function nueva() {
    const d = Object.assign({}, B);
    const vista = () => d.tipo === 'foto' ? `<img src="../shared/img/${esc(d.img)}" alt="">` : `<div class="cartel-mini ${esc(d.tema)}"><small>Canta Corazón</small><div><div class="g">${esc(d.grande)}</div><div class="t">${esc(d.titulo)}</div>${d.sub ? `<div class="s">${esc(d.sub)}</div>` : ''}</div><img src="../shared/img/logo.png" alt=""></div>`;
    const pintar = () => {
      $('#pnForm').innerHTML = `<label class="lbl">Tipo</label><div class="seg"><button type="button" data-t="cartel" class="${d.tipo === 'cartel' ? 'on' : ''}">Cartel</button><button type="button" data-t="foto" class="${d.tipo === 'foto' ? 'on' : ''}">Foto</button></div>
        ${d.tipo === 'cartel' ? `<label class="lbl">Color</label><div class="chips">${TEMAS.map(([k, l, c]) => `<button type="button" data-tema="${k}" class="${d.tema === k ? 'on' : ''}"><i style="background:${c}"></i>${l}</button>`).join('')}</div>
          <label class="lbl" for="pnG">Texto grande</label><input class="txt" id="pnG" maxlength="8" value="${esc(d.grande)}">` : `<label class="lbl">Foto</label><div class="chips">${FOTOS.map(([f, l]) => `<button type="button" data-img="${f}" class="${d.img === f ? 'on' : ''}">${l}</button>`).join('')}</div>`}
        <label class="lbl" for="pnT">Título</label><input class="txt" id="pnT" maxlength="40" value="${esc(d.titulo)}">
        <label class="lbl" for="pnS">Cuándo aplica</label><input class="txt" id="pnS" maxlength="60" value="${esc(d.sub)}">
        <label class="lbl" for="pnX">Texto de la publicación</label><textarea class="txt" id="pnX" rows="2" maxlength="220">${esc(d.texto)}</textarea>
        <div class="grid g2" style="margin-top:0;"><div><label class="lbl" for="pnA">Botón</label><select class="txt" id="pnA">${ACCIONES.map(([k, l]) => `<option value="${k}" ${d.accion === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div><label class="lbl" for="pnSuc">Sucursal</label><select class="txt" id="pnSuc"><option value="all" ${d.suc === 'all' ? 'selected' : ''}>Las dos</option><option value="s1" ${d.suc === 's1' ? 'selected' : ''}>Polanco</option><option value="s2" ${d.suc === 's2' ? 'selected' : ''}>Pedregal</option></select></div></div>
        <label class="chk"><input type="checkbox" id="pnH" ${d.historia ? 'checked' : ''}> También en historias</label>`;
      $('#pnVista').innerHTML = vista();
      $$('[data-t]').forEach(b => b.onclick = () => { leer(); d.tipo = b.dataset.t; pintar(); });
      $$('[data-tema]').forEach(b => b.onclick = () => { leer(); d.tema = b.dataset.tema; pintar(); });
      $$('[data-img]').forEach(b => b.onclick = () => { leer(); d.img = b.dataset.img; pintar(); });
      $$('#pnForm input, #pnForm textarea, #pnForm select').forEach(x => x.oninput = () => { leer(); $('#pnVista').innerHTML = vista(); });
    };
    const leer = () => { const v = (id) => { const x = $('#' + id); return x ? (x.type === 'checkbox' ? x.checked : x.value) : undefined; }; if (d.tipo === 'cartel') d.grande = v('pnG').trim(); d.titulo = v('pnT').trim(); d.sub = v('pnS').trim(); d.texto = v('pnX').trim(); d.accion = v('pnA'); d.suc = v('pnSuc'); d.historia = v('pnH'); };
    sheet(`<div class="row"><h3 style="margin:0;">Nueva publicación</h3><button class="btn sec sm" id="cls">Cerrar</button></div>
      <div class="pnueva"><form id="pnForm" onsubmit="return false"></form><div><div class="small muted" style="margin:10px 0 6px;">Así se ve en la app</div><div class="pvista" id="pnVista"></div></div></div>
      <button class="btn" id="pnGo" style="margin-top:14px; width:100%;">${I('mega')}Publicar en la app del cliente</button>`);
    $('#cls').onclick = closeSheet; pintar();
    $('#pnGo').onclick = () => {
      leer(); if (!d.titulo) { toast('Falta el título'); return; }
      const acc = ACCIONES.find(a => a[0] === d.accion);
      CC.publicarPromo({ tipo: d.tipo, tema: d.tema, img: d.tipo === 'foto' ? d.img : null, grande: d.tipo === 'cartel' ? d.grande : '', titulo: d.titulo, sub: d.sub, texto: d.texto, suc: d.suc, historia: d.historia ? 'Nuevo' : null, cta: d.accion ? { txt: acc[1], accion: d.accion } : null });
      closeSheet(); toast('Publicada: ya aparece en la app del cliente'); CI.render();
    };
  }
})();
