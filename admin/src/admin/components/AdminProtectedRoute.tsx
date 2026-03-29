import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { LoadingBlock } from './AdminUi';

export function AdminProtectedRoute(): JSX.Element {
  const location = useLocation();
  const { status } = useAdminAuth();

  if (status === 'loading') {
    return <LoadingBlock message="Weryfikacja sesji administratora..." />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
