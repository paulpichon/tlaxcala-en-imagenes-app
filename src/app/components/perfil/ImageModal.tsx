'use client';
// Image nextjs
import Image from "next/image";
// Types/interface
// import ImageData from "@/app/types/types";
// Icono
import { FiHeart, FiMoreHorizontal } from "react-icons/fi";

// type
type FirstModalProps = {
  isOpen: boolean;
  selectedImage: { id: number; src: string } | null;
  onClose: () => void;
  onNext: () => void;
};

const ImageModal: React.FC<FirstModalProps> = ({ isOpen, selectedImage, onClose, onNext }) => {
  if (!isOpen || !selectedImage) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            {/* <h5 className="modal-title">{image.title}</h5> */}
            <button
              type="button"
              className="btn_opciones_modal"
              aria-label="Options"
              onClick={onNext}
            >
              <FiMoreHorizontal />
            </button>
            {/* Boton para cerrar la ventana */}
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose} 
              aria-label="Close">
            </button>
          </div>
          <div className="contenedor_imagen_expandida">
            <Image
              src={selectedImage.src}
              alt={`Imagen ${selectedImage.id}`} 
              width={800}
              height={600}
              className="img-fluid"
              // style={{ objectFit: "cover" }}
            />
            {/* <p>{image.description}</p> */}
          </div>
          <div className="footer_publicacion">
            <button id="likeButton" data-post-id="POST_ID" className="like-button">
                {/* <!--https://feathericons.com/--> */}
                <FiHeart />
            </button>
            <p id="likeCount" className="d-inline votaciones">10009</p>
            <strong>Me gusta</strong>
		   		</div>
        </div>
      </div>
    </div>
  );
}
// Export
export default ImageModal;