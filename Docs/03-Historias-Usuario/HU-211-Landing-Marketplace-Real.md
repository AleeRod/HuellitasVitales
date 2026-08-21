Historia de usuario: Landing Page Conectada al Marketplace Real y Redirección Inteligente

Datos generales

- Id: HU-211
- Prioridad: Media
- Épica: Landing Page y Captación de Usuarios

Historia
Como visitante de la página principal (con o sin sesión iniciada),
quiero ver productos reales del marketplace en la promoción de la Landing Page, y que el botón de "Crear perfil de mascota gratis" me lleve al lugar correcto según si ya tengo cuenta o no,
para tener una primera impresión real de la plataforma y no perder pasos de más al querer empezar a usarla.

Criterios de aceptación

- La sección de promoción del marketplace en la Landing Page muestra productos reales conectados a la base de datos (nombre, precio, imagen), no datos de ejemplo fijos.
- Desde esa promoción, el visitante puede agregar un producto al carrito igual que desde el Marketplace completo, con el mismo comportamiento de sesión (registro rápido si no tiene cuenta, ver historias de Carrito/Checkout).
- El botón "Crear perfil de mascota gratis": si el visitante ya tiene una sesión iniciada, lo lleva directo a agregar una mascota (`/cliente/mis-mascotas`, abriendo el formulario); si no tiene sesión, lo lleva a registrarse (`/register`).
- Las notificaciones (Toast) que aparecen al interactuar con la promoción del marketplace se muestran siempre por encima del navbar fijo de la Landing Page, sin quedar tapadas.

Notas
`MarketplacePromo.jsx` y `PetPromo.jsx` (`src/components/`). La detección de sesión usa la
misma clave canónica que el resto de la app (`localStorage.getItem('token_huellitas')`). El fix
de las notificaciones detrás del navbar se resolvió portalizando `ToastContainer`
(`createPortal` a `document.body`), el mismo patrón ya usado para el dropdown de
`NotificacionesBell.jsx` —ambos casos eran el mismo problema de fondo: un ancestro con
`position: relative` + `z-index` propio (cada sección de la Landing Page) atrapa a sus
descendientes `position: fixed` dentro de su propio stacking context, sin importar el z-index
que el descendiente tenga declarado.

Estado
Implementada (2026-08-21).
