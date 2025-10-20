// components/PublicacionesUsuarioGridItem.tsx
import Image from "next/image";
import perfil from "../ui/perfil/perfil.module.css";
import { Posteo } from "@/types/types";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";

interface Props {
  posteo: Posteo;
  onClick: (posteo: Posteo) => void;
}

export default function PublicacionesUsuarioGridItem({ posteo, onClick }: Props) {
  return (
    <div className="col-6 col-sm-6 col-md-4 col-lg-4">
      <div className="card">
        <Image
          src={getCloudinaryUrl(posteo.public_id, "grid")}
          alt={posteo.texto}
          width={200}
          height={200}
          className={`${perfil.imagen_grid_perfil_usuario} gallery-image`}
          style={{ cursor: "pointer" }}
          onClick={() => onClick(posteo)}
        />
      </div>
    </div>
  );
}
