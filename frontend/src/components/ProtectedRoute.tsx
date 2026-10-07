import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
 
// Bu bileşenin altına eklenen hiçbir route, giriş yapmadan görüntülenemez.
export default function ProtectedRoute() {
  const { user } = useAuth();
 
  if (!user) {
    return <Navigate to="/giris" replace />;
  }
 
  return <Outlet />;
}