'use client';

import Image from "next/image";
import { FiCamera, FiEdit3, FiImage, FiLock, FiMapPin } from "react-icons/fi";
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
    detectarUbicacion,
    lat,
    lng,
    municipioId,
    ciudad,
    estado,
    pais,
    localidad,
    localidadCercana,
    setMunicipioId,
    setCiudad,
    setEstado,
    setPais,
    setLocalidad,
    setLat,
    setLng,
    loadingUbicacion,
    ubicacionError,
  } = useCrearPosteo(onPostCreated, handleSuccess);

  // ✅ Se ejecuta solo cuando el posteo se crea correctamente
  function handleSuccess() {
    setToastMessage("¡Tu publicación se creó con éxito! 🎉");
    setToastType("creacion");

    // Cerramos el modal primero
    onClose();
  }

  // ✅ Mostrar errores como toast
  useEffect(() => {
    if (errors.length > 0) {
      setToastMessage(errors[0]); // Mostrar el primer error
      setToastType("danger");
    }
  }, [errors]);

  // -------------------------
  // 📍 QUITAR UBICACIÓN
  // -------------------------
  const eliminarUbicacion = () => {
    setMunicipioId(null);
    setCiudad(null);
    setEstado(null);
    setPais(null);
    setLocalidad(null);
    setLat(null);
    setLng(null);
  };

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
                        <h6 className="fw-bold mb-0">
                          <FiMapPin size={18} style={{ color: "#EBCA9A" }} className="me-1" />
                          Ubicación
                        </h6>

                        {/* Ícono de obtener ubicación (GPS) */}
                        {!ciudad && !loadingUbicacion && (
                          <button
                            onClick={detectarUbicacion}
                            className="iconLocationBtn"
                            type="button" // Siempre define el tipo en botones dentro de forms
                            title="Detectar ubicación automáticamente"
                          >
                            <FiMapPin size={20} />
                          </button>
                        )}

                        {/* Botón para quitar ubicación */}
                        {(ciudad || municipioId) && (
                          <button
                            onClick={eliminarUbicacion}
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                          >
                            Quitar
                          </button>
                        )}
                      </div>

                      {loadingUbicacion && (
                        <p className="small text-muted mb-0">Obteniendo ubicación…</p>
                      )}

                      {ciudad && (
                        <div className="alert alert-success py-2 px-3 mb-2">
                          <strong>{ciudad}</strong>, {estado}, {pais}
                          {/* Sugerencia del reverse geocoding (informativa;
                              la localidad vigente es la del select) */}
                          {lat && lng && localidadCercana && (
                            <span className="d-block small mt-1">
                              📍 Cerca de <strong>{localidadCercana.nombre}</strong> (~{Math.round(localidadCercana.distancia_metros)} m)
                            </span>
                          )}
                          <div className="small mt-1">
                            {lat && lng ? (
                              <span className="text-success">✨ Detectada automáticamente</span>
                            ) : (
                              <span className="text-success">🖐️ Selección manual</span>
                            )}
                          </div>
                        </div>
                      )}

                      {ubicacionError && (
                        <div className="alert alert-warning py-2 px-3 mb-2">
                          No se pudo detectar la ubicación automáticamente
                        </div>
                      )}

                      {/* Selector manual en cascada (municipio → localidad) */}
                      <ManualMunicipioSelector
                        municipio={municipioId}
                        localidadClave={localidad?.clave ?? null}
                        onSelect={(id, data, localidadSel) => {
                          // Cambiar de municipio abandona el GPS detectado
                          // (las coordenadas corresponden al municipio anterior).
                          // Cambiar sólo la localidad conserva lat/lng (esExacta: true).
                          if (id !== municipioId) {
                            setLat(null);
                            setLng(null);
                          }
                          setMunicipioId(id);
                          setCiudad(data.ciudad);
                          setEstado(data.estado);
                          setPais(data.pais);
                          setLocalidad(localidadSel);
                        }}
                      />
                    </div>

                    {/* ========================== */}
                    {/* 📝 SECCIÓN: DESCRIPCIÓN    */}
                    {/* ========================== */}

                    <div className="border rounded p-3 mb-3 bg-light">
                      <h6 className="fw-bold mb-2">
                        <FiEdit3 size={18} style={{ color: "#EBCA9A" }} className="me-1" />
                        Descripción
                      </h6>

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
                      <h6 className="fw-bold mb-3">
                        <FiLock size={18} style={{ color: "#EBCA9A" }} className="me-1" />
                        Privacidad
                      </h6>

                      <div className="d-flex gap-3">
                        {/* Público */}
                        <div
                          className={`p-3 rounded border flex-fill btn ${
                            posteoPublico ? "border-primary bg-white shadow-sm" : "bg-light"
                          }`}
                          onClick={() => setPosteoPublico(true)}
                        >
                          <div className="fw-bold">Público</div>
                          <small className="text-muted">
                            Aparecerá en el inicio de todos los usuarios y en tu perfil.
                          </small>
                        </div>

                        {/* Privado */}
                        <div
                          className={`p-3 rounded border flex-fill btn ${
                            !posteoPublico ? "border-primary bg-white shadow-sm" : "bg-light"
                          }`}
                          onClick={() => setPosteoPublico(false)}
                        >
                          <div className="fw-bold">Solo yo</div>
                          <small className="text-muted">
                            No se mostrará en el inicio de los demás, solo en tu perfil.
                          </small>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleClose}>
                  Cancelar
                </button>
                <button
                  className="btnPublicarDescartar"
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
                <p>¿Seguro que quieres descartar este post?</p>
                <p>Perderás la imagen y la descripción.</p>
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
                  className="btnPublicarDescartar"
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