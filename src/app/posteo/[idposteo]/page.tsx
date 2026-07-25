import { Metadata } from "next";
import { apiUrl } from "@/lib/apiClient";
import PosteoPageClient from "@/app/components/PosteoPageClient";
import "../../ui/inicio/Inicio.module.css";

type Props = {
  params: Promise<{ idposteo: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://tlaxapp.com";

// Trunca respetando límites recomendados por FB/Twitter
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idposteo } = await params;
  const CLOUDINARY_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  const pageUrl = `${SITE_URL}/posteo/${idposteo}`;

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

    const imageUrl = `https://res.cloudinary.com/${CLOUDINARY_NAME}/image/upload/c_pad,w_1200,h_630,b_auto/${posteo.public_id}`;
    const nombreAutor = posteo._idUsuario?.nombre_completo
      ? `${posteo._idUsuario.nombre_completo.nombre} ${posteo._idUsuario.nombre_completo.apellido}`
      : "un usuario";
    const urlAutor = posteo._idUsuario?.url
      ? `@${posteo._idUsuario.url}`
      : "";

    const rawTitle = `Publicación de ${nombreAutor} ${urlAutor}`.trim();
    const rawDescription =
      posteo.texto || `Mira esta publicación de ${nombreAutor} en TlaxApp`;

    const title = truncate(rawTitle, 60);
    const description = truncate(rawDescription, 155);

    return {
      title,
      description,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        type: "website",
        title,
        description,
        url: pageUrl,
        siteName: "TlaxApp",
        locale: "es_MX",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
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