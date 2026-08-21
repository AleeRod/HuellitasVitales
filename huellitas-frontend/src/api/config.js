// src/api/config.js
export const API_BASE = import.meta.env.VITE_API_URL;

// Host "limpio" del backend, sin el sufijo /api, para servir archivos estáticos
// (imágenes) que viven en wwwroot y no pasan por el router de la API.
const HOST_ARCHIVOS = API_BASE.replace(/\/api\/?$/, "");

// Arma la URL completa de una imagen guardada en el backend.
// Si imagenUrl ya es una URL completa (http...), la deja tal cual.
export const resolverImagen = (imagenUrl) => {
  if (!imagenUrl) return null;
  if (imagenUrl.startsWith("http")) return imagenUrl;
  return `${HOST_ARCHIVOS}${imagenUrl}`;
};

// Limpia la sesión y manda a login cuando un fetch autenticado devuelve 401 (token vencido o
// inválido). Antes cada página fallaba en silencio con un toast genérico, o reventaba al
// intentar parsear como JSON el 401 sin body que devuelve [Authorize] por defecto.
export const manejarSesionExpirada = () => {
  localStorage.removeItem("token_huellitas");
  localStorage.removeItem("usuario_huellitas");
  window.location.href = "/login";
};