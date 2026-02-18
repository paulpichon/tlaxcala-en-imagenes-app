// =============================
// 📄 FAQ LAYOUT - SERVER COMPONENT
// =============================

// ❌ NO usar 'use client'
// Este archivo debe ser Server Component
// porque contiene metadata y structured data

import type { Metadata } from "next";
import "../../ui/fonts";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FollowProvider } from "@/context/FollowContext";
import { FavoritoProvider } from "@/context/FavoritoContext";

// =============================
// 🌍 Configuración Base URL
// =============================

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://tlaxapp.com";

// Ruta real de esta página (AJUSTA si es diferente)
const pageUrl = `${baseUrl}/configuracion/faq`;

// =============================
// 🧠 LISTA FAQ PARA STRUCTURED DATA
// =============================

const faqStructuredData = [
  {
    question: "¿Cómo creo una cuenta en TlaxApp?",
    answer:
      "Puedes registrarte con tu correo electrónico desde la pantalla de inicio. Recibirás un correo de verificación antes de comenzar a usar la plataforma.",
  },
  {
    question: "Olvidé mi contraseña, ¿qué hago?",
    answer:
      "En la pantalla de inicio de sesión selecciona '¿Olvidaste tu contraseña?' y sigue las instrucciones enviadas a tu correo.",
  },
  {
    question: "¿Cómo elimino una publicación?",
    answer:
      "En el menú de opciones de cada publicación puedes eliminarla si eres el propietario. Esta acción es permanente.",
  },
  {
    question: "¿Cómo reporto a un usuario?",
    answer:
      "Desde el perfil o publicación puedes seleccionar 'Reportar'. Nuestro equipo revisará el caso.",
  },
  {
    question: "¿Cómo funciona el sistema de seguidores?",
    answer:
      "Puedes seguir usuarios para ver sus publicaciones en tu feed. También puedes dejar de seguirlos cuando quieras.",
  },
  {
    question: "¿Cómo protegen mi información?",
    answer:
      "Utilizamos medidas de seguridad modernas como cifrado y autenticación segura para proteger tu información.",
  },
  {
    question: "¿Cuánto tarda soporte en responder?",
    answer:
      "Normalmente respondemos en un plazo de 24 a 48 horas hábiles. Recibirás un número de ticket.",
  },
  {
    question: "¿Cómo elimino mi cuenta?",
    answer:
      "Puedes solicitar la eliminación desde configuración o contactando a soporte. La eliminación es permanente.",
  },
];

// =============================
// 🏷️ METADATA SEO COMPLETA
// =============================

export const metadata: Metadata = {
  title: "Preguntas Frecuentes",
  description:
    "Resuelve tus dudas sobre cuentas, publicaciones, seguridad y soporte en TlaxApp. Encuentra respuestas rápidas y claras en nuestra sección de Preguntas Frecuentes.",

  keywords: [
    "TlaxApp",
    "FAQ TlaxApp",
    "Ayuda TlaxApp",
    "Soporte TlaxApp",
    "Red social Tlaxcala",
    "Cómo usar TlaxApp",
  ],

  authors: [{ name: "TlaxApp" }],

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: pageUrl, // 🔥 Canonical optimizado
  },

  openGraph: {
    title: "Preguntas Frecuentes | TlaxApp",
    description:
      "Encuentra respuestas sobre cuentas, publicaciones y seguridad en TlaxApp.",
    url: pageUrl,
    siteName: "TlaxApp",
    type: "website",
    images: [
      {
        url: `${baseUrl}/assets/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Preguntas Frecuentes TlaxApp",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Preguntas Frecuentes | TlaxApp",
    description:
      "Resuelve tus dudas sobre TlaxApp en nuestra sección de FAQ.",
    images: [`${baseUrl}/assets/og-image.jpg`],
  },
};

// =============================
// 📄 LAYOUT COMPONENT
// =============================

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* =============================
          📊 STRUCTURED DATA (FAQ SCHEMA)
          Esto permite que Google muestre
          preguntas desplegables en resultados
      ============================== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqStructuredData.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      {/* Protección de ruta */}
      <ProtectedRoute>
        <FollowProvider>
          <FavoritoProvider>{children}</FavoritoProvider>
        </FollowProvider>
      </ProtectedRoute>
    </>
  );
}
