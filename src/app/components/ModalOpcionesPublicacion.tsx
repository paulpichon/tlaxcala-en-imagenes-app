'use client';

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
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Segundo Modal: imagen {selectedImage.id}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <p>Este es el segundo modal. Aquí puedes agregar más contenido.</p>
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
};
// Export
export default ModalOpcionesPublicacion;