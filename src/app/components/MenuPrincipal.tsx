// ***Menu principal de la aplicacion***
'use client';
// Link
import Link from "next/link";
// Navegacion
import { usePathname } from "next/navigation";
// Feather Icons
// https://react-icons.github.io/react-icons/icons/fi/
import { FiHome, 
        FiBell, 
        FiPlusCircle, 
        FiSliders, 
        FiUser, 
} from "react-icons/fi";

// Navegacion
const links = [
    {name: 'Home', href:'/inicio', icon: FiHome,},
    {name: 'Notificaciones', href:'/notificaciones', icon: FiBell,},
    {name: 'Postear', href:'/postear', icon: FiPlusCircle,},
    {name: 'Configuraciones', href:'/configuraciones', icon: FiSliders,},
    {name: 'Perfil', href:'/perfil', icon: FiUser,},
];

export default function MenuPrincipal() {
    // Obtenemos la ruta actual
    const pathname = usePathname();

    return (
        <nav>
            <ul className="nav justify-content-center menu_inferior_lateral">
                {links.map(( { name, href, icon } ) => {
                    // Creacion de constante con el icono del menu
                    const LinkIcon = icon;
                    return(
                        <li className="nav-item" key={name} title={name}> 
                            <Link 
                                href={href}
                                className={`nav-link opciones_menu ${pathname === href ? 'link-activo' : ''}`}
                            >
                                {/* Icono de menu */}
                                <LinkIcon className="icono_menu" />
                                <span className="nombre_opciones_menu">{name}</span>
                            </Link>
                        </li>
                    )
                        
                })}
            </ul>
        </nav>
    );
}