/* Canta Corazón · Demo · núcleo compartido (datos, almacén, QR, métricas)
   Demo local: los datos viven en localStorage del navegador y se sincronizan entre pestañas
   del mismo dispositivo (BroadcastChannel + evento storage). Todos los datos son ILUSTRATIVOS. */
(function () {
  'use strict';
  const KEY = 'cc_demo_v8';
  const SECRET = 'canta-corazon-demo-2026'; // solo demo: en producción la firma vive en el servidor
  const CANAL = 'cc-demo';

  // ───────────────────────── utilidades ─────────────────────────
  function mulberry(seed) { let t = seed >>> 0; return function () { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  const rnd = mulberry(20260907);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => a + rnd() * (b - a);
  const round = (n, d = 0) => { const p = Math.pow(10, d); return Math.round(n * p) / p; };
  let uidN = 1000;
  const uid = (p = 'id') => p + '_' + (Date.now().toString(36)) + '_' + (uidN++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const pad = (n) => String(n).padStart(2, '0');
  const fechaISO = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const hoy = () => fechaISO(new Date());
  const ahoraHM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const money = (n, dec = 0) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const pct = (n, d = 1) => (Number(n || 0)).toFixed(d) + '%';
  const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const fechaLarga = (iso) => { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d); return DIAS[dt.getDay()] + ' ' + d + ' de ' + MESES_L[m - 1]; };
  const iniciales = (n) => n.split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase();

  // ───────────────────────── catálogos ─────────────────────────
  const SUCURSALES = [
    { id: 's1', nombre: 'Polanco', ciudad: 'CDMX', aforo: 800, pisos: 2, factor: 1.0 },
    { id: 's2', nombre: 'Pedregal', ciudad: 'CDMX', aforo: 520, pisos: 1, factor: 0.78 }
  ];
  const TIPOS_QR = {
    barra: { nombre: 'Barra', color: '#3FA8A6', texto: '#130708', desc: 'Acceso general con consumo en barra' },
    cover: { nombre: 'Cover', color: '#7E8B6C', texto: '#130708', desc: 'Entrada con cover pagado' },
    mesa: { nombre: 'Mesa', color: '#C25B32', texto: '#F6EFE4', desc: 'Mesa reservada con anticipo' },
    vip: { nombre: 'Mesa VIP', color: '#C99A2E', texto: '#130708', desc: 'Mesa VIP con consumo mínimo' },
    clientevip: { nombre: 'Cliente VIP', color: '#D0609F', texto: '#130708', desc: 'Cliente VIP: acceso preferente sin cover' }
  };
  const ROLES = {
    socio: 'Socio', gerente: 'Gerente', hostess: 'Hostess', puerta: 'Puerta', barra: 'Barra', mesero: 'Mesero', caja: 'Caja', compras: 'Compras'
  };

  // Plano: coordenadas en % del lienzo (0-100). Piso 1 y 2 de Polanco, piso 1 de Pedregal.
  function planoPolanco() {
    const m = []; let n = 1;
    // piso 1: barra arriba, pista al centro, mesas alrededor
    const p1 = [
      [8, 30], [8, 46], [8, 62], [8, 78],            // izquierda
      [22, 78], [36, 78], [50, 78], [64, 78], [78, 78], // abajo
      [92, 30], [92, 46], [92, 62], [92, 78],        // derecha
      [30, 54], [50, 54], [70, 54]                   // frente a la barra (VIP)
    ];
    p1.forEach(([x, y], i) => { const vip = i >= 13; m.push({ id: 'm' + n, suc: 's1', piso: 1, num: n, x, y, w: 9, h: 9, cap: vip ? 10 : 6, tipo: vip ? 'vip' : 'mesa', minimo: vip ? 12000 : 6000, anticipo: vip ? 6000 : 3000 }); n++; });
    // piso 2: balcón con mesas y 2 salones privados
    const p2 = [[10, 25], [10, 45], [10, 65], [10, 85], [30, 85], [50, 85], [70, 85], [90, 25], [90, 45], [90, 65], [90, 85]];
    p2.forEach(([x, y]) => { m.push({ id: 'm' + n, suc: 's1', piso: 2, num: n, x, y, w: 9, h: 9, cap: 8, tipo: 'mesa', minimo: 8000, anticipo: 4000 }); n++; });
    m.push({ id: 'm' + n, suc: 's1', piso: 2, num: n, x: 35, y: 30, w: 14, h: 18, cap: 16, tipo: 'vip', minimo: 25000, anticipo: 12000, salon: 'Salón Corazón' }); n++;
    m.push({ id: 'm' + n, suc: 's1', piso: 2, num: n, x: 60, y: 30, w: 14, h: 18, cap: 12, tipo: 'vip', minimo: 18000, anticipo: 9000, salon: 'Salón Despecho' }); n++;
    return m;
  }
  function planoSuc2() {
    const m = []; let n = 101;
    const pts = [[8, 32], [8, 50], [8, 68], [8, 86], [24, 86], [40, 86], [56, 86], [72, 86], [92, 32], [92, 50], [92, 68], [92, 86], [30, 56], [50, 56], [70, 56]];
    pts.forEach(([x, y], i) => { const vip = i >= 12; m.push({ id: 'm' + n, suc: 's2', piso: 1, num: n - 100, x, y, w: 10, h: 10, cap: vip ? 10 : 6, tipo: vip ? 'vip' : 'mesa', minimo: vip ? 10000 : 5000, anticipo: vip ? 5000 : 2500 }); n++; });
    return m;
  }

  const PRODUCTOS = [
    // botellas (venta por botella; costo ilustrativo)
    { id: 'b_tequila_rep', cat: 'botella', nombre: 'Tequila reposado 750 ml', precio: 3200, costo: 980, ml: 750, base: 'tequila' },
    { id: 'b_tequila_bl', cat: 'botella', nombre: 'Tequila blanco 750 ml', precio: 2900, costo: 860, ml: 750, base: 'tequila_bl' },
    { id: 'b_mezcal', cat: 'botella', nombre: 'Mezcal joven 750 ml', precio: 2800, costo: 790, ml: 750, base: 'mezcal' },
    { id: 'b_vodka', cat: 'botella', nombre: 'Vodka 750 ml', precio: 2600, costo: 720, ml: 750, base: 'vodka' },
    { id: 'b_whisky', cat: 'botella', nombre: 'Whisky 12 años 750 ml', precio: 3900, costo: 1350, ml: 750, base: 'whisky' },
    { id: 'b_gin', cat: 'botella', nombre: 'Gin 750 ml', precio: 2700, costo: 760, ml: 750, base: 'gin' },
    { id: 'b_champ', cat: 'botella', nombre: 'Champaña 750 ml', precio: 4800, costo: 1900, ml: 750, base: 'champ' },
    { id: 'b_aperol', cat: 'botella', nombre: 'Aperol 750 ml', precio: 2200, costo: 520, ml: 750, base: 'aperol' },
    // coctelería (receta: ml de la botella base)
    { id: 't_canta', cat: 'trago', nombre: 'Canta Corazón', precio: 260, costo: 62, receta: [['tequila', 45], ['aperol', 15]] , desc: 'Tequila reposado, guayaba, fresa, Aperol y limón' },
    { id: 't_elote', cat: 'trago', nombre: 'Elote Margarita', precio: 240, costo: 55, receta: [['tequila_bl', 50]], desc: 'Tequila blanco, elote, estragón y limón' },
    { id: 't_acaentre', cat: 'trago', nombre: 'Acá Entre Nos', precio: 220, costo: 48, receta: [['vodka', 45]], desc: 'Vodka, frambuesa, limón y ginger beer' },
    { id: 't_mezcalita', cat: 'trago', nombre: 'Mezcalita de la casa', precio: 230, costo: 50, receta: [['mezcal', 50]] },
    { id: 't_paloma', cat: 'trago', nombre: 'Paloma', precio: 190, costo: 40, receta: [['tequila_bl', 45]] },
    { id: 't_gintonic', cat: 'trago', nombre: 'Gin tonic', precio: 210, costo: 46, receta: [['gin', 50]] },
    { id: 't_whiskysour', cat: 'trago', nombre: 'Whisky sour', precio: 240, costo: 60, receta: [['whisky', 50]] },
    { id: 't_shot_mango', cat: 'trago', nombre: 'Shot Baby Mango', precio: 120, costo: 22, receta: [['tequila_bl', 30]] },
    // cerveza y sin alcohol
    { id: 'c_clara', cat: 'cerveza', nombre: 'Cerveza clara', precio: 95, costo: 28 },
    { id: 'c_oscura', cat: 'cerveza', nombre: 'Cerveza oscura', precio: 95, costo: 28 },
    { id: 'c_agua', cat: 'cerveza', nombre: 'Agua mineral', precio: 60, costo: 14 },
    { id: 'c_refresco', cat: 'cerveza', nombre: 'Refresco', precio: 60, costo: 14 },
    { id: 'c_ninafresa', cat: 'cerveza', nombre: 'Niña Fresa (sin alcohol)', precio: 150, costo: 30 },
    // cocina
    { id: 'k_guac', cat: 'comida', nombre: 'Guacamole con totopos', precio: 220, costo: 60 },
    { id: 'k_esquites', cat: 'comida', nombre: 'Esquites', precio: 140, costo: 35 },
    { id: 'k_flautas', cat: 'comida', nombre: 'Flautas de pollo', precio: 260, costo: 75 },
    { id: 'k_tacos_rib', cat: 'comida', nombre: 'Tacos de rib eye (3)', precio: 320, costo: 120 },
    { id: 'k_pastor', cat: 'comida', nombre: 'Tacos al pastor (3)', precio: 190, costo: 55 },
    { id: 'k_tostadas', cat: 'comida', nombre: 'Tostadas de atún (2)', precio: 280, costo: 95 },
    // extras
    { id: 'x_sombrero', cat: 'extra', nombre: 'Sombrero de la casa', precio: 350, costo: 140 },
    { id: 'x_cancion', cat: 'extra', nombre: 'Dedicatoria con el mariachi', precio: 500, costo: 0 },
    { id: 'x_pastel', cat: 'extra', nombre: 'Pastel de cumpleaños', precio: 900, costo: 380 }
  ];
  const BASES = { tequila: 'b_tequila_rep', tequila_bl: 'b_tequila_bl', mezcal: 'b_mezcal', vodka: 'b_vodka', whisky: 'b_whisky', gin: 'b_gin', champ: 'b_champ', aperol: 'b_aperol' };
  const PRECIOS = { cover: 350, barra: 250 };

  const PROVEEDORES = [
    { id: 'p1', nombre: 'Destilados del Bajío S.A. de C.V.', rfc: 'DBA980512K12', cat: 'Licores', contacto: 'Luis Herrera' },
    { id: 'p2', nombre: 'Importadora Premium MX', rfc: 'IPM120315AB7', cat: 'Licores importados', contacto: 'Ana Cortés' },
    { id: 'p3', nombre: 'Cervecería Regional', rfc: 'CRE050822M44', cat: 'Cerveza y bebidas', contacto: 'Jorge Pineda' },
    { id: 'p4', nombre: 'Abastos La Central', rfc: 'ALC010203XY9', cat: 'Alimentos', contacto: 'Rocío Mena' },
    { id: 'p5', nombre: 'Sombreros Charros de Jalisco', rfc: 'SCJ140909QW2', cat: 'Merchandising', contacto: 'Pedro Aldana' }
  ];

  const NOMBRES = ['Mariana Reyes', 'Diego Salinas', 'Sofía Herrera', 'Fernanda Ruiz', 'Marco Antonio Vela', 'Valeria Ortiz', 'Andrés Palacios', 'Camila Duarte', 'Rodrigo Estrada', 'Ximena Lozano', 'Emilio Cárdenas', 'Regina Montes', 'Santiago Ibarra', 'Paulina Navarro', 'Alejandro Fuentes', 'Daniela Sáenz', 'Javier Ledesma', 'Renata Quiroz', 'Mauricio Téllez', 'Isabela Gómez', 'Sebastián Ríos', 'Lorena Castañeda', 'Iván Serrano', 'Natalia Bravo', 'Héctor Guzmán', 'Fátima Rangel', 'Gabriel Ochoa', 'Andrea Solís', 'Ricardo Peña', 'Mónica Ayala', 'Luis Carrillo', 'Elena Mireles', 'Óscar Villalobos', 'Karla Benítez', 'Arturo Medina', 'Claudia Roldán', 'Pablo Anaya', 'Jimena Cisneros', 'Raúl Zamora', 'Brenda Aguirre'];
  const PERSONAL_BASE = [
    ['Valentina Cruz', 'gerente'], ['Lucía Farías', 'hostess'], ['Tomás Beltrán', 'puerta'], ['Nicolás Prado', 'puerta'], ['Adrián Salas', 'barra'], ['Mateo Lugo', 'barra'], ['Carla Pineda', 'mesero'], ['Rubén Castillo', 'mesero'], ['Itzel Romero', 'mesero'], ['Bruno Delgado', 'mesero'], ['Patricia Nieto', 'caja'], ['Omar Quintero', 'compras']
  ];

  // ───────────────────────── semilla ─────────────────────────
  function semilla() {
    const db = { version: 1, creado: new Date().toISOString(), config: { cupoVisible: true, precios: PRECIOS, nombreDemo: 'Canta Corazón · Demo' } };
    db.sucursales = SUCURSALES.map(s => ({ ...s }));
    db.mesas = planoPolanco().concat(planoSuc2());
    db.productos = PRODUCTOS.map(p => ({ ...p }));
    db.proveedores = PROVEEDORES.map(p => ({ ...p }));

    // clientes
    db.clientes = NOMBRES.map((n, i) => {
      const visitas = i < 6 ? 5 + Math.floor(rnd() * 9) : Math.floor(rnd() * 6);
      const gasto = visitas * between(900, 2400);
      const nivel = visitas >= 7 ? 'vip' : visitas >= 3 ? 'frecuente' : 'nuevo';
      const mm = pad(1 + Math.floor(rnd() * 12)), dd = pad(1 + Math.floor(rnd() * 28));
      return { id: 'c' + (i + 1), nombre: n, tel: '55' + String(10000000 + Math.floor(rnd() * 89999999)), email: n.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /g, '.') + '@correo.mx', nivel, visitas, gasto: round(gasto), puntos: round(gasto / 10), cumple: mm + '-' + dd, sucFav: rnd() < 0.7 ? 's1' : 's2', notas: i === 0 ? 'Prefiere piso 2. Alérgica a la nuez.' : (i === 4 ? 'Siempre pide mezcal. Cumpleaños en grupo.' : ''), amigos: [] };
    });
    // amigos: los primeros 6 son el grupo de Mariana
    const grupo = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    grupo.forEach(id => { db.clientes.find(c => c.id === id).amigos = grupo.filter(x => x !== id); });
    db.clientes.slice(6).forEach((c, i) => { c.amigos = [db.clientes[6 + ((i + 1) % 20)].id, db.clientes[6 + ((i + 2) % 20)].id].filter(x => x !== c.id); });
    // ajustes del cliente protagonista
    const mar = db.clientes[0]; mar.nivel = 'vip'; mar.visitas = 7; mar.gasto = 10360; mar.puntos = 2140; mar.cumple = '10-21';

    // personal por sucursal
    db.personal = [];
    db.sucursales.forEach((s, si) => {
      PERSONAL_BASE.forEach(([n, rol], i) => {
        const nombre = si === 0 ? n : n.split(' ')[0] + ' ' + ['Ávila', 'Cano', 'Duran', 'Escobar', 'Fierro', 'Galván', 'Heredia', 'Ibáñez', 'Juárez', 'Lara', 'Márquez', 'Nava'][i];
        db.personal.push({ id: 'e' + s.id + '_' + i, suc: s.id, nombre, rol, turno: rol === 'compras' || rol === 'gerente' ? 'Administrativo 12-20' : 'Noche 18-03', tel: '55' + String(20000000 + Math.floor(rnd() * 79999999)), activo: true, ingreso: 2023 + Math.floor(rnd() * 3), checkin: (rol !== 'compras' && rnd() < 0.85) ? (17 + Math.floor(rnd() * 2)) + ':' + pad(Math.floor(rnd() * 60)) : null, propinas: 0 });
      });
    });
    db.personal.push({ id: 'socio1', suc: 's1', nombre: 'Socio (dirección)', rol: 'socio', turno: '—', tel: '', activo: true, checkin: null, propinas: 0 });

    // inventario por sucursal: existencias de botellas/cerveza/comida (unidades) y mínimos
    db.inventario = {};
    db.sucursales.forEach(s => {
      db.inventario[s.id] = {};
      db.productos.forEach(p => {
        if (p.cat === 'trago' || p.cat === 'extra' && p.id === 'x_cancion') return;
        const base = p.cat === 'botella' ? 18 : p.cat === 'cerveza' ? 240 : p.cat === 'comida' ? 40 : 30;
        db.inventario[s.id][p.id] = { existencia: round(base * s.factor * between(0.6, 1.4)), minimo: round(base * 0.35), abiertas: p.cat === 'botella' ? Math.floor(rnd() * 3) : 0 };
      });
      db.inventario[s.id]['b_aperol'].existencia = 9; // para la alerta
    });

    // facturas de proveedor (últimos 60 días)
    db.facturas = [];
    for (let i = 0; i < 26; i++) {
      const prov = pick(db.proveedores); const s = pick(db.sucursales);
      const d = new Date(); d.setDate(d.getDate() - Math.floor(rnd() * 60));
      const cands = db.productos.filter(p => (prov.cat.startsWith('Licores') && p.cat === 'botella') || (prov.cat.startsWith('Cerveza') && p.cat === 'cerveza') || (prov.cat === 'Alimentos' && p.cat === 'comida') || (prov.cat === 'Merchandising' && p.id === 'x_sombrero'));
      const conceptos = []; const nC = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < nC && cands.length; k++) { const p = pick(cands); const cant = p.cat === 'botella' ? 6 * (1 + Math.floor(rnd() * 4)) : 24 * (1 + Math.floor(rnd() * 3)); const unit = round(p.costo * between(0.92, 1.12), 2); conceptos.push({ prodId: p.id, desc: p.nombre, cant, unit, importe: round(cant * unit, 2) }); }
      const sub = conceptos.reduce((a, c) => a + c.importe, 0);
      db.facturas.push({ id: 'f' + (i + 1), provId: prov.id, suc: s.id, fecha: fechaISO(d), folio: 'A-' + (2400 + i * 7), uuid: (crypto.randomUUID ? crypto.randomUUID() : 'uuid-' + i).toUpperCase(), subtotal: round(sub, 2), iva: round(sub * 0.16, 2), total: round(sub * 1.16, 2), conceptos, estado: rnd() < 0.7 ? 'pagada' : 'por pagar', origen: 'xml' });
    }
    db.facturas.sort((a, b) => a.fecha < b.fecha ? 1 : -1);

    // historial de ventas por día (120 días) y por hora
    db.ventasHist = [];
    const hoyD = new Date(); hoyD.setHours(0, 0, 0, 0);
    const wk = { 0: 0.30, 1: 0.08, 2: 0.14, 3: 0.36, 4: 0.70, 5: 0.95, 6: 1.0 };
    const mes = { 0: 0.80, 1: 1.10, 2: 0.95, 3: 0.92, 4: 1.00, 5: 0.90, 6: 0.88, 7: 0.95, 8: 1.05, 9: 0.98, 10: 1.12, 11: 1.32 };
    for (let i = 365; i >= 1; i--) {
      const d = new Date(hoyD); d.setDate(d.getDate() - i);
      db.sucursales.forEach(s => {
        const f = wk[d.getDay()] * mes[d.getMonth()] * s.factor * between(0.88, 1.12);
        const personas = round(s.aforo * 0.74 * f);
        const cover = round(personas * 0.55 * PRECIOS.cover);
        const mesasOc = Math.min(db.mesas.filter(m => m.suc === s.id).length, round(db.mesas.filter(m => m.suc === s.id).length * Math.min(1, f * 1.05)));
        const ventaMesas = round(mesasOc * between(4600, 6400));
        const ventaBarra = round(personas * between(150, 205));
        const ventaCocina = round(personas * between(60, 95));
        const merma = round(between(1.1, 2.6) + (s.id === 's2' && d.getDay() === 6 ? 0.9 : 0), 1);
        db.ventasHist.push({ fecha: fechaISO(d), dow: d.getDay(), mes: d.getMonth(), suc: s.id, personas, cover, ventaMesas, ventaBarra, ventaCocina, total: cover + ventaMesas + ventaBarra + ventaCocina, mesasOc, merma, costoBarra: round(between(22, 27), 1) });
      });
    }
    db.perfilHora = [[18, 0.03], [19, 0.06], [20, 0.10], [21, 0.15], [22, 0.19], [23, 0.21], [0, 0.16], [1, 0.08], [2, 0.02]];

    // la noche de hoy: reservas, accesos, pedidos, pagos
    db.reservas = []; db.accesos = []; db.pedidos = []; db.pagos = []; db.canciones = []; db.mermas = []; db.cortes = []; db.bitacora = [];
    const H = hoy();
    const mesasS1 = db.mesas.filter(m => m.suc === 's1'), mesasS2 = db.mesas.filter(m => m.suc === 's2');
    // Mariana: mesa 14 (VIP piso 1), grupo de 6, preorden, anticipo pagado, aún no llega
    const mesa14 = mesasS1.find(m => m.num === 14);
    db.reservas.push({ id: 'r_mar', suc: 's1', fecha: H, hora: '23:00', tipo: 'vip', mesaId: mesa14.id, clienteId: 'c1', nombre: 'Mariana Reyes', personas: 8, estado: 'confirmada', anticipo: mesa14.anticipo, pagado: mesa14.anticipo, metodo: 'applepay', creado: H + 'T12:40', origen: 'app',
      grupo: [{ clienteId: 'c1', parte: 2000, pagado: 2000 }, { clienteId: 'c2', parte: 1000, pagado: 1000 }, { clienteId: 'c3', parte: 1000, pagado: 1000 }, { clienteId: 'c4', parte: 1000, pagado: 0 }, { clienteId: 'c5', parte: 1000, pagado: 1000 }],
      preorden: [{ prodId: 'b_tequila_rep', cant: 1 }, { prodId: 'b_champ', cant: 1 }], motivo: 'Cumpleaños de Sofía', notas: 'Pastel a las 12' });
    // resto de la noche
    const nombresRes = db.clientes.slice(6);
    const ocupar = (lista, sucId, cuantasSentadas, cuantasConf, cuantasNo) => {
      let idx = 0; const libres = lista.filter(m => m.id !== 'm14').filter((m, i) => i % 3 !== 1); // deja mesas libres en cada piso
      const estados = [].concat(Array(cuantasSentadas).fill('sentada'), Array(cuantasConf).fill('confirmada'), Array(cuantasNo).fill('noshow'));
      estados.forEach((est, k) => {
        const m = libres[k]; if (!m) return; const c = nombresRes[idx++ % nombresRes.length];
        const hora = (20 + Math.floor(rnd() * 4)) + ':' + pad(Math.floor(rnd() * 60));
        const r = { id: uid('r'), suc: sucId, fecha: H, hora, tipo: m.tipo, mesaId: m.id, clienteId: c.id, nombre: c.nombre, personas: Math.min(m.cap, 4 + Math.floor(rnd() * (m.cap - 3))), estado: est, anticipo: m.anticipo, pagado: m.anticipo, metodo: pick(['tarjeta', 'applepay', 'spei', 'efectivo']), creado: H + 'T' + pad(10 + Math.floor(rnd() * 8)) + ':' + pad(Math.floor(rnd() * 60)), origen: rnd() < 0.6 ? 'app' : 'hostess', grupo: [], preorden: [] };
        if (est === 'sentada') { r.entrada = hora; db.accesos.push({ id: uid('a'), suc: sucId, fecha: H, hora, reservaId: r.id, tipo: r.tipo, nombre: r.nombre, personas: r.personas, resultado: 'ok', puerta: 'Escáner 1' }); }
        db.reservas.push(r);
      });
    };
    ocupar(mesasS1, 's1', 12, 5, 2);
    ocupar(mesasS2, 's2', 8, 3, 1);
    // covers y barra (accesos sin mesa)
    const nCov = { s1: 470, s2: 250 };
    db.sucursales.forEach(s => { for (let i = 0; i < nCov[s.id]; i++) { const c = pick(db.clientes.slice(6)); const tipo = rnd() < 0.72 ? 'cover' : (rnd() < 0.7 ? 'barra' : 'clientevip'); db.accesos.push({ id: uid('a'), suc: s.id, fecha: H, hora: (19 + Math.floor(rnd() * 5)) % 24 + ':' + pad(Math.floor(rnd() * 60)), tipo, nombre: c.nombre, personas: 1, resultado: rnd() < 0.985 ? 'ok' : 'usado', puerta: 'Escáner ' + (1 + Math.floor(rnd() * 2)) }); if (tipo !== 'clientevip') db.pagos.push({ id: uid('pg'), suc: s.id, fecha: H, hora: '21:00', clienteId: c.id, concepto: tipo === 'cover' ? 'Cover' : 'Acceso barra', monto: tipo === 'cover' ? PRECIOS.cover : PRECIOS.barra, metodo: pick(['tarjeta', 'applepay', 'efectivo', 'spei']), estado: 'aprobado', propina: 0 }); } });
    // pedidos de las mesas sentadas
    const meserosPor = { s1: db.personal.filter(e => e.suc === 's1' && e.rol === 'mesero'), s2: db.personal.filter(e => e.suc === 's2' && e.rol === 'mesero') };
    db.reservas.filter(r => r.estado === 'sentada').forEach(r => {
      const n = 4 + Math.floor(rnd() * 4);
      for (let k = 0; k < n; k++) {
        const items = []; const nI = 1 + Math.floor(rnd() * 3);
        for (let j = 0; j < nI; j++) { const p = rnd() < 0.35 ? pick(db.productos.filter(p => p.cat === 'botella')) : pick(db.productos.filter(p => p.cat !== 'extra' && p.cat !== 'botella')); items.push({ prodId: p.id, cant: p.cat === 'botella' ? 1 : 1 + Math.floor(rnd() * 3), precio: p.precio, porClienteId: r.clienteId }); }
        const estado = k < n - 1 ? 'entregado' : pick(['entregado', 'preparando', 'nuevo']);
        db.pedidos.push({ id: uid('o'), suc: r.suc, mesaId: r.mesaId, reservaId: r.id, items, estado, origen: rnd() < 0.5 ? 'app' : 'mesero', meseroId: pick(meserosPor[r.suc]).id, hora: (21 + Math.floor(rnd() * 3)) + ':' + pad(Math.floor(rnd() * 60)), creado: Date.now() - Math.floor(rnd() * 3.6e6) });
      }
      db.pagos.push({ id: uid('pg'), suc: r.suc, fecha: H, hora: r.hora, clienteId: r.clienteId, reservaId: r.id, concepto: 'Anticipo mesa ' + db.mesas.find(m => m.id === r.mesaId).num, monto: r.anticipo, metodo: r.metodo, estado: r.metodo === 'efectivo' ? (rnd() < 0.7 ? 'confirmado' : 'pendiente_caja') : 'aprobado', propina: 0 });
      if (rnd() < 0.6) db.pagos.push({ id: uid('pg'), suc: r.suc, fecha: H, hora: (22 + Math.floor(rnd() * 2)) + ':' + pad(Math.floor(rnd() * 60)), clienteId: r.clienteId, reservaId: r.id, concepto: 'Cuenta mesa ' + db.mesas.find(m => m.id === r.mesaId).num + ' (parcial)', monto: round(between(1500, 6000)), metodo: pick(['tarjeta', 'applepay']), estado: 'aprobado', propina: round(between(150, 700)) });
    });
    db.pagos.push({ id: uid('pg'), suc: 's1', fecha: H, hora: '12:41', clienteId: 'c1', reservaId: 'r_mar', concepto: 'Anticipo mesa 14 (grupo)', monto: 5000, metodo: 'applepay', estado: 'aprobado', propina: 0 });
    // canciones pedidas
    db.canciones.push({ id: uid('sg'), suc: 's1', mesaId: 'm3', cancion: 'Amor eterno', dedicatoria: 'Para Sofía, de todos nosotros', monto: 500, estado: 'en cola', hora: '22:48' });
    db.canciones.push({ id: uid('sg'), suc: 's1', mesaId: 'm7', cancion: 'El Rey', dedicatoria: '', monto: 500, estado: 'cantada', hora: '22:10' });
    // conteo de cierre de ayer (para la merma)
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    db.sucursales.forEach(s => {
      const items = db.productos.filter(p => p.cat === 'botella').map(p => { const teo = round(between(6, 16), 1); const dif = p.id === 'b_aperol' && s.id === 's2' ? -0.9 : round(between(-0.7, 0.1), 1); return { prodId: p.id, teorico: teo, fisico: round(teo + dif, 1) }; });
      db.mermas.push({ id: uid('mm'), suc: s.id, fecha: fechaISO(ayer), turno: 'Noche', items, responsable: db.personal.find(e => e.suc === s.id && e.rol === 'barra').id });
    });
    db.bitacora.push({ t: Date.now(), quien: 'sistema', que: 'Datos de demostración generados' });
    return db;
  }


  // ───────────────────────── plano del local (estilo plano arquitectónico oscuro) ─────────────────────────
  function estadoMesa(m) {
    const r = db.reservas.find(x => x.mesaId === m.id && x.fecha === hoy() && ['confirmada', 'sentada', 'pendiente'].includes(x.estado));
    if (!r) return { estado: 'libre', r: null };
    return { estado: r.estado === 'sentada' ? 'ocupada' : 'apartada', r };
  }
  const PLANO_COLORES = { libre: '#9BD35E', apartada: '#F28B2B', ocupada: '#4A8AE0', vip: '#F3F3F3', sel: '#C25B32' };
  function planoSVG(sucId, opts = {}) {
    const W = 360, FH = 300, GAP = 14; const s = db.sucursales.find(x => x.id === sucId); const pisos = s ? s.pisos : 1;
    const orden = []; for (let p = pisos; p >= 1; p--) orden.push(p); // planta alta arriba
    const HF = pisos * FH + (pisos - 1) * GAP; const H = HF + 30;
    const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let out = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:block;width:100%;height:auto;background:#0A0A0A;border-radius:14px">`;
    const F = 'Montserrat, Avenir Next, sans-serif', FN = 'Inter Tight, Montserrat, sans-serif';
    const persona = (x, y) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#8A8A8A"/><path d="M${x - 3} ${y + 9} v-4a3 3 0 0 1 6 0v4z" fill="#8A8A8A"/>`;
    const palma = (x, y, sc = 1) => { let d = ''; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; const l = 14 * sc; d += `<path d="M${x} ${y} q ${Math.cos(a) * l * 0.4} ${Math.sin(a) * l * 0.4 - 4 * sc} ${Math.cos(a) * l} ${Math.sin(a) * l}" stroke="#3E8E5A" stroke-width="${1.6 * sc}" fill="none" stroke-linecap="round"/>`; } return `<g opacity="0.95">${d}<circle cx="${x}" cy="${y}" r="${2 * sc}" fill="#2F6B45"/></g>`; };
    const libre = (mesas, x, y, w, h) => !mesas.some(m => { const cx = m.x * 3.6, cy = m.y * 3.0, rw = (m.w || 9) * 1.8 + 8, rh = (m.h || 9) * 1.5 + 8; return cx + rw > x && cx - rw < x + w && cy + rh > y && cy - rh < y + h; });
    orden.forEach((piso, idx) => {
      const oy = idx * (FH + GAP); const mesas = db.mesas.filter(m => m.suc === sucId && m.piso === piso);
      out += `<g transform="translate(0,${oy})">`;
      out += `<rect x="6" y="6" width="${W - 12}" height="${FH - 12}" rx="10" fill="#141414" stroke="#3A3A3A" stroke-width="3"/>`;
      // muros interiores y áreas fijas
      out += `<rect x="14" y="14" width="56" height="38" rx="3" fill="#1C1C1C" stroke="#333" stroke-width="1.5"/>${persona(32, 26)}${persona(52, 26)}<text x="42" y="47" text-anchor="middle" font-family="${F}" font-size="5.5" fill="#777" letter-spacing="1.5">BAÑOS</text>`;
      if (piso === 1) {
        out += `<rect x="118" y="12" width="124" height="34" rx="4" fill="#1E1E1E" stroke="#4A4A4A" stroke-width="1.5"/><text x="180" y="34" text-anchor="middle" font-family="${F}" font-size="13" font-style="italic" font-weight="700" fill="#F2F2F2" letter-spacing="3">BAR</text><path d="M126 22 q6 -4 12 0 M222 22 q6 -4 12 0" stroke="#888" stroke-width="1.2" fill="none"/>`;
        out += `<rect x="126" y="84" width="108" height="46" rx="6" fill="#171717" stroke="#3A3A3A" stroke-width="1.2" stroke-dasharray="4 3"/><text x="180" y="110" text-anchor="middle" font-family="${F}" font-size="7" fill="#8A8A8A" letter-spacing="2">PISTA · CORO</text>`;
      } else {
        out += `<rect x="252" y="14" width="90" height="32" rx="4" fill="#1E1E1E" stroke="#4A4A4A" stroke-width="1.5"/><text x="297" y="35" text-anchor="middle" font-family="${F}" font-size="12" font-style="italic" font-weight="700" fill="#F2F2F2" letter-spacing="3">BAR</text>`;
        out += `<rect x="150" y="12" width="60" height="26" rx="3" fill="#1C1C1C" stroke="#333" stroke-width="1.2"/><path d="M156 32 h10 v-5 h10 v-5 h10 v-5 h10 v-5 h10" stroke="#777" stroke-width="1.2" fill="none"/><text x="180" y="45" text-anchor="middle" font-family="${F}" font-size="5.5" fill="#777" letter-spacing="1.5">ESCALERA</text>`;
      }
      // entrada: primer lugar libre
      const candE = piso === 1 ? [[14, 262], [300, 262], [262, 16], [80, 262], [150, 264]] : [[14, 262], [300, 262], [80, 14], [228, 262], [150, 264]];
      const e = candE.find(([x, y]) => libre(mesas, x - 6, y - 6, 60, 36)) || candE[2];
      out += `<rect x="${e[0]}" y="${e[1]}" width="48" height="24" rx="3" fill="#1F1F1F" stroke="#4A4A4A" stroke-width="1.5"/><text x="${e[0] + 24}" y="${e[1] + 15}" text-anchor="middle" font-family="${F}" font-size="6" fill="#F2F2F2" letter-spacing="1.5">${piso === 1 ? 'ENTRADA' : 'ACCESO'}</text>`;
      // plantas en los huecos
      [[344, 62], [98, 272], [22, 190], [200, 60], [70, 100], [330, 150], [262, 272]].filter(([x, y]) => libre(mesas, x - 14, y - 14, 28, 28) && !(x > e[0] - 20 && x < e[0] + 70 && y > e[1] - 20 && y < e[1] + 44)).slice(0, 3).forEach(([x, y]) => { out += palma(x, y, 1); });
      // etiqueta de planta
      const lbl = pisos > 1 ? (piso === 2 ? 'planta alta · balcón y salones' : 'planta baja · bar y escenario') : (s.nombre + ' · bar y escenario');
      out += `<text x="${W - 14}" y="${FH - 16}" text-anchor="end" font-family="${F}" font-size="7.5" font-style="italic" fill="#BDBDBD">${esc(lbl)}</text>`;
      // mesas
      mesas.forEach(m => {
        const { estado, r } = estadoMesa(m); const sel = opts.selId === m.id;
        const fill = sel ? PLANO_COLORES.sel : estado === 'ocupada' ? PLANO_COLORES.ocupada : estado === 'apartada' ? PLANO_COLORES.apartada : (m.tipo === 'vip' ? PLANO_COLORES.vip : PLANO_COLORES.libre);
        const txt = (sel || estado === 'ocupada') ? '#FFFFFF' : '#111111';
        const stroke = sel ? '#FFFFFF' : m.tipo === 'vip' ? '#C99A2E' : 'rgba(0,0,0,0)';
        const cx = m.x * 3.6, cy = m.y * 3.0; const attrs = opts.interactivo ? ` data-mesa="${m.id}" style="cursor:pointer"` : '';
        if (m.salon) { const w = m.w * 3.6, h = m.h * 3.0; out += `<g${attrs}><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="2"/><text x="${cx}" y="${cy - 2}" text-anchor="middle" font-family="${FN}" font-size="11" font-weight="800" fill="${txt}">${m.num}</text><text x="${cx}" y="${cy + 9}" text-anchor="middle" font-family="${F}" font-size="5.5" fill="${txt}" letter-spacing=".5">${esc(m.salon.replace(/^Sal[oó]n /i, '').toUpperCase())}</text></g>`; }
        else { const rr = m.tipo === 'vip' ? 17 : 15; out += `<g${attrs}><circle cx="${cx}" cy="${cy}" r="${rr}" fill="${fill}" stroke="${stroke}" stroke-width="2"/><text x="${cx}" y="${cy + (opts.nombres && r ? 1 : 4)}" text-anchor="middle" font-family="${FN}" font-size="11" font-weight="800" fill="${txt}">${m.num}</text>${opts.nombres && r ? `<text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="${F}" font-size="5.2" fill="${txt}">${esc(r.nombre.split(' ')[0])}</text>` : ''}</g>`; }
      });
      out += '</g>';
    });
    out += `<image xlink:href="../shared/img/logo_dark.png" href="../shared/img/logo_dark.png" x="${W / 2 - 52}" y="${HF + 7}" width="104" height="20"/>`;
    return out + '</svg>';
  }
  const PLANO_LEYENDA = [['libre', 'Libre'], ['apartada', 'Apartada'], ['ocupada', 'Ocupada'], ['vip', 'VIP libre'], ['sel', 'Tu selección']];

  // ───────────────────────── almacén ─────────────────────────
  let db = null;
  const subs = new Set();
  let bc = null; try { bc = new BroadcastChannel(CANAL); } catch (e) { bc = null; }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { db = JSON.parse(raw); if (db && db.version === 1) return db; } } catch (e) { }
    db = semilla(); persist(false); return db;
  }
  function persist(notify = true) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn('No se pudo guardar', e); }
    if (notify) { if (bc) bc.postMessage({ t: Date.now() }); subs.forEach(fn => { try { fn('local'); } catch (e) { } }); }
  }
  function reload() { try { const raw = localStorage.getItem(KEY); if (raw) db = JSON.parse(raw); } catch (e) { } subs.forEach(fn => { try { fn('remoto'); } catch (e) { } }); }
  if (bc) bc.onmessage = () => reload();
  window.addEventListener('storage', (e) => { if (e.key === KEY) reload(); });
  function reset() { localStorage.removeItem(KEY); db = semilla(); persist(true); }
  function log(quien, que) { db.bitacora.unshift({ t: Date.now(), quien, que }); if (db.bitacora.length > 300) db.bitacora.length = 300; }

  // ───────────────────────── QR firmado ─────────────────────────
  const enc = new TextEncoder();
  let keyP = null;
  function key() { if (!keyP) { keyP = crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); } return keyP; }
  const b64u = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))));
  async function firmar(txt) { const k = await key(); const sig = await crypto.subtle.sign('HMAC', k, enc.encode(txt)); return Array.from(new Uint8Array(sig)).slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join(''); }
  async function tokenQR(r) {
    const mesa = r.mesaId ? db.mesas.find(m => m.id === r.mesaId) : null;
    const payload = { v: 1, id: r.id, t: r.tipo, s: r.suc, f: r.fecha, m: mesa ? mesa.num : null, p: mesa ? mesa.piso : null, n: r.nombre, q: r.personas, pg: r.pagado >= (r.anticipo || 0) ? 1 : 0 };
    const body = b64u(JSON.stringify(payload));
    return 'CC1.' + body + '.' + await firmar(body);
  }
  async function verificarQR(txt) {
    try {
      if (!txt || !txt.startsWith('CC1.')) return { ok: false, motivo: 'No es un QR de Canta Corazón' };
      const [, body, sig] = txt.split('.');
      const esperada = await firmar(body);
      if (sig !== esperada) return { ok: false, motivo: 'Firma inválida: QR alterado o falso' };
      const p = JSON.parse(unb64u(body));
      return { ok: true, payload: p };
    } catch (e) { return { ok: false, motivo: 'QR ilegible' }; }
  }

  // ───────────────────────── métricas ─────────────────────────
  const M = {};
  const sucFilter = (suc) => (x) => !suc || suc === 'all' || x.suc === suc;
  M.noche = function (suc) {
    const res = db.reservas.filter(sucFilter(suc)).filter(r => r.fecha === hoy());
    const acc = db.accesos.filter(sucFilter(suc)).filter(a => a.fecha === hoy() && a.resultado === 'ok');
    const ped = db.pedidos.filter(sucFilter(suc));
    const ventaMesas = ped.filter(p => p.estado !== 'cancelado').reduce((a, p) => a + p.items.reduce((b, i) => b + i.precio * i.cant, 0), 0) + res.reduce((a, r) => a + (r.pagado || 0), 0);
    const cover = db.pagos.filter(sucFilter(suc)).filter(p => p.fecha === hoy() && (p.concepto === 'Cover' || p.concepto === 'Acceso barra')).reduce((a, p) => a + p.monto, 0);
    const personas = acc.reduce((a, x) => a + (x.personas || 1), 0);
    const mesasTot = db.mesas.filter(sucFilter(suc)).length;
    const sentadas = res.filter(r => r.estado === 'sentada').length;
    const confirmadas = res.filter(r => r.estado === 'confirmada').length;
    const noshow = res.filter(r => r.estado === 'noshow').length;
    const aforo = db.sucursales.filter(s => !suc || suc === 'all' || s.id === suc).reduce((a, s) => a + s.aforo, 0);
    const costo = ped.filter(p => p.estado !== 'cancelado').reduce((a, p) => a + p.items.reduce((b, i) => { const pr = db.productos.find(x => x.id === i.prodId); return b + (pr ? pr.costo * i.cant : 0); }, 0), 0);
    const ventaBarra = ped.filter(p => p.estado !== 'cancelado').reduce((a, p) => a + p.items.reduce((b, i) => { const pr = db.productos.find(x => x.id === i.prodId); return b + (pr && (pr.cat === 'botella' || pr.cat === 'trago' || pr.cat === 'cerveza') ? i.precio * i.cant : 0); }, 0), 0);
    const total = ventaMesas + cover;
    const ticket = personas ? total / personas : 0;
    const vipAcc = acc.filter(a => a.tipo === 'clientevip' || a.tipo === 'vip').length;
    return { ventaMesas, cover, total, personas, aforo, ocupPct: aforo ? personas / aforo * 100 : 0, mesasTot, sentadas, confirmadas, noshow, mesasPct: mesasTot ? (sentadas + confirmadas) / mesasTot * 100 : 0, ticket, costoBarraPct: ventaBarra ? costo / ventaBarra * 100 : 0, vipPct: acc.length ? vipAcc / acc.length * 100 : 0, pedidos: ped.length, pedidosAbiertos: ped.filter(p => p.estado === 'nuevo' || p.estado === 'preparando').length };
  };
  M.hist = function (suc, dias = 90) { const corte = new Date(); corte.setDate(corte.getDate() - dias); const c = fechaISO(corte); return db.ventasHist.filter(sucFilter(suc)).filter(v => v.fecha >= c); };
  M.porDiaSemana = function (suc, dias = 90) { const out = DIAS.map((d, i) => ({ dia: d, dow: i, total: 0, n: 0 })); M.hist(suc, dias).forEach(v => { out[v.dow].total += v.total; out[v.dow].n++; }); return out.map(o => ({ ...o, prom: o.n ? o.total / o.n : 0 })); };
  M.porMes = function (suc) { const out = MESES.map((m, i) => ({ mes: m, i, total: 0 })); db.ventasHist.filter(sucFilter(suc)).forEach(v => { out[v.mes].total += v.total; }); return out; };
  M.porHora = function (suc) { const n = M.noche(suc); return db.perfilHora.map(([h, f]) => ({ hora: h, venta: Math.round(n.total * f), programado: Math.round(n.total * f * between(0.92, 1.08)) })); };
  M.topProductos = function (suc, n = 6) { const acc = {}; db.pedidos.filter(sucFilter(suc)).filter(p => p.estado !== 'cancelado').forEach(p => p.items.forEach(i => { acc[i.prodId] = acc[i.prodId] || { prodId: i.prodId, cant: 0, venta: 0 }; acc[i.prodId].cant += i.cant; acc[i.prodId].venta += i.cant * i.precio; })); return Object.values(acc).map(x => ({ ...x, nombre: (db.productos.find(p => p.id === x.prodId) || {}).nombre })).sort((a, b) => b.venta - a.venta).slice(0, n); };
  M.ultimoSabado = function (sucId) { const h = db.ventasHist.filter(v => v.suc === sucId && v.dow === 6); return h.length ? h[h.length - 1] : null; };
  M.comparativo = function () { return db.sucursales.map(s => { const n = M.noche(s.id); const sab = M.ultimoSabado(s.id); const prev = sab ? sab.total : 0; return { suc: s, hoy: n.total, prev, delta: prev ? (n.total - prev) / prev * 100 : 0, personas: n.personas, mesasPct: n.mesasPct }; }); };
  M.mejorDia = function (suc) { const d = M.porDiaSemana(suc, 90).slice().sort((a, b) => b.prom - a.prom); return d[0]; };
  M.mejorMes = function (suc) { const m = M.porMes(suc).slice().sort((a, b) => b.total - a.total); return m[0]; };
  M.mermaUltima = function (suc) { const ms = db.mermas.filter(sucFilter(suc)); if (!ms.length) return { pct: 0, items: [] }; const items = []; let teo = 0, dif = 0; ms.forEach(m => m.items.forEach(i => { teo += i.teorico; dif += (i.teorico - i.fisico); items.push({ ...i, suc: m.suc, dif: round(i.fisico - i.teorico, 1), nombre: (db.productos.find(p => p.id === i.prodId) || {}).nombre }); })); return { pct: teo ? dif / teo * 100 : 0, items: items.sort((a, b) => a.dif - b.dif) }; };
  // inventario teórico: existencia menos lo vendido hoy (botellas enteras y ml de recetas)
  M.teoricoBotellas = function (suc) {
    const out = {}; const inv = db.inventario[suc] || {};
    db.productos.filter(p => p.cat === 'botella').forEach(p => { out[p.id] = { prodId: p.id, nombre: p.nombre, existencia: inv[p.id] ? inv[p.id].existencia : 0, abiertas: inv[p.id] ? inv[p.id].abiertas : 0, vendidasHoy: 0, mlHoy: 0, minimo: inv[p.id] ? inv[p.id].minimo : 0 }; });
    db.pedidos.filter(p => p.suc === suc && p.estado !== 'cancelado').forEach(p => p.items.forEach(i => { const pr = db.productos.find(x => x.id === i.prodId); if (!pr) return; if (pr.cat === 'botella') out[pr.id].vendidasHoy += i.cant; if (pr.cat === 'trago' && pr.receta) pr.receta.forEach(([base, ml]) => { const bid = BASES[base]; if (out[bid]) out[bid].mlHoy += ml * i.cant; }); }));
    return Object.values(out).map(o => ({ ...o, teorico: round(o.existencia - o.vendidasHoy - o.mlHoy / 750, 1), alerta: (o.existencia - o.vendidasHoy) <= o.minimo }));
  };
  M.cajaHoy = function (suc) { const pagos = db.pagos.filter(sucFilter(suc)).filter(p => p.fecha === hoy()); const porMetodo = {}; pagos.forEach(p => { porMetodo[p.metodo] = porMetodo[p.metodo] || { metodo: p.metodo, monto: 0, n: 0, pendientes: 0 }; porMetodo[p.metodo].monto += p.monto; porMetodo[p.metodo].n++; if (p.estado === 'pendiente_caja') porMetodo[p.metodo].pendientes += p.monto; }); return { pagos, porMetodo: Object.values(porMetodo), total: pagos.reduce((a, p) => a + p.monto, 0), pendientes: pagos.filter(p => p.estado === 'pendiente_caja') }; };
  M.cuentaMesa = function (reservaId) { const r = db.reservas.find(x => x.id === reservaId); if (!r) return null; const ped = db.pedidos.filter(p => p.reservaId === reservaId && p.estado !== 'cancelado'); const items = []; ped.forEach(p => p.items.forEach(i => items.push({ ...i, pedidoId: p.id, estado: p.estado, hora: p.hora, nombre: (db.productos.find(x => x.id === i.prodId) || {}).nombre }))); const consumo = items.reduce((a, i) => a + i.precio * i.cant, 0); const pre = (r.preorden || []).reduce((a, i) => { const p = db.productos.find(x => x.id === i.prodId); return a + (p ? p.precio * i.cant : 0); }, 0); const pagosMesa = db.pagos.filter(p => p.reservaId === reservaId && (p.estado === 'aprobado' || p.estado === 'confirmado')).reduce((a, p) => a + p.monto, 0); return { reserva: r, items, consumo, preorden: pre, anticipo: r.anticipo || 0, total: consumo + pre, pagado: pagosMesa, saldo: Math.max(0, consumo + pre - pagosMesa) }; };

  // asistente de demo: respuestas calculadas por reglas
  function asistente(pregunta) {
    const q = (pregunta || '').toLowerCase();
    const s1 = M.noche('s1'), s2 = M.noche('s2'), all = M.noche('all');
    const n1 = db.sucursales[0].nombre, n2 = db.sucursales[1].nombre;
    const fmt = (n) => money(n);
    if (/margen|costo de barra/.test(q)) { const a = 100 - s1.costoBarraPct, b = 100 - s2.costoBarraPct; const mejor = a >= b ? n1 : n2; return `Margen de barra esta noche: ${n1} ${pct(a)} y ${n2} ${pct(b)}. La mejor es ${mejor}. La diferencia viene sobre todo del costo de lo servido; te sugiero revisar las cortesías y la merma de ${a >= b ? n2 : n1}. Fuente: pedidos y recetas de hoy.`; }
    if (/merma/.test(q)) { const m1 = M.mermaUltima('s1'), m2 = M.mermaUltima('s2'); const peor = m2.items[0] || m1.items[0]; return `Merma del último cierre: ${n1} ${pct(m1.pct)} y ${n2} ${pct(m2.pct)} del teórico. El producto con mayor diferencia es ${peor ? peor.nombre + ' (' + peor.dif + ' botellas en ' + db.sucursales.find(s => s.id === peor.suc).nombre + ')' : 'ninguno'}. Fuente: conteo de cierre contra teórico de recetas.`; }
    if (/mejor d[ií]a|qu[eé] d[ií]a/.test(q)) { const d = M.mejorDia('all'); const arr = M.porDiaSemana('all', 90).slice().sort((a, b) => b.prom - a.prom); return `El mejor día es ${d.dia} con un promedio de ${fmt(d.prom)} por noche en los últimos 90 días, seguido de ${arr[1].dia} (${fmt(arr[1].prom)}). El más flojo es ${arr[arr.length - 1].dia}. Fuente: ventas por día, ambas sucursales.`; }
    if (/hora/.test(q)) { const h = M.porHora('all').slice().sort((a, b) => b.venta - a.venta)[0]; return `El pico de venta es a las ${h.hora}:00, con cerca de ${fmt(h.venta)} de la noche. El cover se concentra entre las 21:00 y las 23:00. Fuente: perfil por hora de la noche de hoy.`; }
    if (/temporada|mes/.test(q)) { const m = M.mejorMes('all'); const arr = M.porMes('all').filter(x => x.total > 0).sort((a, b) => b.total - a.total); return `La mejor temporada es ${m.mes} (${fmt(m.total)} en el periodo cargado); la más baja con datos es ${arr[arr.length - 1].mes} (${fmt(arr[arr.length - 1].total)}). Fuente: histórico de ventas por mes.`; }
    if (/vendi[oó] m[aá]s|qu[eé] sucursal|comparativ|sucursal/.test(q)) { const c = M.comparativo(); const top = c.slice().sort((a, b) => b.hoy - a.hoy)[0]; return `Esta noche ${top.suc.nombre} lleva ${fmt(top.hoy)} (${top.delta >= 0 ? '+' : ''}${top.delta.toFixed(1)}% contra el mismo día de la semana pasada). ${c.map(x => `${x.suc.nombre}: ${fmt(x.hoy)}, ${x.personas} personas, mesas al ${x.mesasPct.toFixed(0)}%`).join('. ')}. Fuente: accesos, pagos y pedidos de hoy.`; }
    if (/vip/.test(q)) { const vips = db.clientes.filter(c => c.nivel === 'vip'); const ausentes = vips.filter(c => !db.accesos.some(a => a.fecha === hoy() && a.nombre === c.nombre) && !db.reservas.some(r => r.fecha === hoy() && r.clienteId === c.id)); return `Tienes ${vips.length} clientes VIP. ${all.vipPct.toFixed(0)}% de los accesos de hoy son VIP. ${ausentes.length} VIP no tienen reserva ni acceso esta noche${ausentes.length ? ': ' + ausentes.slice(0, 4).map(c => c.nombre.split(' ')[0]).join(', ') : ''}. ¿Quieres que prepare una promoción para ellos?`; }
    if (/producto|top|m[aá]s se vende|botella/.test(q)) { const t = M.topProductos('all', 3); return `Lo más vendido esta noche: ${t.map(x => `${x.nombre} (${x.cant}, ${fmt(x.venta)})`).join('; ')}. Fuente: pedidos de hoy.`; }
    if (/cover|aforo|cu[aá]nta gente|personas/.test(q)) { return `Han entrado ${all.personas} personas (${n1}: ${s1.personas}, ${n2}: ${s2.personas}). Cover cobrado: ${fmt(all.cover)}. Ocupación de aforo: ${pct(all.ocupPct, 0)}. Mesas: ${all.sentadas} sentadas, ${all.confirmadas} por llegar, ${all.noshow} no llegaron.`; }
    if (/venta|cu[aá]nto|ingreso|total/.test(q)) { return `Venta de la noche hasta ahora: ${fmt(all.total)} (${n1} ${fmt(s1.total)}, ${n2} ${fmt(s2.total)}). Ticket promedio por persona: ${fmt(all.ticket)}. Costo de barra: ${pct(all.costoBarraPct)}. Fuente: pagos y pedidos de hoy.`; }
    if (/pendiente|caja|efectivo/.test(q)) { const c = M.cajaHoy('all'); return `Caja de hoy: ${fmt(c.total)} en ${c.pagos.length} pagos. Hay ${c.pendientes.length} pagos en efectivo pendientes de confirmar por ${fmt(c.pendientes.reduce((a, p) => a + p.monto, 0))}. ¿Te mando la lista al cajero?`; }
    return 'En el demo respondo con los números del sistema a preguntas como: qué sucursal vendió más, margen o costo de barra, merma, mejor día, mejor hora, temporada, clientes VIP, productos más vendidos, aforo y caja. En la fase real el motor de IA (Claude o GPT) entiende cualquier pregunta sobre esta misma base.';
  }

  // ───────────────────────── API pública ─────────────────────────
  load();
  window.CC = {
    get db() { return db; }, save: persist, reset, reload, log,
    on(fn) { subs.add(fn); return () => subs.delete(fn); },
    uid, money, pct, hoy, ahoraHM, fechaISO, fechaLarga, iniciales, DIAS, MESES, MESES_L, round,
    SUCURSALES: () => db.sucursales, TIPOS_QR, ROLES, PRECIOS: () => db.config.precios, BASES,
    tokenQR, verificarQR, M, asistente, estadoMesa, planoSVG, PLANO_COLORES, PLANO_LEYENDA,
    suc: (id) => db.sucursales.find(s => s.id === id), mesa: (id) => db.mesas.find(m => m.id === id), prod: (id) => db.productos.find(p => p.id === id), cliente: (id) => db.clientes.find(c => c.id === id), emp: (id) => db.personal.find(e => e.id === id), prov: (id) => db.proveedores.find(p => p.id === id),
    // helpers de escritura usados por ambas apps
    crearReserva(datos) { const r = Object.assign({ id: uid('r'), fecha: hoy(), estado: 'confirmada', creado: new Date().toISOString(), grupo: [], preorden: [], pagado: 0 }, datos); db.reservas.push(r); log(datos.origen || 'app', 'Reserva ' + r.tipo + ' ' + r.nombre); persist(); return r; },
    registrarPago(datos) { const p = Object.assign({ id: uid('pg'), fecha: hoy(), hora: ahoraHM(), estado: 'aprobado', propina: 0 }, datos); db.pagos.push(p); persist(); return p; },
    crearPedido(datos) { const o = Object.assign({ id: uid('o'), estado: 'nuevo', hora: ahoraHM(), creado: Date.now(), origen: 'app' }, datos); db.pedidos.push(o); log(o.origen, 'Pedido en mesa ' + (CC.mesa(o.mesaId) || {}).num); persist(); return o; },
    registrarAcceso(datos) { const a = Object.assign({ id: uid('a'), fecha: hoy(), hora: ahoraHM(), resultado: 'ok', puerta: 'Escáner 1' }, datos); db.accesos.push(a); persist(); return a; }
  };
})();
