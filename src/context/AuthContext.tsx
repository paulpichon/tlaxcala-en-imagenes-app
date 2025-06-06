'use client';
// Importa los hooks necesarios de React para crear un contexto y manejar el estado.
import {    createContext, 
            useContext, 
            useEffect, 
            useState 
        } from 'react';
// Interface UsuarioLogueado define la estructura de los datos del usuario que se almacenarán en el contexto.
// Interface para el contexto de autenticación, define las propiedades que estarán disponibles en el contexto.
import {    UsuarioLogueado, 
            IAuthContext 
        } from '@/types/types';
        
// Se crea el contexto, inicialmente sin valor. Se usará para compartir los datos de autenticación entre componentes.
const AuthContext = createContext<IAuthContext | undefined>(undefined);
// Este componente envolverá toda la app, permitiendo que cualquier componente acceda al estado de autenticación.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // user: representa al usuario logueado.
    const [user, setUser] = useState<UsuarioLogueado | null>(null);
    // loading: indica si se está cargando la sesión del usuario.
    const [loading, setLoading] = useState(true);
    
    // fetchUser: función que se encarga de obtener los datos del usuario actual desde la API.
    const fetchUser = async () => {
        try {
             // Intenta obtener al usuario actual llamando a /api/auth/me.
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/me`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUser(data.usuario);
            }
            // Si el token de acceso está vencido (401), intenta renovarlo con /api/auth/refresh.
            if (res.status === 401) {
                const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/refresh`, 
                    { method: 'POST', credentials: 'include' }  
                );
                // Luego, si la renovación es exitosa, vuelve a llamar a /me para obtener al usuario.
                if (refreshRes.ok) {
                    const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/me`, {
                        credentials: 'include',
                    });
                    if (meRes.ok) {
                        const data = await meRes.json();
                        setUser(data.usuario);
                    }
                }
            }
        } catch (err) {
            console.error('Error recuperando sesión:', err);
        } finally {
            // loading en false.
            setLoading(false);
        }
    };
    // Al montar el componente (solo una vez), se intenta recuperar la sesión del usuario automáticamente.
    useEffect(() => {
        fetchUser();
    }, []);
    // Actualiza el estado user. Útil para cuando el usuario inicia sesión manualmente.
    const login = (user: UsuarioLogueado) => {
        setUser(user);
    };
    // Llama al endpoint /logout del backend y borra el usuario en frontend.
    const logout = async () => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/logout`, 
            { method: 'POST', credentials: 'include' }
        );
        setUser(null);
    };
    // Esto hace que los valores user, loading, login, y logout estén disponibles para todos los componentes hijos mediante el hook useAuth().
    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
        {children}
        </AuthContext.Provider>
    );
};
// Hook personalizado useAuth()
// Permite acceder fácilmente al contexto desde cualquier componente con: const { user, loading, login, logout } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};