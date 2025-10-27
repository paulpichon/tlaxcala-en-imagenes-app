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
  } = useEditarPerfil();

  return (
    <div className="d-flex flex-column bg-light vh-100">
      {toast.message && (
        <ToastGlobal message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: undefined })} />
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

      <div className="flex-grow-1 overflow-auto p-4">
        <div className="container" style={{ maxWidth: '448px' }}>
          <PerfilHeader url={formData.url} imagenPerfil={imagenPerfil} onCambiarFoto={() => setShowModal(true)} />
          <PerfilForm
            formData={formData}
            errors={errors}
            municipios={municipios}
            loading={loading}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>

      {user && (
        <CambiarImagenModal usuario={user} show={showModal} onClose={() => setShowModal(false)} onSuccess={setImagenPerfil} />
      )}
    </div>
  );
}
