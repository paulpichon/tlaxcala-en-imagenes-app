import { FavoritoProvider } from "@/context/FavoritoContext";

export default function PosteoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FavoritoProvider>
      {children}
    </FavoritoProvider>
  );
}
