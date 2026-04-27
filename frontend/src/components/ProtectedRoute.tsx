import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, type ReactNode } from 'react';

interface Props { children?: ReactNode }

export const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, user, refreshUser } = useAuthStore();
  const hasAccessToken = !!localStorage.getItem('accessToken');

  useEffect(() => {
    if (isAuthenticated && !user) refreshUser();
  }, [isAuthenticated, user, refreshUser]);

  if (!isAuthenticated || !hasAccessToken) return <Navigate to="/login" replace />;
  return <>{children || <Outlet />}</>;
};

export const PublicRoute = ({ children }: Props) => {
  const { isAuthenticated } = useAuthStore();
  const hasAccessToken = !!localStorage.getItem('accessToken');
  if (isAuthenticated && hasAccessToken) return <Navigate to="/dashboard" replace />;
  return <>{children || <Outlet />}</>;
};
