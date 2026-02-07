// Iniciar sesión
// Se usara Layouts Anidados en la estructura del proyecto
// https://chatgpt.com/c/674542f3-d5bc-8002-847c-c817ca29ba97

// Fonts
import "../../ui/fonts";
import AlreadyAuthRedirect from "@/components/AlreadyAuthRedirect";

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <AlreadyAuthRedirect>
        {children}
      </AlreadyAuthRedirect>
    );
  }