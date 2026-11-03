import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import type { ProtectedRouteProps, RootState } from '@/util/Types';

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useSelector((state: RootState) => state.authState);

  if (isLoading) {
    return <div>Verifying Security Clearance...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <div>Access Denied. Your role ({role}) lacks sufficient clearance.</div>;
  }

  return children;
}