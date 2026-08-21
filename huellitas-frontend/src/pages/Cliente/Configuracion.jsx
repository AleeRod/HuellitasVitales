import React from 'react';

import ClienteLayout from '../../components/Cliente/ClienteLayout/ClienteLayout';
import ConfiguracionCuenta from '../../components/Cuenta/ConfiguracionCuenta';

// Ícono de perfil, datos de la cuenta, cuentas vinculadas y cambio de contraseña viven en
// ConfiguracionCuenta (components/Cuenta/) — se comparte tal cual con la sección
// "Configuración" del panel de Administración, ya que todo eso es por-usuario-autenticado, sin
// nada específico del rol Cliente. Esta página es solo el wrapper con el layout del portal.
const Configuracion = () => (
  <ClienteLayout activo="configuracion">
    <ConfiguracionCuenta />
  </ClienteLayout>
);

export default Configuracion;
