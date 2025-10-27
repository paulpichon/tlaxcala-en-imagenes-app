import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export const useLogout = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/cuentas/login");
  };

  return { handleLogout };
};