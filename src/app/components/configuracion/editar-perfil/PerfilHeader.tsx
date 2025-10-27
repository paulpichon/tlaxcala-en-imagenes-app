// components/perfil/EditarPerfil/PerfilHeader.tsx
'use client';

import Image from 'next/image';
import { FiCamera } from 'react-icons/fi';

interface PerfilHeaderProps {
  url: string;
  imagenPerfil: string;
  onCambiarFoto: () => void;
}

export default function PerfilHeader({ url, imagenPerfil, onCambiarFoto }: PerfilHeaderProps) {
  return (
    <div className="d-flex flex-column align-items-center p-4">
      <em className="fs-5 fw-bold mb-3">{`@${url}`}</em>
      <div className="position-relative mb-3">
        <div className="rounded-circle overflow-hidden position-relative" style={{ width: '128px', height: '128px' }}>
          <Image src={imagenPerfil} alt="Foto de perfil" fill className="object-cover rounded-circle" />
        </div>
        <button
          onClick={onCambiarFoto}
          className="iconoCambiarImgPerfil rounded-circle position-absolute bottom-0 end-0"
          style={{ width: '40px', height: '40px', border: '2px solid white' }}
        >
          <FiCamera size={20} />
        </button>
      </div>
      <button onClick={onCambiarFoto} className="btnGuardarCambiar">
        Cambiar foto
      </button>
    </div>
  );
}
