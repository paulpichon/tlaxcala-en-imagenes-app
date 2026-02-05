import { Metadata } from "next";
import PerfilUsuarioContainer from "@/app/components/perfil/PerfilUsuarioContainer";

// ✅ CORRECTO para Next.js 15
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ url: string }> // ← params es una Promise
}): Promise<Metadata> {
  // ✅ Await params antes de usarlo
  const { url } = await params;
  // Metadata 
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tlaxapp.com";
  const profileUrl = `${baseUrl}/${url}`;

  return {
    title: `@${url}`,
    description: `Perfil de @${url} en TlaxApp. Fotos, publicaciones y experiencias compartidas desde Tlaxcala.`,

    alternates: {
      canonical: profileUrl,
    },

    openGraph: {
      title: `@${url} en TlaxApp`,
      description: `Descubre las publicaciones y fotos de @${url} en TlaxApp.`,
      url: profileUrl,
      siteName: "TlaxApp",
      locale: "es_MX",
      type: "profile",
      images: [
        {
          url: `${baseUrl}/assets/og-profile-default.png`,
          width: 1200,
          height: 630,
          alt: `Perfil de ${url} en TlaxApp`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `@${url} en TlaxApp`,
      description: `Perfil de @${url} en TlaxApp.`,
      images: [`${baseUrl}/assets/og-profile-default.png`],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

// ✅ CORRECTO - También await en el page
export default async function PerfilUsuarioPage({ 
  params 
}: { 
  params: Promise<{ url: string }> // ← params es una Promise
}) {
  const { url } = await params;
  
  if (!url) {
    return <p className="text-center mt-5">Usuario no especificado</p>;
  }
  
  return <PerfilUsuarioContainer url={url} />;
}