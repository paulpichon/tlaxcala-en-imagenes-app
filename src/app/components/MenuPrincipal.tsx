'use client';
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotificaciones } from "@/context/NotificacionesContext"; // 👈 nuevo import
import { FiHome, FiBell, FiPlusCircle, FiSliders, FiAlignJustify } from "react-icons/fi";
import Image from "next/image";
import CrearPosteoModal from "./CrearPosteoModal";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";
import { useLogout } from "../hooks/auth/logout";

interface Props {
  onPostCreated?: () => void;
}

export default function MenuPrincipal({ onPostCreated }: Props) {
  const pathname = usePathname();
  const { handleLogout } = useLogout();
  const { user } = useAuth();
  const { totalNoLeidas, refrescarNotificaciones } = useNotificaciones(); // 👈 desde el context

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCrearPost, setShowCrearPost] = useState(false);

  const perfilHref = `/${user?.url ?? "#"}`;
  const isPerfilActivo = pathname === perfilHref;
  const isNotificacionesActivo = pathname === "/notificaciones";
  const isFavoritosActivo = pathname === "/favoritos";

  const baseLinks = [
    { name: "Inicio", href: "/inicio", icon: FiHome },
    { name: "Notificaciones", href: "/notificaciones", icon: FiBell },
    { name: "Postear", action: () => setShowCrearPost(true), icon: FiPlusCircle },
    { name: "Configuraciones", href: "/configuracion", icon: FiSliders },
  ];

  // 🔁 Actualizar notificaciones cada cierto tiempo (opcional)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refrescarNotificaciones, 60000); // cada 1 min
    return () => clearInterval(interval);
  }, [user, refrescarNotificaciones]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bloquear scroll al abrir modales
  useEffect(() => {
    document.body.style.overflow = showModal || showCrearPost ? "hidden" : "auto";
  }, [showModal, showCrearPost]);

  return (
    <nav>
      <ul className="nav justify-content-center menu_inferior_lateral">
        {/* Enlaces principales */}
        {baseLinks.map(({ name, href, icon: LinkIcon, action }) => (
          <li className="nav-item position-relative" key={name} title={name}>
            {action ? (
              <button
                onClick={action}
                className="nav-link opciones_menu bg-transparent border-0"
              >
                {LinkIcon && <LinkIcon className="icono_menu" />}
                <span className="nombre_opciones_menu">{name}</span>
              </button>
            ) : (
              <Link
                href={href!}
                className={`nav-link opciones_menu ${pathname === href ? "link-activo" : ""}`}
              >
                <div className="position-relative d-inline-block">
                  {LinkIcon && <LinkIcon className="icono_menu" />}

                  {/* 🔔 Badge persistente de notificaciones */}
                  {name === "Notificaciones" && totalNoLeidas > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: "0.65rem" }}
                    >
                      {totalNoLeidas > 9 ? "9+" : totalNoLeidas}
                      <span className="visually-hidden">nuevas notificaciones</span>
                    </span>
                  )}
                </div>
                <span className="nombre_opciones_menu">{name}</span>
              </Link>
            )}
          </li>
        ))}

        {/* Perfil del usuario */}
        {user && (
          <li
            className="nav-item"
            title={`${user?.nombre_completo?.nombre ?? "Usuario"} ${user?.nombre_completo?.apellido ?? ""}`}
          >
            <Link
              href={perfilHref}
              className={`nav-link opciones_menu ${isPerfilActivo ? "link-activo" : ""}`}
            >
              <Image
                key={user?.imagen_perfil?.secure_url || "default"}
                src={obtenerImagenPerfilUsuario(user, "mini")}
                alt={`${user?.nombre_completo?.nombre} ${user?.nombre_completo?.apellido} `}
                width={100}
                height={100}
                className={`rounded-circle icono_menu ${isPerfilActivo ? "perfil-activo" : ""}`}
                style={{
                  width: "30px",
                  height: "30px",
                  objectFit: "cover",
                  border: isPerfilActivo ? "2px solid #000000" : "none",
                  padding: isPerfilActivo ? "2px" : "0",
                }}
              />
              <span className="nombre_opciones_menu">
                {`${user?.nombre_completo?.nombre ?? "Usuario"} ${user?.nombre_completo?.apellido ?? ""}`}
              </span>
            </Link>
          </li>
        )}

        {/* Dropdown menú de cuenta */}
        <li className="nav-item dropdown" ref={dropdownRef}>
          <button
            className="nav-link opciones_menu bg-transparent border-0"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <FiAlignJustify className="icono_menu" title="Más opciones" />
            <span className="nombre_opciones_menu">Cuenta</span>
          </button>

          {dropdownOpen && (
            <ul className="dropdown-menu show position-absolute" style={{ minWidth: "10rem" }}>
              {/* Favoritos */}
              <li>
                <Link
                  className={`dropdown-item ${isFavoritosActivo ? "linkActivoDropdown fw-light" : ""}`}
                  href="/favoritos"
                >
                  Favoritos
                </Link>
              </li>
              <li>
                <Link
                  className={`dropdown-item ${isPerfilActivo ? "linkActivoDropdown fw-light" : ""}`}
                  href={perfilHref}
                >
                  Mi perfil
                </Link>
              </li>

              <li>
                <Link
                  className={`dropdown-item ${isNotificacionesActivo ? "linkActivoDropdown fw-light" : ""}`}
                  href="/notificaciones"
                >
                  Notificaciones
                </Link>
              </li>

              <li>
                <button
                  className="dropdown-item buttonDropDown"
                  onClick={() => setShowModal(true)}
                >
                  Cerrar sesión
                </button>
              </li>
            </ul>
          )}
        </li>
      </ul>

      {/* Modal Cerrar sesión */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar cierre de sesión</h5>
              </div>
              <div className="modal-body text-center">
                <p>¿Estás seguro de que quieres cerrar sesión?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear posteo */}
      <CrearPosteoModal
        show={showCrearPost}
        onClose={() => setShowCrearPost(false)}
        onPostCreated={onPostCreated}
      />
    </nav>
  );
}
