'use client';

import { useState, useRef, useEffect } from 'react';
import ToastGlobal from './ToastGlobal';
import { useAuth } from '@/context/AuthContext';
import { obtenerImagenPerfilUsuario } from '@/lib/cloudinary/obtenerImagenPerfilUsuario';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCamera } from 'react-icons/fi';
import { UsuarioLogueado } from '@/types/types';

interface CambiarImagenModalProps {
  usuario: UsuarioLogueado;
  show: boolean;
  onClose: () => void;
  onSuccess: (newUrl: string) => void;
}

export default function CambiarImagenModal({
  usuario,
  show,
  onClose,
  onSuccess,
}: CambiarImagenModalProps) {
  const { fetchWithAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'danger' | 'creacion' }>({
    message: '',
  });

  const [preview, setPreview] = useState<string | null>(
    obtenerImagenPerfilUsuario(usuario, 'perfil')
  );

  useEffect(() => {
    if (!show) {
      // 🔹 Limpiar el toast cuando se cierra el modal
      setToast({ message: '', type: undefined });
    }
  }, [show]);

  const handleSelectImage = () => fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setToast({ message: 'Subiendo imagen...', type: 'creacion' });

      const formData = new FormData();
      formData.append('img', file);

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/uploads/usuarios`,
        {
          method: 'PUT',
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Error al subir la imagen');

      // 🔥 Usar la versión optimizada desde Cloudinary
      const optimizedUrl = obtenerImagenPerfilUsuario(data.usuario, 'perfil');
      onSuccess(optimizedUrl);

      setToast({ message: 'Imagen actualizada correctamente', type: 'success' });
      setTimeout(() => onClose(), 1200);
    } catch (error) {
      console.error(error);
      setToast({ message: 'No se pudo subir la imagen', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75"
          style={{ zIndex: 2000 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* TOAST */}
          {toast.message && (
            <ToastGlobal
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ message: '', type: undefined })}
            />
          )}

          <motion.div
            className="bg-white rounded-4 p-4 shadow-lg text-center"
            style={{ maxWidth: 400, width: '90%' }}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <h5 className="mb-3">Cambiar imagen de perfil</h5>

            {/* 🔵 Contenedor circular con preview */}
            <div className="d-flex flex-column align-items-center mb-3">
              <div
                className="position-relative rounded-circle overflow-hidden mb-3"
                style={{
                  width: '150px',
                  height: '150px',
                }}
              >
                <Image
                  src={preview || obtenerImagenPerfilUsuario(usuario, 'perfil')}
                  alt="Vista previa"
                  fill
                  className="object-cover rounded-circle"
                />
              </div>

              <button
                onClick={handleSelectImage}
                className="btn btn-light btn-sm d-flex align-items-center gap-2"
                disabled={loading}
              >
                <FiCamera /> Seleccionar imagen
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              accept="image/*"
              onChange={handleChange}
            />

            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={loading || !fileInputRef.current?.files?.length}
              >
                {loading ? 'Subiendo...' : 'Guardar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
