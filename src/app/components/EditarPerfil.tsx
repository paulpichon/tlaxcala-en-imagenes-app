// components/perfil/EditarPerfil/EditarPerfil.tsx
'use client';

import { FiArrowLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useEditarPerfil } from '../hooks/useEditarPerfil';
import ToastGlobal from './ToastGlobal';
import PerfilHeader from './configuracion/editar-perfil/PerfilHeader';
import PerfilForm from './configuracion/editar-perfil/PerfilForm';
import CambiarImagenModal from './CambiarImagenModal';

export default function EditarPerfil() {
  const router = useRouter();
  const {
    user,
    formData,
    errors,
    municipios,
    imagenPerfil,
    showModal,
    loading,
    toast,
    setToast,
    setShowModal,
    setImagenPerfil,
    handleChange,
    handleSubmit,
    estadoCooldown,
    submitDeshabilitado,
    nombreCambio,
  } = useEditarPerfil();

  return (
    <div className="d-flex flex-column bg-light vh-100">
      {toast.message && (
        <ToastGlobal message={toast.message} type={toast.type} duration={toast.duration} actions={toast.actions} onClose={() => setToast({ message: '' })} />
      )}

      {/* Header superior */}
      <div className="bg-white border-bottom p-3">
        <div className="d-flex align-items-center justify-content-between">
          <button onClick={() => router.back()} className="btn btn-link text-dark p-2" style={{ fontSize: '24px' }}>
            <FiArrowLeft />
          </button>
          <h2 className="h5 mb-0 fw-bold flex-grow-1 text-center pe-5">Editar perfil</h2>
        </div>
      </div>

      <div className="flex-grow-1 p-4">
        <div className="container mt-4" style={{ maxWidth: '500px' }}>
        <div className="bg-white shadow-sm rounded-4 p-4 border text-center">
            <PerfilHeader url={formData.url} imagenPerfil={imagenPerfil} onCambiarFoto={() => setShowModal(true)} />
            <PerfilForm
              formData={formData}
              errors={errors}
              municipios={municipios}
              loading={loading}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              estadoCooldown={estadoCooldown}
              submitDeshabilitado={submitDeshabilitado}
              nombreCambio={nombreCambio}
            />
          </div> 
        </div>
      </div>

      {user && (
        // Cualquier PROP que se necesite agregar o quitar, tambien debe de revisarse en el archivo InformacionUsuarioPerfil.tsx ya que es el que llama a este modal y se le pasan los props
        <CambiarImagenModal
          currentImage={imagenPerfil}
          show={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={(newUrl) => setImagenPerfil(newUrl)}
        />
      )}
    </div>
  );
}
