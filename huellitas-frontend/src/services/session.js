// Manejo centralizado de la sesión del usuario.
//
// Reutiliza la clave 'token_huellitas' que ya usa Login.jsx para guardar el JWT.
// El rol viaja dentro del propio token (claim "rol"), así que no se guarda aparte:
// se decodifica el JWT cuando se necesita. No requiere librerías externas.

const TOKEN_KEY = 'token_huellitas';

// Mapa numérico (claim "rol" del JWT) -> nombre de rol usado en la UI.
export const ROLES = {
    1: 'Administrador',
    2: 'Veterinario',
    3: 'Cliente',
};

// Ruta del panel principal de cada rol (para redirecciones).
export const PANEL_POR_ROL = {
    Administrador: '/admin',
    Veterinario: '/veterinario',
    Cliente: '/cliente',
};

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
}

// Decodifica el payload de un JWT de forma segura (UTF-8), sin dependencias.
function decodificarJwt(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

// Devuelve los datos del usuario logueado a partir del JWT, o null si no hay sesión.
// Forma: { id, correo, idRol, rol, expirado }
export function getUsuarioActual() {
    const token = getToken();
    if (!token) return null;

    const p = decodificarJwt(token);
    if (!p) return null;

    const idRol = Number(p.rol);
    const expirado = p.exp ? Date.now() >= p.exp * 1000 : false;

    return {
        id: p.sub ? Number(p.sub) : null,
        correo: p.email ?? null,
        idRol,
        rol: ROLES[idRol] ?? null,
        expirado,
    };
}

// true solo si hay sesión y el token no ha expirado.
export function estaAutenticado() {
    const u = getUsuarioActual();
    return !!u && !u.expirado;
}
