import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'admin' | 'manager' | 'ceo' | 'technician' | 'sales' | 'user';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    // Roles come from the Express backend via useAuth
    const userRole = (user.roles?.[0]?.role ?? 'user') as UserRole;
    setRole(userRole);
    setLoading(false);
  }, [user, authLoading]);

  return { role, loading: loading || authLoading };
};