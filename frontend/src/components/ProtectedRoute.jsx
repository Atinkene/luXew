import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexte/AuthContexte';

export default function ProtectedRoute({ rolesAutorises }) {
  const { utilisateur } = useAuth();

  if (!utilisateur) return <Navigate to="/connexion" replace />;

  const autorise = rolesAutorises.some(role => utilisateur.roles.includes(role));
  if (!autorise) return <Navigate to="/non-autorise" replace />;

  return <Outlet />;
}
