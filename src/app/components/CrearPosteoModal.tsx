'use client';

import Image from "next/image";
import { FiCamera, FiImage, FiMapPin  } from "react-icons/fi";
import { useCrearPosteo } from "../hooks/useCrearPosteo";
import posteo from "../ui/posteos/CrearPosteoModal.module.css";
import ToastGlobal from "./ToastGlobal";
import { useEffect, useState } from "react";
import { CrearPosteoModalProps } from "@/types/types";
import ManualMunicipioSelector from "./ManualMunicipioSelector";

export default function CrearPosteoModal({ show, onClose, onPostCreated }: CrearPosteoModalProps) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "danger" | "creacion">("creacion");

  // Hook con callback para el éxito
  const {
    file,
    preview,
    texto,
    posteoPublico,
    loading,
    showConfirmDiscard,
    errors,
    isMobile,
    setTexto,
    setPosteoPublico,
    setShowConfirmDiscard,
    processFile,
    handleSubmit,
    resetForm,
  
    // 🌍 ubicación
    obtenerUbicacion,
    municipio,
    ciudad,
    estado,
    pais,
    setMunicipio,
    setCiudad,
    setEstado,
    setPais,
    loadingUbicacion,
    ubicacionError,
  } = useCrearPosteo(onPostCreated, handleSuccess);
  ;  

  // ✅ Se ejecuta solo cuando el posteo se crea correctamente
  function handleSuccess() {
    setToastMessage("¡Tu publicación se creó con éxito!");
    setToastType("creacion");

    // Cerramos el modal primero
    onClose();
  }

  // Mantener visible el toast por unos segundos
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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

  const handleRemoveImage = () => processFile(null);

  return (
    <>
      {/* ✅ El modal solo se renderiza cuando show = true */}
      {show && (
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
                        {isMobile
                          ? "Puedes usar tu cámara o galería"
                          : "o haz clic para seleccionar"}
                      </div>
                      <div className="mt-3">
                        <span className={posteo.formatBadge}>JPG</span>
                        <span className={posteo.formatBadge}>JPEG</span>
                        <span className={posteo.formatBadge}>PNG</span>
                        <span className={posteo.formatBadge}>WEBP</span>
                      </div>
                    </label>

                    {/* Input de imagen */}
                    <input
                      type="file"
                      id="imageInput"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />

                    {isMobile && (
                      <div className={posteo.cameraButtons}>
                        <label
                          htmlFor="cameraInput"
                          className={`${posteo.cameraBtn} ${posteo.primary}`}
                        >
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
                    <div className="position-relative d-inline-block mb-4">
                      <Image
                        src={preview}
                        alt="preview"
                        width={320}
                        height={320}
                        className="img-fluid rounded shadow-sm"
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow"
                        style={{ opacity: 0.85 }}
                        onClick={handleRemoveImage}
                      >
                        ✕
                      </button>
                    </div>

                    {/* ========================== */}
                    {/* 📍 SECCIÓN: UBICACIÓN      */}
                    {/* ========================== */}

                    <div className="mt-4 border rounded p-3 mb-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0">📍 Ubicación</h6>

                      {/* Ícono de obtener ubicación */}
                      {!ciudad && !loadingUbicacion && (
                        <button
                          onClick={obtenerUbicacion}
                          className="iconLocationBtn"
                          title="Detectar ubicación"
                        >
                          <FiMapPin size={20} />
                        </button>
                      )}
                    </div>

                    {loadingUbicacion && <p className="small text-muted">Obteniendo ubicación…</p>}

                    {ciudad && (
                      <div className="alert alert-success py-2 px-3">
                        <strong>{ciudad}</strong>, {estado}, {pais}
                        <div className="small text-muted">Seleccionado automáticamente</div>
                      </div>
                    )}

                    {ubicacionError && (
                      <div className="alert alert-warning py-2 px-3">
                        No se pudo detectar la ubicación automática
                      </div>
                    )}
                       {/* Selector manual */}
                      <ManualMunicipioSelector
                        municipio={municipio}
                        onSelect={(id, data) => {
                          setMunicipio(id);
                          setCiudad(data.ciudad);
                          setEstado(data.estado);
                          setPais(data.pais);
                        }}
                      />
                    </div>

                    {/* ========================== */}
                    {/* 📝 SECCIÓN: DESCRIPCIÓN    */}
                    {/* ========================== */}

                    <div className="border rounded p-3 mb-3 bg-light">
                      <h6 className="fw-bold mb-2">📝 Descripción</h6>

                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Escribe una descripción..."
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        maxLength={200}
                      />

                      <div className="text-end small text-muted mt-1">
                        {texto.length}/200
                      </div>
                    </div>

                    {/* ========================== */}
                    {/* 🔐 SECCIÓN: PRIVACIDAD     */}
                    {/* ========================== */}

                    <div className="border rounded p-3 mb-3 bg-light">
                      <h6 className="fw-bold mb-3">🔐 Privacidad</h6>

                      <div className="d-flex gap-3">
                        {/* Público */}
                        <div
                          className={`p-3 rounded border flex-fill btn ${
                            posteoPublico ? "border-primary bg-white shadow-sm" : "bg-light"
                          }`}
                          onClick={() => setPosteoPublico(true)}
                        >
                          <div className="fw-bold">Público</div>
                          <small className="text-muted">Aparecerá en el inicio de todos los usuarios y en tu perfil.</small>
                        </div>

                        {/* Privado */}
                        <div
                          className={`p-3 rounded border flex-fill btn ${
                            !posteoPublico ? "border-primary bg-white shadow-sm" : "bg-light"
                          }`}
                          onClick={() => setPosteoPublico(false)}
                        >
                          <div className="fw-bold">Solo yo</div>
                          <small className="text-muted">No se mostrará en el inicio de los demás, solo en tu perfil.</small>
                        </div>
                      </div>
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
      )}

      {/* Overlay de carga */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 2000 }}
        >
          <div
            className="spinner-border text-light"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Subiendo...</span>
          </div>
        </div>
      )}

      {/* ✅ Toast siempre se renderiza fuera del modal */}
      <ToastGlobal
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      {/* Confirmar descarte */}
      {showConfirmDiscard && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Descartar publicación</h5>
              </div>
              <div className="modal-body text-center">
                <p>¿Seguro que quieres descartar este post? Perderás la imagen y la descripción.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmDiscard(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btnCerrarSesion"
                  onClick={confirmDiscard}
                >
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
