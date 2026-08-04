<<<<<<< HEAD
// URL base de la API. Centralizada para no repetir el host en cada fetch.
// Se toma de la variable de entorno de Vite VITE_API_URL (ver .env / .env.example);
// si no está definida se usa el backend local por defecto.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5010/api';
=======
// src/api/config.js
export const API_BASE = import.meta.env.VITE_API_URL;
>>>>>>> bc40ad8fb5d8dbc2596331417298b0e11505dfd0
