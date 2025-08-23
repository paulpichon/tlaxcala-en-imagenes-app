'use client';
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FiHome, FiBell, FiPlusCircle, FiSliders, FiAlignJustify } from "react-icons/fi";
import Image from "next/image";

export default function MenuPrincipal() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLLIElement>(null);
    const [showModal, setShowModal] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/cuentas/login');
    };

    const links = [
        { name: 'Inicio', href: '/inicio', icon: FiHome },
        { name: 'Notificaciones', href: '/notificaciones', icon: FiBell },
        { name: 'Postear', href: '/postear', icon: FiPlusCircle },
        { name: 'Configuraciones', href: '/configuraciones', icon: FiSliders },
        { 
            name: `${user?.nombre_completo?.nombre} ${user?.nombre_completo?.apellido}`, 
            href: `/perfil/${user?.url}`, 
            // guardamos la URL de la imagen en lugar del icono
            image: user?.imagen_perfil?.url 
        },
    ];

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

    useEffect(() => {
        document.body.style.overflow = showModal ? 'hidden' : 'auto';
    }, [showModal]);

    return (
        <nav>
            <ul className="nav justify-content-center menu_inferior_lateral">
                {links.map(({ name, href, icon: LinkIcon, image }) => (
                    <li className="nav-item" key={name} title={name}>
                        <Link
                            href={href!}
                            className={`nav-link opciones_menu ${pathname === href ? 'link-activo' : ''}`}
                        >
                            {/* Si existe imagen, mostramos la foto de perfil, sino el icono */}
                            {image ? (
                                <Image 
                                    src={image} 
                                    alt={name} 
                                    width={100}
                                    height={100}
                                    className="rounded-circle icono_menu" 
                                    style={{ width: "30px", height: "30px", objectFit: "cover" }}
                                />
                            ) : (
                                LinkIcon && <LinkIcon className="icono_menu" />
                            )}
                            <span className="nombre_opciones_menu">{name}</span>
                        </Link>
                    </li>
                ))}

                {/* Dropdown */}
                <li className="nav-item dropdown" ref={dropdownRef}>
                    <button
                        className="nav-link opciones_menu bg-transparent border-0 "
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <FiAlignJustify className="icono_menu" title="Más opciones" />
                        <span className="nombre_opciones_menu">Cuenta</span>
                    </button>

                    {dropdownOpen && (
                        <ul className="dropdown-menu show position-absolute" style={{ minWidth: '10rem' }}>
                            <li>
                                <Link className="dropdown-item" href={`/perfil/${user?.url}`}>Ver perfil</Link>
                            </li>
                            <button className="dropdown-item buttonDropDown" onClick={() => setShowModal(true)}>
                                Cerrar sesión
                            </button>
                        </ul>
                    )}
                </li>
            </ul>

            {/* Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirmar cierre de sesión</h5>
                            </div>
                            <div className="modal-body text-center">
                                <p>¿Estás seguro de que quieres cerrar sesión?</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btnCancelar" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="button" className="btn btnCerrarSesion" onClick={handleLogout}>
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
