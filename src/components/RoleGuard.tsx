import { ReactNode } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';

type UserRole = 'admin' | 'manager' | 'ceo' | 'technician' | 'sales' | 'user';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export const RoleGuard = ({ children, allowedRoles, fallback = null }: RoleGuardProps) => {
  const { canAccess, loading } = useRoleAccess();

  if (loading) {
    return null;
  }

  if (!canAccess(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};