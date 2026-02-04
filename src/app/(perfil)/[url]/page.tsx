"use client";

import "bootstrap/dist/css/bootstrap.css";
import { useParams } from "next/navigation";
import PerfilUsuarioContainer from "@/app/components/perfil/PerfilUsuarioContainer";

export default function PerfilUsuarioPage() {
  const { url } = useParams<{ url: string }>();

  if (!url) return <p className="text-center mt-5">Usuario no especificado</p>;

  return <PerfilUsuarioContainer url={url} />;
}
