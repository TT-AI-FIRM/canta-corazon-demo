/* Canta Corazón · App del cliente · Entrar o crear cuenta.
   Es la pantalla que abre la tarjeta de la mesa (cliente/?mesa=14): el cliente escanea o acerca su teléfono
   y entra con correo y contraseña, o crea su cuenta ahí mismo.
   En el demo ya hay sesión (Mariana): no se valida ni se guarda ninguna contraseña.
   En la fase real la cuenta vive en el servidor, con verificación por correo. */
(function () {
  'use strict';
  const { $, $$, esc, toast } = CL;
  let modo = 'entrar';
  const correoOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

  CL.registrar('entrar', function () {
    const ctx = CL.mesaCtx; const u = CL.user();
    const m = ctx ? CC.db.mesas.find(x => x.suc === ctx.suc && x.num === ctx.num) : null;
    $('#main').innerHTML = `<div class="entrar">
      <div class="foto"><img class="bg" src="../shared/img/meta.jpg" alt=""><button class="hb" id="eBack" aria-label="Regresar"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><img class="lg" src="../shared/img/logo.png" alt="Canta Corazón"></div>
      <div class="caja">
        ${m ? `<span class="mesa">Mesa ${m.num} · ${esc(CC.suc(m.suc).nombre)}</span>` : ''}
        <h1>${modo === 'entrar' ? (m ? 'Pide, paga y canta <em>desde tu mesa.</em>' : 'Bienvenido <em>de vuelta.</em>') : 'Crea tu cuenta <em>en un minuto.</em>'}</h1>
        <p class="sub">${modo === 'entrar' ? 'Entra con tu correo para ver tu QR, tu cuenta y tus puntos.' : 'Con tu cuenta reservas, divides la cuenta con tus amigos y juntas puntos.'}</p>
        ${modo === 'entrar' ? `<button class="sigue" id="eSigue"><span class="avatar">${CC.iniciales(u.nombre)}</span><div><b>Seguir como ${esc(u.nombre.split(' ')[0])}</b><span>${esc(u.email)}</span></div><span class="ir">Entrar</span></button><div class="o">o con otra cuenta</div>` : ''}
        <form id="eForm" novalidate>
          ${modo === 'crear' ? `<label class="lbl" for="eNombre">Nombre</label><input class="txt" id="eNombre" autocomplete="name" placeholder="Tu nombre y apellido">` : ''}
          <label class="lbl" for="eCorreo">Correo</label><input class="txt" id="eCorreo" type="email" inputmode="email" autocomplete="email" placeholder="tu@correo.com">
          ${modo === 'crear' ? `<label class="lbl" for="eTel">Celular</label><input class="txt" id="eTel" type="tel" inputmode="tel" autocomplete="tel" placeholder="55 1234 5678">` : ''}
          <label class="lbl" for="eClave">Contraseña</label><input class="txt" id="eClave" type="password" autocomplete="${modo === 'crear' ? 'new-password' : 'current-password'}" placeholder="${modo === 'crear' ? 'Mínimo 8 caracteres' : 'Tu contraseña'}">
          ${modo === 'crear' ? `<label class="terminos"><input type="checkbox" id="eAcepto"><span>Acepto el aviso de privacidad y que Canta Corazón me mande promociones. Puedo darme de baja cuando quiera.</span></label>` : ''}
          <div class="error" id="eError" role="alert"></div>
          <button class="btn" type="submit" style="margin-top:14px;">${modo === 'entrar' ? 'Entrar' : 'Crear mi cuenta'}</button>
        </form>
        ${modo === 'entrar' ? `<button class="link" id="eOlvide" style="width:100%;">Olvidé mi contraseña</button>` : ''}
        <div class="o">o</div>
        <div class="grid2"><button class="btn sec" data-prov="Apple">Con Apple</button><button class="btn sec" data-prov="Google">Con Google</button></div>
        <button class="btn ghost" id="eModo" style="margin-top:14px;">${modo === 'entrar' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}</button>
        <p class="nota-demo">Demo: no se guarda ninguna contraseña. En la fase real la cuenta vive en el servidor de Canta Corazón y se verifica por correo.</p>
      </div></div>`;
    $('#eBack').onclick = CL.back;
    const sg = $('#eSigue'); if (sg) sg.onclick = () => listo(u.id, false);
    $('#eModo').onclick = () => { modo = modo === 'entrar' ? 'crear' : 'entrar'; CL.render(); };
    const ol = $('#eOlvide'); if (ol) ol.onclick = () => toast('En la fase real te llega un enlace a tu correo para cambiarla');
    $$('[data-prov]').forEach(b => b.onclick = () => toast('En la fase real: entrar con ' + b.dataset.prov + ' en un toque'));
    $('#eForm').onsubmit = (e) => {
      e.preventDefault(); const err = $('#eError'); const correo = $('#eCorreo').value.trim().toLowerCase(); const clave = $('#eClave').value;
      if (modo === 'crear') {
        const nombre = $('#eNombre').value.trim(); const tel = $('#eTel').value.replace(/\D/g, '');
        if (nombre.split(' ').filter(Boolean).length < 2) { err.textContent = 'Escribe tu nombre y apellido.'; $('#eNombre').focus(); return; }
        if (!correoOk(correo)) { err.textContent = 'Revisa tu correo: le falta algo.'; $('#eCorreo').focus(); return; }
        if (tel.length < 10) { err.textContent = 'El celular lleva 10 dígitos.'; $('#eTel').focus(); return; }
        if (clave.length < 8) { err.textContent = 'La contraseña lleva mínimo 8 caracteres.'; $('#eClave').focus(); return; }
        if (!$('#eAcepto').checked) { err.textContent = 'Falta aceptar el aviso de privacidad.'; return; }
        if (CC.db.clientes.some(c => c.email === correo)) { err.textContent = 'Ya hay una cuenta con ese correo: entra con ella.'; return; }
        const id = 'c' + (CC.db.clientes.length + 1 + Math.floor(Math.random() * 900));
        CC.db.clientes.push({ id, nombre, tel, email: correo, nivel: 'nuevo', visitas: 0, gasto: 0, puntos: 100, cumple: '01-01', sucFav: (CL.mesaCtx || {}).suc || 's1', notas: '', amigos: ['c1'] });
        CC.log('app', 'Cuenta nueva: ' + nombre); CC.save(); listo(id, true); return;
      }
      if (!correoOk(correo)) { err.textContent = 'Revisa tu correo: le falta algo.'; $('#eCorreo').focus(); return; }
      if (!clave) { err.textContent = 'Escribe tu contraseña.'; $('#eClave').focus(); return; }
      const c = CC.db.clientes.find(x => x.email === correo);
      listo(c ? c.id : u.id, false);
    };
  });
  function listo(id, nueva) {
    CL.setUser(id); toast(nueva ? 'Cuenta creada: te regalamos 100 puntos de bienvenida' : 'Hola, ' + CL.primerNombre(id));
    CL.go('noche');
  }
})();
