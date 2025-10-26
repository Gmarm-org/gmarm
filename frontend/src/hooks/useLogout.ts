import { useAuth } from '../contexts/AuthContext';

export const useLogout = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return { handleLogout };
}; 