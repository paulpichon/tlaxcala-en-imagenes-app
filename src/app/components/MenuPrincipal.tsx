'use client';
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
  const { user, fetchWithAuth } = useAuth(); // 👈 usamos fetchWithAuth del contexto

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCrearPost, setShowCrearPost] = useState(false);

  const perfilHref = `/${user?.url ?? "#"}`; // Ruta del perfil del usuario logueado
  const isPerfilActivo = pathname === perfilHref;

  // Enlaces base del menú
  const baseLinks = [
    { name: "Inicio", href: "/inicio", icon: FiHome },
    { name: "Notificaciones", href: "/notificaciones", icon: FiBell },
    { name: "Postear", action: () => setShowCrearPost(true), icon: FiPlusCircle },
    { name: "Configuraciones", href: "/configuracion", icon: FiSliders },
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

  // 🚀 Registrar notificaciones push
  useEffect(() => {
    if (!user) return; // solo registrar si el usuario está logueado

    async function registerPush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Las notificaciones push no están soportadas en este navegador.");
        return;
      }

      try {
        // 1️⃣ Registrar el Service Worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registrado:", registration);

        // 2️⃣ Pedir permiso al usuario
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Permiso de notificaciones denegado por el usuario.");
          return;
        }

        // 3️⃣ Evitar duplicar suscripciones
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          console.log("Ya existe una suscripción activa.");
          return;
        }

        // 4️⃣ Obtener clave pública VAPID desde el backend
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones/vapidPublicKey`);
        if (!res.ok) throw new Error("No se pudo obtener la clave pública VAPID");
        const { key } = await res.json();

        // 5️⃣ Crear nueva suscripción en el navegador
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });

        // 6️⃣ Enviar suscripción al backend
        const resp = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/notificaciones/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        });

        if (!resp.ok) throw new Error("Error al registrar la suscripción");
        const data = await resp.json();
        console.log("✅", data.message);
      } catch (err) {
        console.error("Error al registrar notificaciones push:", err);
      }
    }

    registerPush();
  }, [user, fetchWithAuth]);

  // 🔧 Función para convertir la clave pública VAPID
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  return (
    <nav>
      <ul className="nav justify-content-center menu_inferior_lateral">
        {/* Enlaces principales */}
        {baseLinks.map(({ name, href, icon: LinkIcon, action }) => (
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
                className={`nav-link opciones_menu ${pathname === href ? "link-activo" : ""}`}
              >
                {LinkIcon && <LinkIcon className="icono_menu" />}
                <span className="nombre_opciones_menu">{name}</span>
              </Link>
            )}
          </li>
        ))}

        {/* Perfil del usuario */}
        {user && (
          <li className="nav-item" title="Perfil">
            <Link
              href={perfilHref}
              className={`nav-link opciones_menu ${isPerfilActivo ? "link-activo" : ""}`}
            >
              <Image
                key={user?.imagen_perfil?.secure_url || "default"}
                src={obtenerImagenPerfilUsuario(user, "mini")}
                alt={user?.nombre_completo?.nombre || "Usuario"}
                width={100}
                height={100}
                className={`rounded-circle icono_menu ${
                  isPerfilActivo ? "perfil-activo" : ""
                }`}
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
            <ul
              className="dropdown-menu show position-absolute"
              style={{ minWidth: "10rem" }}
            >
              <li>
                <Link
                  className={`dropdown-item ${
                    isPerfilActivo ? "fw-bold opciones_menu" : ""
                  }`}
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
