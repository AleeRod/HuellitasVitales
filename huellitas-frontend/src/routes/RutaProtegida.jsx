// Ruta protegida por sesión y (opcionalmente) por rol, reutilizable en React Router.
//
// Dos formas de uso:
//
//  1) Envolviendo el elemento directamente:
//       <Route
//         path="/admin"
//         element={
//           <RutaProtegida roles={["Administrador"]}>
//             <DashboardAdmin />
//           </RutaProtegida>
//         }
//       />
//
//  2) Como layout de rutas anidadas (usa <Outlet />):
//       <Route element={<RutaProtegida roles={["Administrador"]} />}>
//         <Route path="/admin" element={<DashboardAdmin />} />
//       </Route>
//
// Reglas:
//  - Sin token (o token expirado)  -> redirige a /login recordando el origen.
//  - Con sesión pero sin el rol requerido -> redirige al panel propio del usuario.
//  - `roles` es opcional: si se omite, basta con estar autenticado.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUsuarioActual, PANEL_POR_ROL } from '../services/session';

function RutaProtegida({ roles, children, redirectTo = '/login' }) {
    const location = useLocation();
    const usuario = getUsuarioActual();

    // No autenticado o token vencido -> al login (guardando a dónde iba).
    if (!usuario || usuario.expirado) {
        return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
    }

    // Autenticado pero sin el rol requerido -> a su propio panel (o a home).
    if (roles?.length && !roles.includes(usuario.rol)) {
        return <Navigate to={PANEL_POR_ROL[usuario.rol] ?? '/'} replace />;
    }

    return children ?? <Outlet />;
}

export default RutaProtegida;
