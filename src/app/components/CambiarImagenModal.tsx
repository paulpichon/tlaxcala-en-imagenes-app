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
  const { fetchWithAuth, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'danger' | 'creacion' }>({
    message: '',
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 🔹 Al abrir/cerrar modal
  useEffect(() => {
    if (!show) {
      // 🔸 Resetear completamente cuando se cierra
      setPreview(null);
      setImageLoaded(false);
      setToast({ message: '', type: undefined });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      // 🔸 Cuando se abre, aseguramos el preview base (imagen actual)
      setPreview(obtenerImagenPerfilUsuario(usuario, 'perfil'));
      setImageLoaded(true);
    }
  }, [show, usuario]);

  const handleSelectImage = () => fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Solo se permiten archivos de imagen (JPG, JPEG, PNG, WebP...)', type: 'danger' });
      e.target.value = '';
      return;
    }

    // ✅ Validar tamaño (máx. 5 MB)
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setToast({ message: `La imagen no debe superar los ${maxSizeMB} MB`, type: 'danger' });
      e.target.value = '';
      return;
    }

    // ✅ Si todo es válido, mostrar preview
    setPreview(URL.createObjectURL(file));
    setImageLoaded(false);
    setToast({ message: 'Imagen lista para subir', type: 'creacion' });
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setToast({ message: 'Selecciona una imagen antes de continuar', type: 'danger' });
      return;
    }

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

      // ✅ Obtener versión optimizada
      const optimizedUrl = obtenerImagenPerfilUsuario(data.usuario, 'perfil');
      onSuccess(optimizedUrl);

      // ✅ Actualizar usuario global
      updateUser({ imagen_perfil: data.usuario.imagen_perfil });

      setToast({ message: 'Imagen actualizada correctamente', type: 'success' });

      // 🔹 Cerrar modal después de un corto delay
      setTimeout(() => {
        onClose();
      }, 1300);
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
          {/* ✅ Toast visual */}
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

            {/* 🌀 Contenedor con efecto de blur en el preview */}
            <div className="d-flex flex-column align-items-center mb-3">
              <div
                className="position-relative rounded-circle overflow-hidden mb-3"
                style={{
                  width: '150px',
                  height: '150px',
                  backgroundColor: '#f5f5f5',
                  filter: imageLoaded ? 'none' : 'blur(10px)',
                  transition: 'filter 0.5s ease',
                }}
              >
                {preview && (
                  <Image
                    src={preview}
                    alt="Vista previa"
                    fill
                    className="object-cover rounded-circle"
                    onLoadingComplete={() => setImageLoaded(true)}
                  />
                )}
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
                className="btnGuardarCambiarMedium"
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
