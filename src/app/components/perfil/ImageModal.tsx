// Image nextjs
import Image from "next/image";
// Types/interface
import ImageData from "@/app/types/types";
// Interface props del modal
interface ImageModalProps {
  image: ImageData;
  onClose: () => void;
}

export default function ImageModal({ image, onClose }: ImageModalProps) {
  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{image.title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <Image
              src={image.src}
              alt={image.title}
              width={800}
              height={600}
              className="img-fluid rounded mb-3"
              style={{ objectFit: "cover" }}
            />
            <p>{image.description}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}