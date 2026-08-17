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