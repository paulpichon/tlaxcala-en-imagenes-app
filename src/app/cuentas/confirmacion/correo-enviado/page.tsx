// Use client.
"use client"
// import Link from "next/link";
// Image next
// import Image from "next/image";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Componente
import CorreoEnviado from "../components/CorreoEnviado";
// estilos de la pagina son iguales para correo-enviado y para correo-enviado.restablecer-password
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