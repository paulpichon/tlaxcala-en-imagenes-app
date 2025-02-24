// Componente informacion del usuario
// Hook
import Image from "next/image";
// Estilos de pagina
// modules css
import perfil from "../../ui/perfil/perfil.module.css";
export default function InformacionUsuarioPerfil() {
    return (
        <div className="row">
            <div className="col-4 col-sm-3 text-center">
                <Image 
                    src="/usuarios/tania.jpg" 
                    width={100}
                    height={200}
                    className={`${perfil.img_perfil_usuario} rounded-circle`}
                    alt="Magaly Jimenez"
                />
            </div>
            <div className="col-5 col-sm-7">
                <div className="informacion_usuario text-center">
                    <h6 className={`${perfil.nombre_usuario_perfil}`}>Magaly Jimenez</h6>
                    <div className="row">
                        <div className="col-12 col-sm-6 col-lg-6">
                            <p className={`${perfil.cantidad_imagenes_publicaciones}`}><span className={`${perfil.cantidad_numero}`}>124</span> imágenes</p>
                        </div>
                        <div className="col-12 col-sm-6 col-lg-6">
                            <p className={`${perfil.cantidad_seguidores}`}><span className={`${perfil.cantidad_numero}`}>1492</span> seguidores</p>
                        </div>
                    </div>
                    <p className={`${perfil.cantidad_likes}`}>
                        <i data-feather="heart"></i> <span className={`${perfil.cantidad_numero}`}>929</span> Yóllotls
                    </p>
                </div>
            </div>
            <div className="col-3 col-sm-2">
                <div className={`${perfil.seguir_usuario} text-center`}>
                    <button className={`${perfil.btn_seguir_usuario}`} id="" >Seguir</button>
                </div>
            </div>
        </div>
    );
}