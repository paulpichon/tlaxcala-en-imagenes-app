'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { posteoSchema, posteoBaseSchema } from "@/lib/validaciones";
import { ZodError } from "zod";
import { Posteo } from "@/types/types";
import { FiCamera, FiImage } from "react-icons/fi";

interface Props {
  show: boolean;
  onClose: () => void;
  onPostCreated?: (newPost?: Posteo) => void;
}

export default function CrearPosteoModal({ show, onClose, onPostCreated }: Props) {
  const { fetchWithAuth } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [posteoPublico, setPosteoPublico] = useState(true);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "danger" | "info">("info");
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) || window.innerWidth <= 768;
    };

    setIsMobile(checkMobile());

    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTexto("");
    setPosteoPublico(true);
    setErrors([]);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const processFile = (f: File | null) => {
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }

    const result = posteoBaseSchema.pick({ file: true }).safeParse({ file: f });

    if (!result.success) {
      setErrors(result.error.errors.map((e) => e.message));
      setFile(null);
      setPreview(null);
      return;
    }

    setErrors((prev) =>
      prev.filter(
        (err) =>
          err !== "La imagen no debe superar los 5 MB" &&
          err !== "No se admite este archivo. Solo se permiten .jpg, .jpeg y .webp"
      )
    );

    setFile(f);
    setPreview(URL.createObjectURL(f));
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
    setFile(null);
    setPreview(null);
  };

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

  const handleSubmit = async () => {
    try {
      const dataToValidate = { texto, file, posteo_publico: posteoPublico };
      posteoSchema.parse(dataToValidate);
      setErrors([]);

      if (!file) return;
      setLoading(true);
      setToastMessage("Subiendo tu posteo...");
      setToastType("info");

      const formData = new FormData();
      formData.append("img", file);
      formData.append("texto", texto);
      formData.append("posteo_publico", String(posteoPublico));

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/posteos`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Error al crear posteo");

      const newPost = await res.json();

      setToastMessage("¡Tu publicación se creó con éxito!");
      setToastType("success");

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      setTimeout(() => {
        resetForm();
        onClose();
      }, 2500);

    } catch (err) {
      if (err instanceof ZodError) {
        setErrors(err.errors.map((e) => e.message));
      } else {
        console.error("Error creando posteo:", err);
        setErrors(["Ocurrió un error al crear la publicación"]);
        setToastMessage("Ocurrió un error al crear la publicación");
        setToastType("danger");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!show) resetForm();
  }, [show]);

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
                  <style jsx>{`
                    .upload-area {
                      border: 2px dashed #EBCA9A;
                      border-radius: 16px;
                      padding: 60px 20px;
                      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
                      cursor: pointer;
                      transition: all 0.3s ease;
                    }
                    .upload-area:hover {
                      border-color: #EBCA9A;
                      background: linear-gradient(135deg, #e7f1ff 0%, #f8f9ff 100%);
                      transform: translateY(-2px);
                      box-shadow: 0 8px 16px rgba(235, 202, 154, 0.1);
                    }
                    .upload-icon {
                      font-size: 48px;
                      margin-bottom: 16px;
                      animation: bounce 2s infinite;
                    }
                    @keyframes bounce {
                      0%, 100% { transform: translateY(0); }
                      50% { transform: translateY(-10px); }
                    }
                    .upload-text {
                      font-size: 18px;
                      font-weight: 600;
                      color: #212529;
                      margin-bottom: 8px;
                    }
                    .upload-hint {
                      font-size: 14px;
                      color: #6c757d;
                    }
                    .format-badge {
                      display: inline-block;
                      padding: 6px 12px;
                      background: #e7f1ff;
                      color: #EBCA9A;
                      border-radius: 20px;
                      font-size: 12px;
                      font-weight: 600;
                      margin: 4px;
                    }
                    .camera-buttons {
                      display: flex;
                      gap: 10px;
                      justify-content: center;
                      margin-top: 20px;
                    }
                    .camera-btn {
                      padding: 12px 24px;
                      border: 2px solid #EBCA9A;
                      border-radius: 12px;
                      background: white;
                      color: #EBCA9A;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.3s ease;
                      display: flex;
                      align-items: center;
                      gap: 8px;
                    }
                    .camera-btn:hover {
                      background: #EBCA9A;
                      color: white;
                      transform: translateY(-2px);
                    }
                    .camera-btn.primary {
                      background: #EBCA9A;
                      color: white;
                    }
                    .camera-btn.primary:hover {
                      background: #EBCA9A;
                    }
                  `}</style>
                  
                  <label 
                    htmlFor="imageInput" 
                    className="upload-area w-100"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="upload-icon">📸</div>
                    <div className="upload-text">
                      {isMobile ? 'Toca para seleccionar o tomar foto' : 'Arrastra tu imagen aquí'}
                    </div>
                    <div className="upload-hint">
                      {isMobile ? 'Puedes usar tu cámara o galería' : 'o haz clic para seleccionar'}
                    </div>
                    <div className="mt-3">
                      <span className="format-badge">JPG</span>
                      <span className="format-badge">PNG</span>
                      <span className="format-badge">WEBP</span>
                    </div>
                  </label>
                  
                  {/* Input principal - Galería */}
                  <input 
                    type="file" 
                    id="imageInput"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {/* Botones adicionales en móvil */}
                  {isMobile && (
                    <div className="camera-buttons">
                      <label htmlFor="cameraInput" className="camera-btn primary">
                        {/* 📷 Tomar foto */}
                        <FiCamera /> Tomar foto
                      </label>
                      <label htmlFor="galleryInput" className="camera-btn">
                        <FiImage /> Galería
                        {/* 🖼️ Galería */}
                      </label>

                      {/* Input para cámara */}
                      <input 
                        type="file" 
                        id="cameraInput"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />

                      {/* Input para galería */}
                      <input 
                        type="file" 
                        id="galleryInput"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Imagen con botón overlay */}
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

                  {/* Descripción con contador */}
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

                  {/* Radios de privacidad */}
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

                  {/* Guía de privacidad */}
                  <div className="mt-2 text-muted small text-start">
                    {posteoPublico ? (
                      <p>
                        🔓 <strong>Público:</strong> tu publicación aparecerá en el inicio de todos los usuarios, además de en tu perfil.
                      </p>
                    ) : (
                      <p>
                        🔒 <strong>Solo yo:</strong> tu publicación <u>no</u> se mostrará en el inicio de los demás. Solo estará visible en tu perfil.
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

      {/* Overlay con spinner */}
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

      {/* Toast */}
      {toastMessage && (
        <div
          className="toast-container position-fixed bottom-0 end-0 p-3"
          style={{ zIndex: 3000 }}
        >
          <div
            className={`toast align-items-center text-bg-${toastType} border-0 show`}
            role="alert"
          >
            <div className="d-flex">
              <div className="toast-body">{toastMessage}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToastMessage("")}
              ></button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de descarte */}
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
                <p>
                  ¿Seguro que quieres descartar este post? <br />
                  Perderás la imagen y la descripción.
                </p>
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