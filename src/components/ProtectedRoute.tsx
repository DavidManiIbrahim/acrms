import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

type UserRole = 'admin' | 'manager' | 'ceo' | 'technician' | 'sales' | 'user';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for both auth and role to load
    if (authLoading || roleLoading) return;

    // Check authentication requirement
    if (requireAuth && !user) {
      navigate('/auth');
      return;
    }

    // Check role permissions if specified
    if (allowedRoles && user) {
      // If role is still loading or null, wait
      if (role === null) return;
      
      if (!allowedRoles.includes(role)) {
        // Redirect based on user's actual role
        switch (role) {
          case 'user':
            navigate('/user-dashboard');
            break;
          case 'technician':
            navigate('/technician-dashboard');
            break;
          case 'admin':
            navigate('/dashboard');
            break;
          case 'sales':
            navigate('/user-dashboard');
            break;
          case 'manager':
          case 'ceo':
            navigate('/executive-dashboard');
            break;
          default:
            navigate('/user-dashboard');
        }
        return;
      }
    }
  }, [user, role, authLoading, roleLoading, navigate, allowedRoles, requireAuth]);

  // Show loading state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if auth is required but user is not authenticated
  if (requireAuth && !user) {
    return null;
  }

  // Don't render if role restrictions apply and user doesn't have permission
  if (allowedRoles && user && role && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
};