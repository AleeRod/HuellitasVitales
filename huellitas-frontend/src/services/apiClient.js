// Cliente HTTP centralizado para hablar con el API de Huellitas Vitales.
//
// Responsabilidades:
//  - Usar la URL base desde la variable de entorno de Vite (src/api/config.js).
//  - Adjuntar automáticamente el header Authorization con el JWT si hay sesión.
//  - Normalizar los errores del backend a un único formato para la UI (ApiError).
//  - Manejar el 401: si había sesión, la cierra y redirige al login.
//
// Uso:
//   import apiClient from '../services/apiClient';
//   const data = await apiClient.get('/usuario/5');
//   const r    = await apiClient.post('/comercio/solicitud', payload);
//
// Errores: en cualquier fallo se lanza un ApiError con { message, status, fields }.
//   try { ... } catch (e) { showToast(e.message, 'error'); }

import { API_BASE } from '../api/config';
import { getToken, clearSession } from './session';

// Error normalizado que consume la UI. `message` siempre es apto para mostrar.
export class ApiError extends Error {
    constructor(message, { status = 0, fields = null, raw = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;        // código HTTP (0 = fallo de red)
        this.fields = fields;        // errores de validación por campo (ModelState), si los hay
        this.raw = raw;              // cuerpo original de la respuesta, por si se necesita
    }
}

// Arma la URL final. Acepta rutas relativas ('/usuario/5') o absolutas (http...).
function construirUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    const base = API_BASE.replace(/\/$/, '');
    const ruta = path.startsWith('/') ? path : `/${path}`;
    return `${base}${ruta}`;
}

function parsearCuerpo(texto) {
    if (!texto) return null;
    try {
        return JSON.parse(texto);
    } catch {
        return texto;
    }
}

// Traduce una respuesta no-OK del backend a un ApiError uniforme.
// Backend actual: { success:false, mensaje:"..." }.
// También contempla ModelState ({ errors }) y ProblemDetails ({ title }) por robustez.
function normalizarError(status, data) {
    let mensaje = 'Ocurrió un error inesperado. Intenta de nuevo.';
    let fields = null;

    if (data && typeof data === 'object') {
        if (typeof data.mensaje === 'string' && data.mensaje) mensaje = data.mensaje;
        else if (typeof data.message === 'string' && data.message) mensaje = data.message;
        else if (typeof data.title === 'string' && data.title) mensaje = data.title;

        if (data.errors && typeof data.errors === 'object') {
            fields = data.errors;
            // Si no vino un mensaje general, usa el primer error de validación.
            const primera = Object.values(data.errors)[0];
            if (mensaje.startsWith('Ocurrió un error') && Array.isArray(primera) && primera[0]) {
                mensaje = primera[0];
            }
        }
    } else if (typeof data === 'string' && data.trim()) {
        mensaje = data;
    }

    return new ApiError(mensaje, { status, fields, raw: data });
}

async function request(path, { method = 'GET', body, headers = {}, signal, auth = true } = {}) {
    const finalHeaders = { ...headers };
    let payload = body;

    // Serializa el body salvo que sea FormData (para subir archivos en el futuro).
    if (body !== undefined && body !== null && !(body instanceof FormData)) {
        finalHeaders['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    const token = auth ? getToken() : null;
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

    let res;
    try {
        res = await fetch(construirUrl(path), { method, headers: finalHeaders, body: payload, signal });
    } catch (err) {
        // Las cancelaciones (AbortController) se propagan tal cual, no son errores de red.
        if (err.name === 'AbortError') throw err;
        throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión.', { status: 0, raw: err });
    }

    const data = parsearCuerpo(await res.text());

    // 401: si HABÍA sesión, el token expiró o es inválido -> cerrar sesión y al login.
    // Si no había token (p.ej. credenciales incorrectas en el login), es un error normal.
    if (res.status === 401) {
        if (token) {
            clearSession();
            if (!window.location.pathname.startsWith('/login')) {
                window.location.assign('/login');
            }
            throw new ApiError('Tu sesión expiró. Vuelve a iniciar sesión.', { status: 401, raw: data });
        }
        throw normalizarError(401, data);
    }

    if (!res.ok) throw normalizarError(res.status, data);

    return data;
}

export const apiClient = {
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
    patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
    delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
    request,
};

export default apiClient;
