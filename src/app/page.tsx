
// Next
import Link from "next/link";
import Image from "next/image";

// Bootstrap
import "bootstrap/dist/css/bootstrap.css";

// Styles
import styles from "./ui/Home.module.css";

// Components
import FooterMain from "./components/FooterMain";
import AlreadyAuthRedirect from "@/components/AlreadyAuthRedirect";

// Asset
import iconoTlaxapp from "@/../public/assets/icono-tlaxapp-blanco.png";

export default function Home() {
  return (
    <AlreadyAuthRedirect>
      <main className={styles.wrapper}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <Image
              src={iconoTlaxapp}
              alt="TlaxApp, la red social de Tlaxcala"
              width={200}
              height={200}
              priority
              className={styles.icono}
            />

            <h1 className={styles.title}>TlaxApp</h1>
            <p className={styles.subtitle}>
              Tlaxcala, contada por su gente.
            </p>

            <div className={styles.actions}>
              <Link href="/cuentas/crear-cuenta" className={styles.primaryBtn}>
                Crear cuenta
              </Link>

              <Link href="/cuentas/login" className={styles.secondaryBtn}>
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>

        <FooterMain />
      </main>
    </AlreadyAuthRedirect>
  );
}
