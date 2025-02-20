// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Componente
import CorreoEnviado from "../components/CorreoEnviado";

export default function CrearCuenta() {
  return (
		<div className="container-fluid container-xl">
            <div className="row justify-content-center contenedor_principal">
               <CorreoEnviado />
            </div>
        </div>
    );
}