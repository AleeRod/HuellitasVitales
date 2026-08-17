import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, LogOut, Store, Stethoscope } from "lucide-react";
import { API_BASE } from "../../api/config";
import PanelProductos from "../../components/ComercioAdmin/PanelProductos/PanelProductos"; // ⚠️ ajustá la ruta según dónde tengas PanelProductos
import styles from "./DashboardFuncionario.module.css";

const TIPO_COMERCIO_VETERINARIA = 1;
const TIPO_COMERCIO_ALMACEN = 2;

const DashboardFuncionario = () => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState(null); // "productos" | "servicios"
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

        if (!data.usuario.esFuncionario) {
          navigate("/");
          return;
        }

        setUsuario(data.usuario);

        // Elegimos qué sección mostrar por defecto: preferimos Productos
        // (ya está lista), si no tiene almacén pero sí veterinaria, mostramos ese aviso.
        const comercios = data.usuario.comercios || [];
        const tieneAlmacenAprobado = comercios.some(c => c.idTipoComercio === TIPO_COMERCIO_ALMACEN && c.aprobado);
        const tieneVeterinariaAprobada = comercios.some(c => c.idTipoComercio === TIPO_COMERCIO_VETERINARIA && c.aprobado);

        if (tieneAlmacenAprobado) setSeccionActiva("productos");
        else if (tieneVeterinariaAprobada) setSeccionActiva("servicios");
        else setSeccionActiva(null);

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
    localStorage.removeItem("usuario_huellitas");
    navigate("/login");
  };

  if (cargando) {
    return <div className={styles.estadoCarga}>Cargando tu panel...</div>;
  }

  if (!usuario) return null; // ya se redirigió

  const comercios = usuario.comercios || [];

  // Preferimos un comercio APROBADO de cada tipo. Si no hay ninguno aprobado,
  // caemos al primero que exista igual, para poder mostrar el mensaje
  // "todavía no fue aprobado" con datos reales.
  const comercioAlmacen =
    comercios.find(c => c.idTipoComercio === TIPO_COMERCIO_ALMACEN && c.aprobado) ||
    comercios.find(c => c.idTipoComercio === TIPO_COMERCIO_ALMACEN);

  const comercioVeterinaria =
    comercios.find(c => c.idTipoComercio === TIPO_COMERCIO_VETERINARIA && c.aprobado) ||
    comercios.find(c => c.idTipoComercio === TIPO_COMERCIO_VETERINARIA);

  if (comercios.length === 0) {
    return (
      <div className={styles.sinComercio}>
        <Store size={40} />
        <h2>No tenés un comercio afiliado</h2>
        <p>Tu cuenta de funcionario todavía no está vinculada a ningún comercio.</p>
      </div>
    );
  }

  const nombreEncabezado = comercioAlmacen?.nombreComercial || comercioVeterinaria?.nombreComercial || "Tu comercio";

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.marca}>
          <Store size={22} />
          <div>
            <strong>{nombreEncabezado}</strong>
            <span>Panel de funcionario</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {comercioAlmacen && (
            <button
              className={seccionActiva === "productos" ? styles.navItemActivo : styles.navItem}
              onClick={() => setSeccionActiva("productos")}
            >
              <Package size={18} /> Productos
            </button>
          )}
          {comercioVeterinaria && (
            <button
              className={seccionActiva === "servicios" ? styles.navItemActivo : styles.navItem}
              onClick={() => setSeccionActiva("servicios")}
            >
              <Stethoscope size={18} /> Servicios
            </button>
          )}
        </nav>

        <button className={styles.btnSalir} onClick={cerrarSesion}>
          <LogOut size={18} /> Cerrar sesión
        </button>
      </aside>

      <main className={styles.contenido}>
        {seccionActiva === "productos" && comercioAlmacen && (
          comercioAlmacen.aprobado ? (
            <PanelProductos esAdmin={false} />
          ) : (
            <div className={styles.avisoServicios}>
              <p>"{comercioAlmacen.nombreComercial}" todavía no fue aprobado por un administrador.</p>
            </div>
          )
        )}

        {seccionActiva === "servicios" && comercioVeterinaria && (
          <div className={styles.avisoServicios}>
            <p>
              Gestión de <strong>Servicios</strong> para "{comercioVeterinaria.nombreComercial}" — en desarrollo.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardFuncionario;