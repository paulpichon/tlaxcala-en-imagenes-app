// Funcion para el envio de correo de ayuda y soporte al usuario desde la pagina de ayuda y soporte
'use client';
// Importaciones
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiArrowLeft } from "react-icons/fi";
import { useAuth } from '@/context/AuthContext';
import ToastGlobal from '@/app/components/ToastGlobal';
import { z } from 'zod';
import ayudaSoporte from "@/app/ui/configuracion/AyudaSoporte.module.css";
// Validaciones
import { schemaAyudaSoporte } from '@/lib/validaciones';

export default function AyudaSoporte() {
  const router = useRouter();
  const { fetchWithAuth } = useAuth();

  const [tipoAyuda, setTipoAyuda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const [formErrors, setFormErrors] = useState<{
    tipo_problema?: string;
    descripcion_problema_usuario?: string;
  }>({});

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'danger' | 'creacion'>('creacion');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      const parsed = schemaAyudaSoporte.parse({
        tipo_problema: tipoAyuda,
        descripcion_problema_usuario: mensaje
      });

      setFormErrors({});
      setLoading(true);

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/ayuda-soporte/envio-correo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.msg || "Error al enviar solicitud");
      }

      setToastType('success');
      setToastMessage(
        `Solicitud enviada correctamente 🎟 Ticket: ${data.ticketId}`
      );

      setTipoAyuda('');
      setMensaje('');

    } catch (error: any) {

      if (error instanceof z.ZodError) {
        const errors: any = {};
        error.errors.forEach((err) => {
          errors[err.path[0]] = err.message;
        });
        setFormErrors(errors);
      } else {
        setToastType('danger');
        setToastMessage(error.message || "Error inesperado.");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-column bg-light vh-100">

        {/* Header */}
        <div className="bg-white border-bottom p-3">
          <div className="d-flex align-items-center justify-content-between">
            <button
              onClick={() => router.back()}
              className="btn btn-link text-dark p-2"
              style={{ fontSize: '24px' }}
            >
              <FiArrowLeft />
            </button>

            <h2 className="h5 mb-0 fw-bold flex-grow-1 text-center pe-5">
              Ayuda y soporte
            </h2>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-grow-1 overflow-auto p-4">
          <div className="container" style={{ maxWidth: '448px' }}>

            <div className="card shadow-sm border-0">
              <div className="card-body">

                <h6 className="fw-bold mb-3">
                  ¿En qué podemos ayudarte?
                </h6>

                <form onSubmit={handleSubmit} noValidate>

                  {/* Tipo */}
                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      Tipo de ayuda
                    </label>

                    <select
                      className={`form-select ${formErrors.tipo_problema ? 'is-invalid' : ''}`}
                      value={tipoAyuda}
                      onChange={(e) => {
                        setTipoAyuda(e.target.value);
                        setFormErrors(prev => ({ ...prev, tipo_problema: undefined }));
                      }}
                      disabled={loading}
                    >
                      <option value="">Selecciona una opción</option>
                      <option value="cuenta">Problemas con mi cuenta</option>
                      <option value="publicacion">Problemas con una publicación</option>
                      <option value="seguridad">Seguridad o acceso</option>
                      <option value="reporte">Reportar usuario</option>
                      <option value="otro">Otro</option>
                    </select>

                    {formErrors.tipo_problema && (
                      <div className="invalid-feedback">
                        {formErrors.tipo_problema}
                      </div>
                    )}
                  </div>

                  {/* Mensaje */}
                  <div className="mb-2">
                    <label className="form-label small text-muted">
                      Describe tu problema
                    </label>

                    <textarea
                      className={`form-control ${formErrors.descripcion_problema_usuario ? 'is-invalid' : ''}`}
                      rows={4}
                      maxLength={1000}
                      placeholder="Explícanos con el mayor detalle posible..."
                      value={mensaje}
                      onChange={(e) => {
                        setMensaje(e.target.value);
                        setFormErrors(prev => ({ ...prev, descripcion_problema_usuario: undefined }));
                      }}
                      disabled={loading}
                    />

                    {formErrors.descripcion_problema_usuario && (
                      <div className="invalid-feedback">
                        {formErrors.descripcion_problema_usuario}
                      </div>
                    )}
                  </div>

                  {/* Contador */}
                  <div className={`text-end small mb-3 ${
                    mensaje.length > 900 ? 'text-danger' : 'text-muted'
                  }`}>
                    {mensaje.length}/1000 caracteres
                  </div>

                  {/* Botón */}
                  <div className="d-grid">
                    <button
                      type="submit"
                      className={`${ayudaSoporte.btnGuardarCambiarMedium}`}
                      disabled={loading}
                    >
                      {loading ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                  </div>

                </form>

              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Toas de exito/error */}
      <ToastGlobal
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </>
  );
}
