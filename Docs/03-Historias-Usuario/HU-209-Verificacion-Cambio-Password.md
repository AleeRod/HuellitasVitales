Historia de usuario: Verificación por Correo al Cambiar o Recuperar la Contraseña

Datos generales

- Id: HU-209
- Prioridad: Alta
- Épica: Seguridad de la Cuenta

Historia
Como usuario de la plataforma,
quiero que cualquier cambio de mi contraseña —tanto si la olvidé como si la cambio desde mi cuenta ya autenticada— me pida confirmarlo desde mi correo antes de aplicarse,
para que nadie pueda cambiarla en mi nombre, ni siquiera con la sesión abierta en un equipo compartido o con mi token robado.

Criterios de aceptación

- Al pedir "olvidé mi contraseña" (`POST /api/password/recuperar`), el sistema nunca devuelve el token de restablecimiento en la respuesta: lo envía únicamente por correo electrónico, a un enlace que apunta a `/restablecer-password`.
- La respuesta de "olvidé mi contraseña" es siempre el mismo mensaje genérico, exista o no una cuenta con ese correo, para no revelar si un correo está registrado.
- Al cambiar la contraseña desde la cuenta ya autenticada (Configuración/Perfil), el sistema ya no la cambia directo: valida la contraseña actual (si la cuenta ya tenía una) y dispara el mismo correo de verificación que "olvidé mi contraseña".
- El cambio real de la contraseña —en ambos flujos— se completa únicamente al hacer clic en el enlace del correo y definir la nueva contraseña en `/restablecer-password`.
- El enlace de verificación expira a los 30 minutos y solo puede usarse una vez.
- Una cuenta creada solo por Google/Facebook (sin contraseña propia todavía) puede pedir el mismo correo de verificación para establecer su primera contraseña, sin que se le exija ninguna "contraseña actual".
- El correo de verificación realmente sale (SMTP configurado y probado) y respeta el tema visual (pino/menta) del resto de la plataforma.

Notas
`IEmailService`/`EmailService` (`System.Net.Mail.SmtpClient`, sin paquetes nuevos) arma el
enlace y lo envía. Endpoints: `POST /api/password/recuperar`, `POST /api/password/restablecer`
(sin cambios de contrato) y el nuevo `POST /api/usuario/password/solicitar-verificacion`
(reemplaza al antiguo `PUT /api/usuario/password`, eliminado). Página frontend:
`RestablecerPassword.jsx`, reutilizada tal cual por los dos flujos —no se construyó ninguna
pantalla nueva de "definir contraseña" para el cambio autenticado. Los dos modales de "Cambiar
contraseña" del frontend (`ConfiguracionCuenta.jsx`, compartido por Cliente y Admin, y
`Perfil.jsx`) se actualizaron para pedir solo la contraseña actual y disparar la verificación.
Ver [[MEJORAS]] (Mejora-09) para el detalle completo de la implementación y la configuración
SMTP.

Estado
Implementada (2026-08-21). Credenciales SMTP reales configuradas y envío verificado con un
correo de prueba real —no solo la plumbing, el flujo end-to-end funciona.
