// Este componente:
// Muestra un menú con íconos e identificación de ruta activa.
// Tiene un botón para desplegar un submenú ("Cuenta") con opciones adicionales.
// Usa un modal para confirmar antes de cerrar sesión.
// Usa useEffect para mejorar la experiencia UX (cerrar dropdowns automáticamente y bloquear scroll cuando hay modales)
'use client';
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FiHome, FiBell, FiPlusCircle, FiSliders, FiUser, FiAlignJustify  } from "react-icons/fi";

const links = [
    { name: 'Home', href: '/inicio', icon: FiHome },
    { name: 'Notificaciones', href: '/notificaciones', icon: FiBell },
    { name: 'Postear', href: '/postear', icon: FiPlusCircle },
    { name: 'Configuraciones', href: '/configuraciones', icon: FiSliders },
    { name: 'Perfil', href: '/perfil', icon: FiUser },
];

export default function MenuPrincipal() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLLIElement>(null);
    const [showModal, setShowModal] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/cuentas/login');
    };

    // Cierra el dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {

                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    // evitar scroll o conflictos visuales
    useEffect(() => {
        document.body.style.overflow = showModal ? 'hidden' : 'auto';
    }, [showModal]);

    return (
        <nav>
            <ul className="nav justify-content-center menu_inferior_lateral">
                {links.map(({ name, href, icon }) => {
                    const LinkIcon = icon;
                    return (
                        <li className="nav-item" key={name} title={name}>
                            <Link
                                href={href!}
                                className={`nav-link opciones_menu ${pathname === href ? 'link-activo' : ''}`}
                            >
                                <LinkIcon className="icono_menu" />
                                <span className="nombre_opciones_menu">{name}</span>
                            </Link>
                        </li>
                    );
                })}

                {/* Dropdown personalizado */}
                <li className="nav-item dropdown" ref={dropdownRef}>
                    <button
                        className="nav-link opciones_menu bg-transparent border-0 "
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        {/* <FiUser className="icono_menu" /> */}
                        <FiAlignJustify className="icono_menu" title="Más opciones" />
                        <span className="nombre_opciones_menu">Cuenta</span>
                    </button>

                    {dropdownOpen && (
                        <ul className="dropdown-menu show position-absolute" style={{ minWidth: '10rem' }}>
                            <li>
                                <Link className="dropdown-item" href="/perfil">Ver perfil</Link>
                            </li>
                            <button className="dropdown-item buttonDropDown" onClick={() => setShowModal(true)}>
                                Cerrar sesión
                            </button>
                        </ul>
                    )}
                </li>
            </ul>
            {showModal && (
                <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar cierre de sesión</h5>
                                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>¿Estás seguro de que quieres cerrar sesión?</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleLogout}>
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>            
    );

}

