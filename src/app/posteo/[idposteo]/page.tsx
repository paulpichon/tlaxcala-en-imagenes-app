import { Metadata } from "next";
import { apiUrl } from "@/lib/apiClient";
import { getCloudinaryUrl } from "@/lib/cloudinary/getCloudinaryUrl";
import PosteoPageClient from "@/app/components/PosteoPageClient";
import "../../ui/inicio/Inicio.module.css";

type Props = {
  params: Promise<{ idposteo: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idposteo } = await params;

  try {
    const res = await fetch(apiUrl(`/api/posteos/post/${idposteo}`), {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return {
        title: "Publicación",
        robots: { index: false },
      };
    }

    const json = await res.json();
    const posteo = json.data?.posteo;

    if (!posteo) {
      return {
        title: "Publicación",
        robots: { index: false },
      };
    }

    const imageUrl = getCloudinaryUrl(posteo.public_id, "detalle");
    const nombreAutor = posteo._idUsuario?.nombre_completo
      ? `${posteo._idUsuario.nombre_completo.nombre} ${posteo._idUsuario.nombre_completo.apellido}`
      : "un usuario";
    const urlAutor = posteo._idUsuario?.url
      ? `@${posteo._idUsuario.url}`
      : "";

    const title = `Publicación de ${nombreAutor} ${urlAutor}`.trim();
    const description = posteo.texto || `Mira esta publicación de ${nombreAutor} en TlaxApp`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: imageUrl, width: 1080, height: 1080 }],
        type: "website",
        locale: "es_MX",
        siteName: "TlaxApp",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: "Publicación",
      robots: { index: false },
    };
  }
}

export default function PosteoPage() {
  return <PosteoPageClient />;
}
