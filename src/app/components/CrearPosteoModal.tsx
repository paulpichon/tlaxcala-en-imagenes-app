'use client';

import Image from "next/image";
import { FiCamera, FiImage } from "react-icons/fi";
import { Posteo } from "@/types/types";
import { useCrearPosteo } from "../hooks/useCrearPosteo";
// import posteo from "@/posteo/CrearPosteoModal.module.css";
// import posteo from "./ui/page.module.css";
import posteo from "../ui/posteos/CrearPosteoModal.module.css";

interface Props {
  show: boolean;
  onClose: () => void;
  onPostCreated?: (newPost?: Posteo) => void;
}

export default function CrearPosteoModal({ show, onClose, onPostCreated }: Props) {
  const {
    file,
    preview,
    texto,
    posteoPublico,
    loading,
    showConfirmDiscard,
    errors,
    toastMessage,
    toastType,
    isMobile,
    setTexto,
    setPosteoPublico,
    setShowConfirmDiscard,
    processFile,
    handleSubmit,
    resetForm,
  } = useCrearPosteo(onPostCreated, onClose);

  const handleClose = () => {
    if (file || texto.trim() !== "") {
      setShowConfirmDiscard(true);
    } else {
      resetForm();
      onClose();
    }
  };

  const confirmDiscard = () => {
    resetForm();
    setShowConfirmDiscard(false);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    processFile(f);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0] || null;
    processFile(f);
  };

  const handleRemoveImage = () => {
    processFile(null);
  };

  if (!show) return null;

  return (
    <>
      {/* Modal principal */}
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content p-3">
            <div className="modal-header">
              <h5 className="modal-title">Crear publicación</h5>
              <button type="button" className="btn-close" onClick={handleClose}></button>
            </div>

            <div className="modal-body text-center">
              {!preview ? (
                <>
                  <label
                    htmlFor="imageInput"
                    className={`${posteo.uploadArea} w-100`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className={posteo.uploadIcon}>📸</div>
                    <div className={posteo.uploadText}>
                      {isMobile ? "Toca para seleccionar o tomar foto" : "Arrastra tu imagen aquí"}
                    </div>
                    <div className={posteo.uploadHint}>
                      {isMobile ? "Puedes usar tu cámara o galería" : "o haz clic para seleccionar"}
                    </div>
                    <div className="mt-3">
                      <span className={posteo.formatBadge}>JPG</span>
                      <span className={posteo.formatBadge}>PNG</span>
                      <span className={posteo.formatBadge}>WEBP</span>
                    </div>
                  </label>

                  {/* Input principal */}
                  <input
                    type="file"
                    id="imageInput"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />

                  {/* Botones extra en móvil */}
                  {isMobile && (
                    <div className={posteo.cameraButtons}>
                      <label htmlFor="cameraInput" className={`${posteo.cameraBtn} ${posteo.primary}`}>
                        <FiCamera /> Tomar foto
                      </label>
                      <label htmlFor="galleryInput" className={posteo.cameraBtn}>
                        <FiImage /> Galería
                      </label>

                      <input
                        type="file"
                        id="cameraInput"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      <input
                        type="file"
                        id="galleryInput"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Imagen seleccionada */}
                  <div className="position-relative d-inline-block mb-3">
                    <Image
                      src={preview}
                      alt="preview"
                      width={300}
                      height={300}
                      className="img-fluid rounded"
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow"
                      style={{ opacity: 0.8 }}
                      onClick={handleRemoveImage}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Descripción */}
                  <div className="mb-2">
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Escribe una descripción..."
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      maxLength={200}
                    />
                    <div className="text-end small text-muted">
                      {texto.length}/200
                    </div>
                  </div>

                  {/* Privacidad */}
                  <div className="d-flex justify-content-around mt-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="privacidad"
                        id="publicoRadio"
                        checked={posteoPublico}
                        onChange={() => setPosteoPublico(true)}
                      />
                      <label className="form-check-label" htmlFor="publicoRadio">
                        Público
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="privacidad"
                        id="privadoRadio"
                        checked={!posteoPublico}
                        onChange={() => setPosteoPublico(false)}
                      />
                      <label className="form-check-label" htmlFor="privadoRadio">
                        Solo yo
                      </label>
                    </div>
                  </div>

                  <div className="mt-2 text-muted small text-start">
                    {posteoPublico ? (
                      <p>
                        🔓 <strong>Público:</strong> aparecerá en el inicio de todos los usuarios y en tu perfil.
                      </p>
                    ) : (
                      <p>
                        🔒 <strong>Solo yo:</strong> no se mostrará en el inicio de los demás, solo en tu perfil.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Errores */}
              {errors.length > 0 && (
                <div className="alert alert-danger mt-3 text-start">
                  <ul className="mb-0">
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleClose}>
                Cancelar
              </button>
              <button
                className="btn btnCancelar"
                disabled={loading || !file}
                onClick={handleSubmit}
              >
                {loading ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay loading */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 2000 }}
        >
          <div className="spinner-border text-light" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Subiendo...</span>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 3000 }}>
          <div className={`toast align-items-center text-bg-${toastType} border-0 show`} role="alert">
            <div className="d-flex">
              <div className="toast-body">{toastMessage}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setShowConfirmDiscard(false)}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar descarte */}
      {showConfirmDiscard && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Descartar publicación</h5>
              </div>
              <div className="modal-body text-center">
                <p>¿Seguro que quieres descartar este post? Perderás la imagen y la descripción.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmDiscard(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btnCerrarSesion" onClick={confirmDiscard}>
                  Descartar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
