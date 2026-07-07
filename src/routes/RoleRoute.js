import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children, roles = [] }) {
  const { user } = useAuth();

  // Si no se requiere ningún rol, deja pasar.
  if (roles.length === 0) {
    return children;
  }

  const tipoUsuario = user?.tipoUsuario;

  if (roles.includes(tipoUsuario)) {
    return children;
  }

  return <Navigate to="/" replace />;
}