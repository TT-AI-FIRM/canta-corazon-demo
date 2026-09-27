# Canta Corazón · Demo del sistema integral

Demo funcional (datos ilustrativos, pagos simulados) de las dos webapps del sistema integral propuesto para Canta Corazón. Funciona en celular, tableta y computadora, y **funciona sin internet** después de abrirlo una vez.

## Archivos

- `index.html` — portada de la propuesta: módulos con enlace a su demo por rol, pantallas, «Todo conectado» con QR, «Lo que cambia» y recorrido sugerido.
- `cliente/` — app del cliente.
  - `app.js`: navegación con botón regresar, Mi noche con QR por persona (se toca y se abre a pantalla completa), reservar en el plano, preorden, dividir y pagar, canción, amigos, puntos y perfil.
  - `promos.js`: promociones estilo Instagram. Solo publica la casa; los clientes ven historias y publicaciones, dan me gusta (también con doble toque), comentan, guardan, canjean y se las mandan entre amigos.
  - `entrar.js`: entrar con correo y contraseña o crear cuenta. Es la pantalla que abre la tarjeta de la mesa (`cliente/?mesa=14&suc=s1`). En el demo ya hay sesión y no se guarda ninguna contraseña.
- `interno/` — sistema interno por rol (menú: Tablero · Puerta · Local · Insumos · Caja · Más).
  - `app.js`: tablero, mesas (con la tarjeta de cada mesa), pedidos, inventario, compras con XML, caja, clientes, personal, asistente y configuración.
  - `puerta.js`: escáner QR con cámara real y simulación. El resultado sale a pantalla completa: puede pasar, pasa con pendiente o no pasa.
  - `promos.js`: la casa publica promociones (cartel o foto) y ve me gusta, comentarios, envíos entre clientes y canjes.
- `shared/` — núcleo compartido (`core.js`), trabajo sin internet (`sync.js`), identidad, tipografías, fotos y librerías (qrcode, jsQR, Chart.js).
- `sw.js` — memoria sin internet (service worker).

## Cómo funciona

- **La noche del demo es siempre el sábado más reciente** y el reloj marca las 23 h. Así la noche en vivo cuadra con el historial: el sábado es el mejor día y la venta se compara contra «el sábado pasado a esta hora». Si la fecha cambia, los datos se regeneran solos.
- Los datos viven en el navegador (localStorage) y se comparten entre pestañas del mismo dispositivo (BroadcastChannel).
- **QR por persona y firmado** (HMAC-SHA256). Cada integrante del grupo trae el suyo: el primero sienta la mesa y los demás entran como parte del grupo. Si el QR se altera, se inventa o se usa dos veces, la puerta lo rechaza. El QR trae los datos de la reserva y del pago, así que una tableta lo reconoce aunque la reserva se haya hecho en otro teléfono.
- **Sin internet:** `sw.js` guarda todo el demo en el dispositivo la primera vez que se abre con red. Sin red todo sigue funcionando; lo que se hace entra a una cola y, al volver la red, se sube solo. En el demo la subida se simula; en la fase real va a la base de Canta Corazón y llega a las demás tabletas.

## Al publicar cambios

1. Subir `VERSION` en `sw.js` (si no, los teléfonos que ya lo abrieron siguen con la copia vieja cuando no hay red).
2. Subir el `?v=` de los CSS y JS en los tres `index.html` (si no, el navegador puede usar la copia vieja hasta 10 minutos).
3. `sh "$HOME/TT FIRM AI/publicar.sh" canta "mensaje"`.

Presentan Carlos Martínez y Michel Tron · Septiembre 2026.
