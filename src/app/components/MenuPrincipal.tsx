// ***Menu principal de la aplicacion***
'use client';
// Feather Icons
// https://react-icons.github.io/react-icons/icons/fi/
import { FiHome, 
    FiBell, 
    FiPlusCircle, 
    FiSliders, 
    FiUser, 
} from "react-icons/fi";

export default function MenuPrincipal() {
    return (
        <>
            <ul className="nav justify-content-center menu_inferior_lateral">
                <li className="nav-item">
                    <a className="nav-link opciones_menu" aria-current="page" data-bs-toggle="tooltip" data-bs-placement="top" title="Inicio" href="#">
                        {/* <!--https://feathericons.com/--> */}
                        {/* <i  data-feather="home"></i> */}
                        <FiHome className="icono_menu" />
                        <span className="nombre_opciones_menu">Home</span>
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link opciones_menu" data-bs-toggle="tooltip" data-bs-placement="right" title="Notificaciones" href="#">
                        {/* <!--https://feathericons.com/--> */}
                        {/* <i  data-feather="bell"></i> */}
                        <FiBell className="icono_menu" />
                        <span className="nombre_opciones_menu">Notificaciones</span>
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link opciones_menu postear" data-bs-toggle="tooltip" data-bs-placement="right" title="Postear una imágen" href="#">
                        {/* <!--https://feathericons.com/--> */}
                        {/* <i  data-feather="plus-circle"></i> */}
                        <FiPlusCircle className="icono_menu" />
                        <span className="nombre_opciones_menu">Postear</span>
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link opciones_menu" data-bs-toggle="tooltip" data-bs-placement="right" title="Configuraciones" href="#">
                        {/* <!--https://feathericons.com/--> */}
                        {/* <i  data-feather="sliders"></i> */}
                        <FiSliders className="icono_menu" />
                        <span className="nombre_opciones_menu">Configuración</span>
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link opciones_menu" data-bs-toggle="tooltip" data-bs-placement="right" title="Perfil de usuario" href="#">
                        {/* <!--https://feathericons.com/--> */}
                        {/* <i  data-feather="user"></i> */}
                        <FiUser className="icono_menu" />
                        <span className="nombre_opciones_menu">Magaly Jimenez</span>
                    </a>
                </li>
            </ul>
        </>
    );
}