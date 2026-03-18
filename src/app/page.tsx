
// Next
import Image from "next/image";
// Styles
import styles from "./ui/Home.module.css";
// Components
import FooterMain from "./components/FooterMain";
// Asset
import iconoTlaxapp from "@/../public/assets/icono-tlaxapp-blanco.png";
export default function Home() {
  return (
      <main className={styles.wrapper} role="main">
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
              La red social de Tlaxcala.
            </p>

              <div className={styles.primaryBtn}>
                <h4>Próximamente 2026</h4>
              </div>
          </div>
        </section>
        <FooterMain />
      </main>
  );
}
