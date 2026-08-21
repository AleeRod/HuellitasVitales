import React from 'react';
import ConfiguracionCuenta from '../../Cuenta/ConfiguracionCuenta';

// Wrapper delgado: la lógica y el diseño viven en ConfiguracionCuenta (components/Cuenta/),
// compartida con pages/Cliente/Configuracion.jsx — el admin edita su propia cuenta con los
// mismos endpoints por-usuario-autenticado (ícono de perfil, datos, cuentas vinculadas y
// contraseña), sin nada que reinventar.
const PanelConfiguracionAdmin = () => <ConfiguracionCuenta />;

export default PanelConfiguracionAdmin;
