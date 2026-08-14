// components/perfil/EditarPerfil/PerfilHeader.tsx
'use client';

import Image from 'next/image';
import { FiCamera } from 'react-icons/fi';
import { avatarPerfilLoader } from "@/lib/cloudinary/cloudinaryLoader";
// Estilos específicos de la página
import editarPerfil from "@/app/ui/configuracion/editar-perfil/EditarPerfil.module.css";

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
          <Image 
            priority
            src={imagenPerfil}
            loader={avatarPerfilLoader}
            alt="Foto de perfil" 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover rounded-circle" 
          />
        </div>
        <button
          onClick={onCambiarFoto}
          className={`${editarPerfil.iconoCambiarImgPerfil} rounded-circle position-absolute bottom-0 end-0`}
          style={{ width: '40px', height: '40px', border: '2px solid white' }}
        >
          <FiCamera size={20} />
        </button>
      </div>
      <button onClick={onCambiarFoto} className={editarPerfil.btnGuardarCambiar}>
        Cambiar foto
      </button>
    </div>
  );
}
