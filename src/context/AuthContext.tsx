'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type User = {
  nombre: string;
  correo: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        console.log(data, "desde API login");
        
        setUser(data.usuario);
      } else if (res.status === 401) {
        // Intenta refrescar token
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/refresh`, 
            { credentials: 'include' }
        );
        if (refreshRes.ok) {
          const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/me`, 
            { credentials: 'include' }
        );
          if (meRes.ok) {
            const data = await meRes.json();
            setUser(data.usuario);
          }
        }
      }
    } catch (err) {
      console.error('Error recuperando sesión:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/logout`, 
        { method: 'POST', credentials: 'include' }
    );
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};