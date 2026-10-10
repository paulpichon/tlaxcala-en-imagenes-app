// Página: ¿Qué es TlaxApp?
// Página pública para explicar el propósito, misión y funcionamiento de la plataforma
// Fuente de verdad de la copia visible: QUE-ES-TLAXAPP.md (raíz del repo)

import { Metadata } from "next";
import contacto from "@/app/ui/legal/PrivacidadTerminosCondiciones.module.css";
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "@/app/components/FooterMain";
import Link from "next/link";

export const metadata: Metadata = {
  title: "¿Qué es TlaxApp?",
  description:
    "TlaxApp es la red social de Tlaxcala: comparte fotos con ubicación, descubre lo que pasa en el estado y conecta con su gente.",
  keywords: [
    "TlaxApp",
    "qué es TlaxApp",
    "red social Tlaxcala",
    "comunidad Tlaxcala",
    "fotos de Tlaxcala",
    "descubrir Tlaxcala",
    "red social local",
    "Tlaxcala",
  ],
  authors: [{ name: "TlaxApp" }],

  openGraph: {
    title: "¿Qué es TlaxApp?",
    description:
      "TlaxApp es la red social de Tlaxcala: comparte fotos con ubicación, descubre lo que pasa en el estado y conecta con su gente.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/que-es-tlaxapp`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "¿Qué es TlaxApp?",
      },
    ],
    locale: "es_MX",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "¿Qué es TlaxApp?",
    description:
      "TlaxApp es la red social de Tlaxcala: comparte fotos con ubicación, descubre lo que pasa en el estado y conecta con su gente.",
    images: ["/assets/og-image.png"],
  },

  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/que-es-tlaxapp`,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function QueEsTlaxApp() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "¿Qué es TlaxApp?",
    description:
      "TlaxApp es la red social de Tlaxcala: comparte fotos con ubicación, descubre lo que pasa en el estado y conecta con su gente.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/que-es-tlaxapp`,
    mainEntity: {
      "@type": "Organization",
      name: "TlaxApp",
      url: process.env.NEXT_PUBLIC_BASE_URL,
      logo: `${process.env.NEXT_PUBLIC_BASE_URL}/assets/logo.png`,
      sameAs: ["https://www.instagram.com/tlaxapp"],
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: process.env.NEXT_PUBLIC_BASE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "¿Qué es TlaxApp?",
          item: `${process.env.NEXT_PUBLIC_BASE_URL}/que-es-tlaxapp`,
        },
      ],
    },
    inLanguage: "es-MX",
    isAccessibleForFree: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-fluid container-xl">
        <div className="row justify-content-center contenedor_principal">

          <HeaderPrincipalTei />

          <div className="col-sm-12 col-md-10 col-lg-8">
            <div className={contacto.contenedor_formulario}>

              <div className={contacto.contenedor_titulos}>
                <h1 className={contacto.titulo}>¿Qué es TlaxApp?</h1>
                <p className={contacto.fecha}>
                  Última actualización: <strong>Octubre 2026</strong>
                </p>
              </div>

              <div className={contacto.contenido}>

                <h2>¿Qué es TlaxApp?</h2>
                <p>
                  <strong>TlaxApp</strong> es una red social de Tlaxcala: un espacio
                  hecho por y para tlaxcaltecas donde compartes fotografías,
                  descubres lo que pasa en el estado y conectas con su gente. Cada
                  publicación puede llevar su ubicación —del municipio hasta la
                  localidad— para que el contenido se quede anclado a Tlaxcala.
                </p>

                <h2>Propósito</h2>
                <p>
                  Dar a Tlaxcala un espacio digital propio: mostrar, promover y
                  conectar lo que hace especial al estado —sus lugares, su gente y
                  lo que ocurre en él— a través de lo que la comunidad comparte.
                </p>

                <h2>Misión</h2>
                <p>
                  Conectar a las personas de Tlaxcala mediante fotografías y
                  experiencias reales, creando una comunidad donde compartir lo
                  local sea sencillo, cercano y útil.
                </p>

                <h2>Visión</h2>
                <p>
                  Ser la comunidad digital de referencia en Tlaxcala: el lugar
                  donde locales y visitantes descubren el estado, y donde lo local
                  gana visibilidad y orgullo.
                </p>

                <h2>Objetivo</h2>
                <p>
                  Construir y hacer crecer la comunidad digital más activa
                  dedicada a Tlaxcala, sumando cada vez más personas que
                  publiquen, descubran y participen.
                </p>

                <h2>Valores</h2>
                <ul>
                  <li><strong>Comunidad</strong> — la plataforma crece gracias a las personas.</li>
                  <li><strong>Orgullo tlaxcalteca</strong> — celebrar la cultura, los lugares y la gente del estado.</li>
                  <li><strong>Autenticidad</strong> — experiencias y fotos reales, no contenido artificial.</li>
                  <li><strong>Cercanía local</strong> — todo gira en torno a Tlaxcala y su gente.</li>
                  <li><strong>Respeto y convivencia</strong> — un espacio seguro, con moderación y reportes.</li>
                  <li><strong>Apoyo a lo local</strong> — damos visibilidad a lo que ocurre y se produce en el estado.</li>
                </ul>

                <h2>¿Qué puedes hacer en TlaxApp?</h2>
                <ul>
                  <li><strong>Publicar fotos</strong> de Tlaxcala con una descripción breve.</li>
                  <li><strong>Ubicar tus publicaciones</strong>: municipio y localidad (catálogo INEGI de los 60 municipios).</li>
                  <li><strong>Elegir quién las ve</strong>: para todo el feed (<em>público</em>) o solo en tu perfil (<em>solo perfil</em>).</li>
                  <li><strong>Seguir a otras personas</strong> y explorar sus perfiles.</li>
                  <li><strong>Interactuar</strong>: dar <em>like</em>, comentar y guardar en <strong>favoritos</strong>.</li>
                  <li><strong>Recibir notificaciones</strong> cuando alguien interactúa contigo (en la app y push).</li>
                  <li><strong>Personalizar tu perfil</strong>: foto, nombre y datos.</li>
                  <li><strong>Reportar contenido</strong> inapropiado para cuidar la comunidad.</li>
                  <li><strong>Controlar tu cuenta y privacidad</strong>: editar o eliminar.</li>
                </ul>

                <h2>¿Qué problema resuelve?</h2>
                <ul>
                  <li>La información y el contenido sobre Tlaxcala están <strong>dispersos</strong> entre muchas plataformas.</li>
                  <li>Lo local <strong>pierde visibilidad</strong> frente a lo nacional o global.</li>
                  <li>No existía una <strong>red social enfocada solo en Tlaxcala</strong>.</li>
                </ul>

                <h2>¿Para quién es TlaxApp?</h2>
                <ul>
                  <li>Personas que viven en Tlaxcala.</li>
                  <li>Tlaxcaltecas fuera del estado.</li>
                  <li>Visitantes y turistas.</li>
                  <li>Negocios y creadores de contenido locales.</li>
                </ul>

                <h2>Sobre negocios y turismo</h2>
                <p>
                  TlaxApp no es (todavía) un directorio de negocios ni una guía
                  turística con fichas de lugares. El valor para lo local nace de
                  lo que <strong>la comunidad comparte</strong>: fotos y recomendaciones
                  reales que, con el tiempo, ayudan a dar visibilidad a negocios,
                  lugares y experiencias de Tlaxcala.
                </p>

                <h2>Acceso</h2>
                <p>
                  TlaxApp está creciendo. Actualmente funciona con{" "}
                  <strong>acceso anticipado por invitación</strong>, con apertura
                  progresiva al público. Únete a la lista para ser de los
                  primeros.
                </p>
                <p>
                  <Link href="/" className="text-primary">
                    Registrarse para el acceso anticipado
                  </Link>
                </p>

                <h2>Únete a la comunidad</h2>
                <p>
                  TlaxApp lo construye la comunidad. Cada foto y cada
                  recomendación ayuda a mostrar lo mejor de Tlaxcala.
                </p>

              </div>
            </div>
          </div>

          <div className="text-center mt-4 mb-5">
            <Link
              href="/"
              className="btn btn-outline-secondary btn-sm"
            >
              ← Volver al inicio
            </Link>
          </div>

          <FooterMain />

        </div>
      </div>
    </>
  );
}
