// Página de Ayuda y Soporte
// Esta página permite a un usuario autenticado enviar una solicitud de ayuda.
// Incluye validación con Zod, manejo de errores, contador de caracteres,
// prevención de doble envío y notificaciones globales.

// Indicamos que es un componente cliente (Client Component)
'use client';

// =============================
// 📦 IMPORTACIONES
// =============================

// Navegación programática de Next.js
import { useRouter } from 'next/navigation';

// React hooks
import { useState } from 'react';

// Icono de flecha para regresar
import { FiArrowLeft } from "react-icons/fi";

// Contexto de autenticación (para fetch con token)
import { useAuth } from '@/context/AuthContext';

// Componente global de notificaciones (toast)
import ToastGlobal from '@/app/components/ToastGlobal';

// Zod para validaciones
import { z } from 'zod';

// Estilos CSS Module
import ayudaSoporte from "@/app/ui/configuracion/AyudaSoporte.module.css";

// Esquema de validación externo
import { schemaAyudaSoporte } from '@/lib/validaciones';

// Link de Next.js para navegación interna
import Link from 'next/link';

export default function AyudaSoporte() {

  // =============================
  // 🔹 Hooks y estados
  // =============================

  const router = useRouter();
  const { fetchWithAuth } = useAuth();

  // Tipo de problema seleccionado
  const [tipoAyuda, setTipoAyuda] = useState('');

  // Mensaje escrito por el usuario
  const [mensaje, setMensaje] = useState('');

  // Estado de carga para prevenir doble envío
  const [loading, setLoading] = useState(false);

  // Errores del formulario (controlados manualmente)
  const [formErrors, setFormErrors] = useState<{
    tipo_problema?: string;
    descripcion_problema_usuario?: string;
  }>({});

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'danger' | 'creacion'>('creacion');

  // =============================
  // 🚀 Envío del formulario
  // =============================

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    // Previene doble envío si ya está cargando
    if (loading) return;

    try {

      // Validación con Zod
      const parsed = schemaAyudaSoporte.parse({
        tipo_problema: tipoAyuda,
        descripcion_problema_usuario: mensaje
      });

      // Limpiamos errores previos
      setFormErrors({});
      setLoading(true);

      // Petición autenticada al backend
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ayuda-soporte/envio-correo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data?.msg || "Demasiados tickets de soporte, intenta de nuevo más tarde");
        }
        throw new Error(data?.msg || "Error al enviar solicitud");
      }

      // Mostrar ticket de soporte
      setToastType('success');
      setToastMessage(
        `Solicitud enviada correctamente 🎟 Ticket: ${data.ticketId}`
      );

      // Limpiar formulario
      setTipoAyuda('');
      setMensaje('');

    } catch (error: any) {

      // Si el error viene de Zod
      if (error instanceof z.ZodError) {

        const errors: any = {};

        error.issues.forEach((err) => {
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

        {/* =============================
            🔹 HEADER
        ============================== */}
        <div className="bg-white border-bottom p-3">
          <div className="d-flex align-items-center justify-content-between">
            
            {/* Botón regresar */}
            <button
              onClick={() => router.back()}
              className="btn btn-link text-dark p-2"
              style={{ fontSize: '24px' }}
            >
              <FiArrowLeft />
            </button>

            {/* Título */}
            <h2 className="h5 mb-0 fw-bold flex-grow-1 text-center pe-5">
              Ayuda y soporte
            </h2>
          </div>
        </div>

        {/* =============================
            🔹 CONTENIDO PRINCIPAL
        ============================== */}
        <div className="flex-grow-1 p-4">
          <div className="container" style={{ maxWidth: '500px' }}>

            <div className="card shadow-sm border-0">
              <div className="card-body">

                <h6 className="fw-bold mb-3">
                  ¿En qué podemos ayudarte?
                </h6>

                <form onSubmit={handleSubmit} noValidate>

                  {/* =============================
                      🔹 SELECT TIPO PROBLEMA
                  ============================== */}
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

                  {/* =============================
                      🔹 TEXTAREA MENSAJE
                  ============================== */}
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

                  {/* =============================
                      🔹 CONTADOR CARACTERES
                  ============================== */}
                  <div className={`text-end small mb-3 ${
                    mensaje.length > 900 ? 'text-danger' : 'text-muted'
                  }`}>
                    {mensaje.length}/1000 caracteres
                  </div>

                  {/* =============================
                      🔹 BOTÓN ENVÍO
                  ============================== */}
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

                {/* =============================
                    🔹 SECCIÓN LEGAL
                ============================== */}
                <div className="mt-4 pt-3 border-top text-center small text-muted">
                  <p className="mb-2">
                    Al enviar esta solicitud aceptas nuestras políticas.
                  </p>

                  <div className="d-flex justify-content-center flex-wrap gap-2">

                    <Link 
                      href="/legal/politica-de-privacidad"
                      className="text-decoration-none fw-semibold"
                      target="_blank"
                    >
                      Política de privacidad
                    </Link>

                    <span>·</span>

                    <Link 
                      href="/legal/terminos-y-condiciones"
                      className="text-decoration-none fw-semibold"
                      target="_blank"
                    >
                      Términos y condiciones
                    </Link>

                    <span>·</span>

                    <Link 
                      href="/contacto"
                      className="text-decoration-none fw-semibold"
                      target="_blank"
                    >
                      Contacto
                    </Link>

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =============================
          🔹 TOAST GLOBAL
      ============================== */}
      <ToastGlobal
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </>
  );
}
