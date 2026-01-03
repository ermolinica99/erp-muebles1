import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');

  if (!token) {
    // Si no hay token, redirigir a login
    return <Navigate to="/login" replace />;
  }

  // Si hay token, mostrar el contenido protegido
  return children;
}