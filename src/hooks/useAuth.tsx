import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  profile: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    bio?: string;
    company?: string;
    phone?: string;
    position?: string;
  };
  roles: Array<{
    role: string;
    specialty?: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Validate token and get user profile
      apiClient.getProfile()
        .then((response) => {
          setUser(response.user);
        })
        .catch((error) => {
          console.error('Token validation failed:', error);
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await apiClient.register(email, password, firstName, lastName);

      // Store token
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);

      toast({
        title: "Account created",
        description: "Welcome! Your account has been created successfully."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Signup Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);

      // Store token
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);

      toast({
        title: "Welcome back",
        description: "You have been successfully signed in."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('auth_token');
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string) => {
    // TODO: Implement password reset functionality
    toast({
      title: "Not implemented",
      description: "Password reset functionality will be available soon.",
      variant: "destructive"
    });
    return { error: new Error('Not implemented') };
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};