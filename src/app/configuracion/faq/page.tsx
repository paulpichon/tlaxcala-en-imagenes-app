
// =============================
// 📦 IMPORTACIONES CLIENT
// =============================

'use client';

import FooterSugerencias from '@/app/components/FooterSugerencias';
import HeaderSuperior from '@/app/components/HeaderSuperior';
import MenuPrincipal from '@/app/components/MenuPrincipal';
import NuevosUsuariosRegistrados from '@/app/components/NuevosUsuariosRegistrados';
import Publicidad from '@/app/components/Publicidad';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { FiArrowLeft } from "react-icons/fi";

// =============================
// 📄 Página de FAQ
// =============================

export default function PreguntasFrecuentes() {

  const router = useRouter();

  // Estado que controla qué pregunta está abierta
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Lista de preguntas y respuestas
  // Esto facilita mantenimiento futuro
  const faqs = [
    {
      question: "¿Cómo creo una cuenta en TlaxApp?",
      answer: "Puedes registrarte con tu correo electrónico desde la pantalla de inicio. Recibirás un correo de verificación antes de comenzar a usar la plataforma."
    },
    {
      question: "Olvidé mi contraseña, ¿qué hago?",
      answer: "En la pantalla de inicio de sesión selecciona '¿Olvidaste tu contraseña?' y sigue las instrucciones enviadas a tu correo."
    },
    {
      question: "¿Cómo elimino una publicación?",
      answer: "En el menú de opciones de cada publicación puedes eliminarla si eres el propietario. Esta acción es permanente."
    },
    {
      question: "¿Puedo usar TlaxApp para publicar noticias o reportajes?",
      answer: "TlaxApp está enfocada en compartir fotografías, experiencias, lugares y contenido local de Tlaxcala. Por ahora no está pensada para la difusión de noticias o reportajes, aunque este enfoque podría ampliarse en el futuro."
    },
    {
      question: "¿Cómo reporto a un usuario?",
      answer: "Desde la página de ayuda y soporte puedes reportar usuarios. Nuestro equipo revisará el caso."
    },
    {
      question: "¿Cómo funciona el sistema de seguidores?",
      answer: "Puedes seguir usuarios para ver sus publicaciones en tu feed. También puedes dejar de seguirlos cuando quieras."
    },
    {
      question: "¿Cómo protegen mi información?",
      answer: "Utilizamos medidas de seguridad modernas como cifrado y autenticación segura para proteger tu información."
    },
    {
      question: "¿Cuánto tarda soporte en responder?",
      answer: "Normalmente respondemos en un plazo de 24 a 48 horas hábiles. Recibirás un número de ticket."
    },
    {
      question: "¿Cómo elimino mi cuenta?",
      answer: "Puedes solicitar la eliminación desde configuración o contactando a soporte. La eliminación es permanente."
    }
  ];

  return (
          <>      
            {/* Contenedor Principal */}
            <div className="contenedor_principal">
              {/* Row principal con grid de Bootstrap */}
              <div className="row g-0">
                
                {/* Contenedor menu lateral */}
                <div className="col-md-2 col-lg-2 col-xl-2">
                  <div className="contenedor_menu_lateral_inferior fixed-bottom">
                    {/* Menu principal de navegación */}
                    <MenuPrincipal />
                  </div>
                </div>
                {/* Fin Contenedor menu */}
      
                {/* Contenedor Contenido Principal */}
                <div className="col-md-10 col-lg-10 col-xl-6 contenedor_central_contenido">
                  
                  {/* Contenedor menu superior */}
                  <div className="contenedor_menu_superior sticky-top">
                    {/* Header Superior con búsqueda y perfil */}
                    <HeaderSuperior />
                  </div>
                  {/* Fin Contenedor menu principal */}
                  
                  {/* Contenedor del contenido principal - Centro de Ayuda */}
                  <div className="contenedor_contenido_principal">
                    
                  {/* HEADER */}
                  <div className="bg-white border-bottom p-3">
                    <div className="d-flex align-items-center justify-content-between">

                      <button
                        onClick={() => router.back()}
                        className="btn btn-link text-dark p-2"
                        style={{ fontSize: '24px' }}
                      >
                        <FiArrowLeft />
                      </button>

                      <h1 className="h5 mb-0 fw-bold flex-grow-1 text-center pe-5">
                        Preguntas frecuentes
                      </h1>
                    </div>
                  </div>


                  {/* CONTENIDO */}
                  <div className="d-flex flex-column bg-light vh-100">
                    <div className="container mt-4" style={{ maxWidth: '500px' }}>

                      <div className="card shadow-sm border-0">
                        <div className="card-body">

                          <h2 className="fw-bold mb-4" style={{ fontSize: "16px" }}>
                            Resolvemos tus dudas más comunes
                          </h2>

                          {faqs.map((faq, index) => {
                            const isOpen = openIndex === index;

                            return (
                              <div key={index} className="border-bottom py-3">

                                <button
                                  onClick={() =>
                                    setOpenIndex(isOpen ? null : index)
                                  }
                                  className="w-100 text-start bg-transparent border-0 d-flex justify-content-between align-items-center fw-semibold"
                                >
                                  {faq.question}
                                  <span
                                    style={{
                                      transition: "transform 0.3s ease",
                                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
                                    }}
                                  >
                                    ▼
                                  </span>
                                </button>

                                <div
                                  style={{
                                    maxHeight: isOpen ? "200px" : "0px",
                                    overflow: "hidden",
                                    transition: "all 0.3s ease",
                                  }}
                                >
                                  <p className="text-muted mt-2 mb-0 small">
                                    {faq.answer}
                                  </p>
                                </div>

                              </div>
                            );
                          })}

                          <p className="text-muted small mt-3 mb-0 text-center">
                            Para más detalles, consulta nuestros{" "}
                            <Link href="/legal/terminos-y-condiciones" className="text-decoration-none">
                              Términos y Condiciones
                            </Link>
                            .
                          </p>

                        </div>
                      </div>

                    </div>
                  </div>






                  </div>
                  {/* Fin Contenedor del contenido principal */}
                  
                </div>
                {/* Fin Contenedor Contenido Principal */}
      
                {/* Contenedor publicidad/sugerencias - Solo visible en pantallas XL */}
                <div className="col-xl-4 sugerencias">
                  
                  {/* Contenedor de contenido lateral */}
                  <div className="contenedor_sugerencias sticky-top p-3">
                    
                    {/* Contenedor de sugerencias */}
                    <div className="contenedor_sugerencias_seguir mt-4">
                      
                      {/* Sección: Nuevos usuarios registrados */}
                      <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                        {/* Widget de nuevos usuarios para seguir */}
                        <NuevosUsuariosRegistrados />
                      </div>
                      
                      {/* Sección: Publicidad */}
                      <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                        <div className="col-8">
                          {/* Banner publicitario */}
                          <Publicidad />
                        </div>
                      </div>
                      {/* Fin row publicidad */}
      
                      {/* Sección: Footer con enlaces y información */}
                      <div className="row d-flex justify-content-center mt-4">
                        <div className="col-12">
                          <div className="text-center mt-3">
                            {/* Footer del div sugerencias (Términos, Privacidad, Ayuda, etc.) */}
                            <FooterSugerencias />
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    {/* Fin contenedor_sugerencias_seguir */}
                    
                  </div>
                  {/* Fin contenedor_sugerencias */}
                  
                </div>
                {/* Fin Contenedor publicidad/sugerencias */}
                
              </div>
              {/* Fin Row */}
            </div>
            {/* Fin Contenedor Principal */}
          </>
        );

}
