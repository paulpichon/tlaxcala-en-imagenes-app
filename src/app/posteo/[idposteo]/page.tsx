// Pagina de Posteo de usuario
// Muestra la informacion de un posteo en detalle
import { Viewport } from "next";
import "../../ui/inicio/inicio.css";
import "bootstrap/dist/css/bootstrap.css";
import PosteoClientWrapper from "./PosteoClientWrapper";// 👈 lo importamos

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Posteo() {
  return <PosteoClientWrapper />;
}
