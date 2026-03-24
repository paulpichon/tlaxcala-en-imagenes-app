// Página: ¿Qué es TlaxApp?
// Página pública para explicar el propósito, misión y funcionamiento de la plataforma

import { Metadata } from "next";
import contacto from "@/app/ui/legal/PrivacidadTerminosCondiciones.module.css";
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "@/app/components/FooterMain";
import Link from "next/link";

export const metadata: Metadata = {
  title: "¿Qué es TlaxApp?",
  description:
    "TlaxApp es una red social dedicada a Tlaxcala para descubrir lugares, apoyar negocios locales y compartir experiencias. Conoce su misión, visión y propósito.",
  keywords: [
    "TlaxApp",
    "qué es TlaxApp",
    "red social Tlaxcala",
    "lugares en Tlaxcala",
    "turismo Tlaxcala",
    "negocios locales Tlaxcala",
    "descubrir Tlaxcala",
    "plataforma Tlaxcala",
    "comunidad Tlaxcala",
  ],
  authors: [{ name: "TlaxApp" }],

  openGraph: {
    title: "¿Qué es TlaxApp?",
    description:
      "Descubre qué es TlaxApp, la red social dedicada a compartir los mejores lugares, negocios y experiencias de Tlaxcala.",
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
      "TlaxApp es una red social para descubrir y compartir los mejores lugares de Tlaxcala.",
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
      "Información sobre TlaxApp, la red social dedicada a descubrir lugares, negocios y experiencias en Tlaxcala.",
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
                  Última actualización: <strong>Marzo 2026</strong>
                </p>
              </div>

              <div className={contacto.contenido}>

                <h2>¿Qué es TlaxApp?</h2>
                <p>
                  <strong>TlaxApp</strong> es una red social dedicada a Tlaxcala donde
                  las personas pueden compartir fotos, descubrir lugares,
                  apoyar negocios locales y mostrar lo mejor del estado.
                </p>

                <p>
                  TlaxApp es una plataforma digital que conecta a las personas
                  con los lugares, experiencias y negocios de Tlaxcala a través
                  de fotografías y contenido generado por la comunidad.
                </p>

                <h2>Propósito</h2>
                <p>
                  El propósito de TlaxApp es mostrar, promover y conectar todo lo
                  que hace especial a Tlaxcala: sus lugares, su gente y sus negocios.
                </p>

                <ul>
                  <li>Descubrir nuevos lugares en Tlaxcala</li>
                  <li>Dar visibilidad a negocios locales</li>
                  <li>Compartir experiencias reales</li>
                  <li>Promover el turismo local</li>
                </ul>

                <h2>Misión</h2>
                <p>
                  Conectar a las personas con los lugares y experiencias de
                  Tlaxcala a través de una plataforma donde la comunidad comparte
                  fotografías, recomendaciones y descubre lo mejor del estado.
                </p>

                <h2>Visión</h2>
                <p>
                  Convertir a TlaxApp en la plataforma digital más importante
                  para descubrir Tlaxcala, impulsando el turismo local, la
                  visibilidad de negocios y el orgullo por el estado.
                </p>

                <h2>Valores</h2>
                <ul>
                  <li><strong>Comunidad</strong> — La plataforma crece gracias a las personas</li>
                  <li><strong>Orgullo por Tlaxcala</strong> — Promover cultura y lugares</li>
                  <li><strong>Apoyo a negocios locales</strong></li>
                  <li><strong>Autenticidad</strong> — Experiencias reales</li>
                  <li><strong>Innovación digital</strong></li>
                </ul>

                <h2>Objetivo</h2>
                <p>
                  Crear la mayor comunidad digital dedicada a descubrir y
                  compartir lugares en Tlaxcala.
                </p>

                <h2>¿Qué problema resuelve?</h2>
                <ul>
                  <li>Muchas personas no saben qué lugares visitar en Tlaxcala</li>
                  <li>Los negocios locales tienen poca visibilidad digital</li>
                  <li>No existe una plataforma enfocada solo en Tlaxcala</li>
                </ul>

                <p className="alert alert-info">
                  💡 TlaxApp permite descubrir lugares a través de fotos reales
                  compartidas por la comunidad.
                </p>

                <h2>¿Para quién es TlaxApp?</h2>
                <ul>
                  <li>Personas que viven en Tlaxcala</li>
                  <li>Turistas locales</li>
                  <li>Negocios locales</li>
                  <li>Creadores de contenido</li>
                </ul>

                <h2>Únete a la comunidad</h2>
                <p>
                  TlaxApp está construido por la comunidad. Cada fotografía,
                  recomendación y experiencia ayuda a mostrar lo mejor de
                  Tlaxcala.
                </p>

                <p>
                  <Link href="/" className="text-primary">
                    Registrarse para el acceso anticipado
                  </Link>
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