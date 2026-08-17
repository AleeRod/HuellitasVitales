import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, LogOut, Store } from "lucide-react";
import { API_BASE } from "../../api/config";
import PanelProductos from "../../components/ComercioAdmin/PanelProductos/PanelProductos"; // ⚠️ ajustá la ruta según dónde tengas PanelProductos
import styles from "./DashboardFuncionario.module.css";

const TIPO_COMERCIO_ALMACEN = 2;

const DashboardFuncionario = () => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarPerfil = async () => {
      const token = localStorage.getItem("token_huellitas");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/usuario/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          navigate("/login");
          return;
        }

        // Solo dejamos entrar a funcionarios (idRol 4)
        if (!data.usuario.esFuncionario) {
          navigate("/");
          return;
        }

        setUsuario(data.usuario);
      } catch (error) {
        navigate("/login");
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem("token_huellitas");
    navigate("/login");
  };

  if (cargando) {
    return <div className={styles.estadoCarga}>Cargando tu panel...</div>;
  }

  if (!usuario) return null; // ya se redirigió

  if (!usuario.idComercio) {
    return (
      <div className={styles.sinComercio}>
        <Store size={40} />
        <h2>No tenés un comercio afiliado</h2>
        <p>Tu cuenta de funcionario todavía no está vinculada a ningún almacén aprobado.</p>
      </div>
    );
  }

  if (!usuario.comercioAprobado) {
    return (
      <div className={styles.sinComercio}>
        <Store size={40} />
        <h2>Tu comercio está pendiente de aprobación</h2>
        <p>"{usuario.nombreComercio}" todavía no fue aprobado por un administrador.</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.marca}>
          <Store size={22} />
          <div>
            <strong>{usuario.nombreComercio}</strong>
            <span>Panel de funcionario</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <button className={styles.navItemActivo}>
            <Package size={18} /> Productos
          </button>
        </nav>

        <button className={styles.btnSalir} onClick={cerrarSesion}>
          <LogOut size={18} /> Cerrar sesión
        </button>
      </aside>

      <main className={styles.contenido}>
        {usuario.idTipoComercio === TIPO_COMERCIO_ALMACEN ? (
          <PanelProductos esAdmin={false} />
        ) : (
          <div className={styles.avisoServicios}>
            <p>Tu comercio es una veterinaria — la gestión de Servicios está en desarrollo.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardFuncionario;