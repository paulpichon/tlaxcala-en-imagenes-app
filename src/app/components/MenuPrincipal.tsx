'use client';
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FiHome, FiBell, FiPlusCircle, FiSliders, FiAlignJustify } from "react-icons/fi";
import Image from "next/image";
import CrearPosteoModal from "./CrearPosteoModal";
import { obtenerImagenPerfilUsuario } from "@/lib/cloudinary/obtenerImagenPerfilUsuario";

interface Props {
  onPostCreated?: () => void;
}

export default function MenuPrincipal({ onPostCreated }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCrearPost, setShowCrearPost] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/cuentas/login");
  };

  const perfilHref = `/${user?.url ?? "#"}`; // ⭐ Ruta de perfil del usuario logueado
  const isPerfilActivo = pathname === perfilHref; // ⭐ Saber si estamos en el perfil del usuario

  const links = [
    { name: "Inicio", href: "/inicio", icon: FiHome },
    { name: "Notificaciones", href: "/notificaciones", icon: FiBell },
    { name: "Postear", action: () => setShowCrearPost(true), icon: FiPlusCircle },
    { name: "Configuraciones", href: "/configuraciones", icon: FiSliders },
    {
      name: `${user?.nombre_completo?.nombre ?? "Usuario"} ${user?.nombre_completo?.apellido ?? ""}`,
      href: perfilHref,
      image: obtenerImagenPerfilUsuario(user!, "mini"),
      isPerfil: true, // ⭐ identificamos que este link es el perfil
    },
  ];

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
        {links.map(({ name, href, icon: LinkIcon, image, action, isPerfil }) => (
          <li className="nav-item" key={name} title={name}>
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
                className={`nav-link opciones_menu ${
                  pathname === href ? "link-activo" : ""
                }`}
              >
                {image ? (
                  <Image
                    src={image}
                    alt={name}
                    width={100}
                    height={100}
                    className={`rounded-circle icono_menu ${
                      isPerfil && isPerfilActivo ? "perfil-activo" : ""
                    }`} // ⭐ clase condicional
                    style={{
                      width: "30px",
                      height: "30px",
                      objectFit: "cover",
                      border: isPerfil && isPerfilActivo ? "2px solid #000000" : "none", // ⭐ Borde azul (puedes cambiar color)
                      padding: isPerfil && isPerfilActivo ? "2px" : "0",
                    }}
                  />
                ) : (
                  LinkIcon && <LinkIcon className="icono_menu" />
                )}
                <span className="nombre_opciones_menu">{name}</span>
              </Link>
            )}
          </li>
        ))}

        {/* Dropdown menú cuenta */}
        <li className="nav-item dropdown" ref={dropdownRef}>
          <button
            className="nav-link opciones_menu bg-transparent border-0"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <FiAlignJustify className="icono_menu" title="Más opciones" />
            <span className="nombre_opciones_menu">Cuenta</span>
          </button>

          {dropdownOpen && (
            <ul
              className="dropdown-menu show position-absolute"
              style={{ minWidth: "10rem" }}
            >
              <li>
                <Link
                  className={`dropdown-item ${
                    isPerfilActivo ? "fw-bold opciones_menu" : ""
                  }`} // ⭐ texto resaltado
                  href={perfilHref}
                >
                  Mi perfil
                </Link>
              </li>
              <button
                className="dropdown-item buttonDropDown"
                onClick={() => setShowModal(true)}
              >
                Cerrar sesión
              </button>
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
                  className="btn btnCancelar"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btnCerrarSesion"
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
