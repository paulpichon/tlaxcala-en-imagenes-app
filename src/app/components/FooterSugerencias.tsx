import Link from "next/link";

export default function FooterSugerencias() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="text-center small text-muted px-3">
      <div className="mb-2 d-flex flex-wrap justify-content-center gap-2">
        <Link href="/legal/politica-de-privacidad" className="text-muted text-decoration-none">
          Privacidad
        </Link>
        <span>·</span>
        <Link href="/legal/terminos-y-condiciones" className="text-muted text-decoration-none">
          Términos
        </Link>
        <span>·</span>
        <Link href="/contacto" className="text-muted text-decoration-none">
          Contacto
        </Link>
        <span>·</span>
      </div>

      <div>
        © {currentYear} TlaxApp
      </div>
    </div>
  );
}
