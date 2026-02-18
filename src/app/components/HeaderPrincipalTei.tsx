// Componente header de index, cuentas, crear-cuenta, login de TLAXCALA EN IMAGENES por TAD
import Image from "next/image";

import iconoTlaxapp from "@/../public/assets/icono-tlaxapp-beige.png";

export function HeaderPrincipalTei() {
  return (
    <div className="col-md-12 text-center mb-4">
      <Image
        src={iconoTlaxapp}
        alt="TlaxApp"
        width={85}
        height={85}
        priority
        style={{ marginBottom: "0.75rem" }}
      />

      <h1 className="titulo_principal_h1">TlaxApp</h1>
      <p className="subtitulo_h6">La red social de Tlaxcala.</p>
    </div>
  );
}
