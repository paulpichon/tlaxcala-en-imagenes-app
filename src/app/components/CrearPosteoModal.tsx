'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { posteoSchema, posteoBaseSchema } from "@/lib/validaciones";
import { ZodError } from "zod";

interface Props {
  show: boolean;
  onClose: () => void;
  onPostCreated?: () => void; // 👈 Nueva prop para actualizar el feed
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

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTexto("");
    setPosteoPublico(true);
    setErrors([]);
  };

  // 🔹 Auto-cierre del toast a los 5s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;

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

      // 🔹 Mostramos toast de éxito
      setToastMessage("¡Tu publicación se creó con éxito!");
      setToastType("success");

      // 🔹 NUEVO: Llamar al callback para actualizar el feed
      if (onPostCreated) {
        onPostCreated();
      }

      // 🔹 Cerramos modal después de un pequeño delay
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
                <input type="file" accept="image/*" onChange={handleFileChange} />
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
                className="btn btn-primary"
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

      {/* Toast (z-index más alto que el overlay) */}
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
                  className="btn btnCancelar"
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