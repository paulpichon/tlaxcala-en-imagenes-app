'use client';

import { useState, useRef, useEffect } from 'react';
import ToastGlobal from './ToastGlobal';
import { useAuth } from '@/context/AuthContext';
import { obtenerImagenPerfilUsuario } from '@/lib/cloudinary/obtenerImagenPerfilUsuario';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCamera } from 'react-icons/fi';
import { imageFileSchema, MAX_IMAGEN_BYTES, MAX_IMAGEN_MB } from '@/lib/validaciones';
import { UsuarioLogueado, ApiResponse } from '@/types/types';
import { apiPut, getUserMessage } from '@/lib/apiClient';

interface CambiarImagenModalProps {
  currentImage: string; // 👈 nueva
  show: boolean;
  onClose: () => void;
  onSuccess: (newUrl: string) => void;
}

export default function CambiarImagenModal({
  currentImage,
  show,
  onClose,
  onSuccess,
}: CambiarImagenModalProps) {
  const { fetchWithAuth, updateUser, user } = useAuth();
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
      setPreview(null);
      setImageLoaded(false);
      setToast({ message: '', type: undefined });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setPreview(currentImage);
      setImageLoaded(false);
    }
  }, [show, currentImage]);

  const handleSelectImage = () => fileInputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validar la extension de la imagen a subir
    const result = imageFileSchema.safeParse(file);
    // Si el resultado de la validacion es un tipo no permitido
    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      setToast({ message: errorMessage, type: "danger" });
      e.target.value = '';
      return;
    }


    // ✅ Validar tamaño (máx. 8 MB)
    if (file.size > MAX_IMAGEN_BYTES) {
      setToast({ message: `La imagen no debe superar los ${MAX_IMAGEN_MB} MB`, type: 'danger' });
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

      const data = await apiPut<ApiResponse<{ imagen_perfil: UsuarioLogueado['imagen_perfil'] }>>(
        fetchWithAuth,
        '/api/uploads/usuarios',
        formData
      );

      const imagenPerfil = data.data.imagen_perfil;

      // ✅ Construir un UsuarioLogueado minimo para reutilizar el helper de Cloudinary
      const usuarioParcial: UsuarioLogueado = {
        ...(user ?? { uid: '', _id: '', correo: '', url: '', nombre_completo_changed_at: null, nombre_completo: { nombre: '', apellido: '' } }),
        imagen_perfil: imagenPerfil,
        nombre_completo_changed_at: user?.nombre_completo_changed_at ?? null,
      };

      // ✅ Obtener versión optimizada
      const optimizedUrl = obtenerImagenPerfilUsuario(usuarioParcial, 'perfil');
      onSuccess(optimizedUrl);

      // ✅ Actualizar usuario global
      updateUser({ imagen_perfil: imagenPerfil });

      setToast({ message: 'Imagen actualizada correctamente', type: 'success' });

      // 🔹 Cerrar modal después de un corto delay
      setTimeout(() => {
        onClose();
      }, 1300);
    } catch (error) {
      const msg = getUserMessage(error, 'actualizar_imagen_perfil');
      console.error(msg, error);
      setToast({ message: msg, type: 'danger' });
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
              <div style={{ 
                position: 'relative', 
                width: '150px',   // Define un tamaño fijo o responsivo
                height: '150px',  // Debe ser igual al ancho
                overflow: 'hidden', 
                borderRadius: '50%', // Asegura que el contenedor sea circular
                filter: imageLoaded ? 'none' : 'blur(10px)',
                transition: 'filter 0.5s ease',
              }}>
                {preview && (
                  <Image
                    key={preview}
                    src={preview}
                    alt="Vista previa"
                    fill 
                    sizes="150px" // Ayuda a Next.js a optimizar el tamaño de carga
                    style={{ objectFit: 'cover' }} // Se recomienda usar style o una clase CSS directa
                    className="rounded-circle"
                    onLoad={() => setImageLoaded(true)} // onLoadingComplete esta deprecado ahora es onLoad
                />
                )}
              </div>

              <button
                onClick={handleSelectImage}
                className="btn btn-light btn-sm d-flex align-items-center gap-2 mt-2"
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
                className="btnPublicarDescartar"
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
