import Image from "next/image";
import perfil from "../../ui/perfil/perfil.module.css";
import { UsuarioLogueado } from "@/types/types";

export default function InformacionUsuarioPerfil({ usuario }: { usuario: UsuarioLogueado }) {
  return (
    <div className="row">
      <div className="col-4 col-sm-3 text-center">
        <Image
          src={usuario.imagen_perfil?.url || "/usuarios/default.jpg"}
          width={100}
          height={100}
          className={`${perfil.img_perfil_usuario} rounded-circle`}
          alt={usuario.nombre_completo.nombre}
        />
      </div>
      <div className="col-5 col-sm-7">
        <div className="informacion_usuario text-center">
          <h6 className={`${perfil.nombre_usuario_perfil}`}>
            {usuario.nombre_completo.nombre} {usuario.nombre_completo.apellido}
          </h6>
          <p>{usuario.lugar_radicacion?.nombre_estado || "Sin ubicación"}</p>
        </div>
      </div>
      <div className="col-3 col-sm-2">
        <div className={`${perfil.seguir_usuario} text-center`}>
          <button className={`${perfil.btn_seguir_usuario}`}>Seguir</button>
        </div>
      </div>
    </div>
  );
}
