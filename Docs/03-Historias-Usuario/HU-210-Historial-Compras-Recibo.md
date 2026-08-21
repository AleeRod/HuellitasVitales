Historia de usuario: Historial de Compras y Recibo Interno de Orden

Datos generales

- Id: HU-210
- Prioridad: Media
- Épica: Gestión del Carrito de Compras

Historia
Como cliente,
quiero ver el historial de todas mis compras y poder abrir el recibo de cada una,
para tener un registro de qué compré, cuándo y por cuánto, sin depender de acordarme de memoria.

Criterios de aceptación

- El cliente puede ver "Mis compras": una lista de todas sus órdenes completadas, con fecha, estado, total y método de pago.
- El cliente puede abrir el recibo/factura de cualquier orden, con el detalle línea por línea (producto/servicio, cantidad, precio) y los totales.
- El checkout del carrito permite elegir un método de pago (simulado, sin pasarela real) y ese método queda guardado en la orden para mostrarse después en "Mis compras" y en el recibo.
- Si la orden no tiene método de pago guardado (órdenes creadas antes de este cambio), la pantalla lo indica sin fallar.

Notas
Alcance acordado: "Recibo interno simple" (sin numeración fiscal ni envío por correo), la opción
más simple de las evaluadas al analizar cómo agregar facturación después de la compra —
suficiente para que el cliente tenga un comprobante de su compra dentro de la plataforma.
Reutiliza `ORDEN`/`ORDEN_DETALLE` (tablas ya mapeadas, ver [[Modelo-Datos]]). Requirió agregar
la columna `ORDEN.MetodoPago` (ver [[MEJORAS]], Mejora-07 —ya resuelta, era además la causa del
error 500 al completar cualquier compra). Frontend: `MisCompras.jsx` y `Factura.jsx`
(`src/pages/Cliente/`).

Estado
Implementada (2026-08-21).
