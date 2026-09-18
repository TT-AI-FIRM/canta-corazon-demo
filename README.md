# Canta Corazón · Demo del sistema integral

Demo funcional (datos ilustrativos, pagos simulados) de las dos webapps del sistema integral propuesto para Canta Corazón:

- `interno/` — App interna (menú: Tablero · Puerta · Local · Insumos · Caja · Más; botón atrás y logo a inicio): tablero de socios, puerta con escáner QR, mesas y reservas, pedidos (la barra en vivo: de meseros, de mesa y desde la app), inventario y merma, compras con factura XML, caja y cortes, clientes, personal, asistente de IA y configuración.
- `cliente/` — App del cliente: reservar en el plano, botellas en preventa, dividir con amigos, pagar, QR, pedir a la mesa, canción con el mariachi, amigos, recompensas.
- `index.html` — portada de la propuesta (estilo de la de All Cabo, tema Canta Corazón): qué hace cada módulo con enlace directo a su demo por rol, pantallas, «Todo conectado» con QR, «Lo que cambia», «Con quiénes hemos trabajado» y el recorrido sugerido. Vista previa para WhatsApp en `shared/img/og.jpg`.
- `shared/` — núcleo compartido (`core.js`), identidad, tipografías, librerías (qrcode, jsQR, Chart.js).

Las dos apps comparten los datos en el mismo navegador (localStorage + BroadcastChannel). El QR va firmado, así que la puerta lo valida aunque venga de otro dispositivo.

Presentan Carlos Martínez y Michel Tron · Septiembre 2026.
