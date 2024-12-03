// Link nextjs
// import Link from "next/link";
// Image next
// import Image from "next/image";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Componentes
import CorreoEnviado from "../components/CorreoEnviado";
// estilos de la pagina;
import "../../../ui/cuentas/confirmacion/correo-enviado/correo-enviado.css";

export default function CrearCuenta() {
    return (
		<div className="container-fluid container-xl">
            <div className="row justify-content-center contenedor_principal">
                <CorreoEnviado />
            </div>
        </div>
    );
}
