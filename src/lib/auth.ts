type UserRole = 'admin' | 'manager' | 'ceo' | 'technician' | 'sales' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Check if user has required role
 */
export const hasRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole);
};

/**
 * Check if user has admin privileges
 */
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === 'admin';
};

/**
 * Check if user can access resource (pure helper, no async needed)
 */
export const canAccess = (
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean => {
  return isAdmin(userRole) || hasRole(userRole, allowedRoles);
};