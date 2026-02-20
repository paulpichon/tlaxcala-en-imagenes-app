// ===============================================
// 📄 Página Pública - Preguntas Frecuentes (FAQ)
// ===============================================
// Página pública optimizada para SEO
// Visible sin autenticación
// Diseñada similar a Términos y Condiciones

import { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.css";
import condiciones from "@/app/ui/legal/PrivacidadTerminosCondiciones.module.css";
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "@/app/components/FooterMain";
import Link from "next/link";

// ===============================================
// 🌍 Base URL
// ===============================================

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://tlaxapp.com";

const pageUrl = `${baseUrl}/legal/preguntas-frecuentes`;

// ===============================================
// 📚 Lista de FAQ
// ===============================================

const faqs = [
  {
    question: "¿Qué es TlaxApp?",
    answer:
      "TlaxApp es una red social enfocada en compartir y descubrir contenido relacionado con Tlaxcala, México. Los usuarios pueden publicar fotos, seguir perfiles y conectar con la comunidad local.",
  },
  {
    question: "¿Necesito crear una cuenta para usar TlaxApp?",
    answer:
      "Puedes explorar algunas secciones públicas, pero para publicar contenido, comentar o seguir usuarios necesitas crear una cuenta verificada.",
  },
  {
    question: "¿Cómo creo una cuenta?",
    answer:
      "Puedes registrarte desde la página de inicio usando tu correo electrónico. Recibirás un correo de verificación para activar tu cuenta.",
  },
  {
    question: "Olvidé mi contraseña, ¿qué hago?",
    answer:
      "Desde la pantalla de inicio de sesión selecciona '¿Olvidaste tu contraseña?' y sigue las instrucciones enviadas a tu correo electrónico.",
  },
  {
    question: "¿Cómo puedo reportar contenido inapropiado?",
    answer:
      "Puedes reportar publicaciones o usuarios desde la sección de ayuda y soporte. Nuestro equipo revisará cada caso conforme a nuestras políticas.",
  },
  {
    question: "¿Cómo elimino mi cuenta?",
    answer:
      "Puedes solicitar la eliminación desde la configuración de tu perfil. La eliminación es permanente y no puede revertirse.",
  },
  {
    question: "¿Cómo protegen mi información?",
    answer:
      "Utilizamos cifrado, autenticación segura y buenas prácticas de seguridad para proteger la información de nuestros usuarios.",
  },
  {
    question: "¿Cuánto tarda soporte en responder?",
    answer:
      "Nuestro equipo de soporte normalmente responde en un plazo de 24 a 48 horas hábiles.",
  },
];

// ===============================================
// 🏷️ Metadata SEO optimizada
// ===============================================

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | TlaxApp",
  description:
    "Consulta las preguntas frecuentes sobre TlaxApp. Aprende cómo crear tu cuenta, publicar contenido, proteger tu información y contactar soporte.",

  keywords: [
    "Preguntas frecuentes TlaxApp",
    "FAQ TlaxApp",
    "Ayuda TlaxApp",
    "Soporte TlaxApp",
    "Red social Tlaxcala",
    "Cómo usar TlaxApp",
  ],

  authors: [{ name: "TlaxApp" }],

  alternates: {
    canonical: pageUrl,
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Preguntas Frecuentes | TlaxApp",
    description:
      "Resuelve tus dudas sobre cómo usar TlaxApp y conocer sus funciones.",
    url: pageUrl,
    siteName: "TlaxApp",
    images: [
      {
        url: `${baseUrl}/assets/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Preguntas Frecuentes TlaxApp",
      },
    ],
    locale: "es_MX",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Preguntas Frecuentes | TlaxApp",
    description:
      "Encuentra respuestas a las preguntas más comunes sobre TlaxApp.",
    images: [`${baseUrl}/assets/og-image.png`],
  },
};

// ===============================================
// 📄 Componente Principal
// ===============================================

export default function FAQPublica() {
  // ===============================================
  // 📊 Structured Data (FAQPage para Google)
  // ===============================================

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD para Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-fluid container-xl">
        <div className="row justify-content-center contenedor_principal">

          {/* Header público */}
          <HeaderPrincipalTei />

          {/* Contenedor principal */}
          <div className="col-sm-12 col-md-10 col-lg-8">
            <div className={condiciones.contenedor_formulario}>

              {/* Encabezado */}
              <div className={condiciones.contenedor_titulos}>
                <h1 className={condiciones.titulo}>
                  Preguntas Frecuentes
                </h1>
                <p className={condiciones.fecha}>
                  Última actualización: <strong>Enero 2026</strong>
                </p>
              </div>

              {/* Contenido FAQ */}
              <div className={condiciones.contenido}>
                {faqs.map((faq, index) => (
                  <div key={index} className="mb-4">
                    <h2 style={{ fontSize: "18px" }}>
                      {index + 1}. {faq.question}
                    </h2>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Botón volver */}
          <div className="text-center mt-4 mb-5">
            <Link
              href="/"
              className="btn btn-outline-secondary btn-sm"
            >
              ← Volver al inicio
            </Link>
          </div>

          {/* Footer público */}
          <FooterMain />

        </div>
      </div>
    </>
  );
}