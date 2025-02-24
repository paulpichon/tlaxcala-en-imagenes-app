'use client';
// Module CSS
import perfil from "../ui/perfil/perfil.module.css";
// Interface props del segundo modal: info del usuario
interface PropsModalOpcionesPublicacion {
  isOpen: boolean;
  selectedImage: { id: number; src: string } | null;
  onClose: () => void;
};

const ModalOpcionesPublicacion: React.FC<PropsModalOpcionesPublicacion> = ({ isOpen, selectedImage, onClose }) => {
    if (!isOpen || !selectedImage) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      	<div className="modal-dialog modal-dialog-centered">
			<div className="modal-content">
				{/* <div className="modal-header">
				// Muestra el ID del usuario con la imagen seleccionada
				<h5 className="modal-title">{selectedImage.id}</h5>
				</div> */}
				<div className="modal-body">
					<div className="row text-center">
						<div className="col-md-12">
							<a id="seguir_usuario" type="button" className={`${perfil.btn_opciones_publicaciones} ${perfil.btn_seguir}`} href="#">
								Seguir
							</a>
						</div>
						<div className="col-md-12">
							<a type="button" className={`${perfil.btn_opciones_publicaciones} ${perfil.btn_rojo}`} data-toggle="modal" data-target="#modalDenuncia">
								Denunciar
							</a>
						</div>
						<div className="col-md-12">
							<a type="button" className={`${perfil.btn_opciones_publicaciones}`} href="#">
								Añadir a favoritos
							</a>
						</div>
						<div className="col-md-12">
							<a href="#" type="button" className={`${perfil.btn_opciones_publicaciones}`}>
								Ir a la publicación
							</a>
						</div>
						<div className="col-md-12">
							<a type="button" className={`${perfil.btn_opciones_publicaciones}`} onClick={onClose}>
								Cancelar
							</a>
						</div>
					</div>
				</div>
			</div>
      	</div>
    </div>
  );
};
// Export
export default ModalOpcionesPublicacion;