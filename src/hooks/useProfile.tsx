import { useState, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  company?: string;
  position?: string;
  address?: string;
  department?: string;
  emergency_contact?: string;
  employee_id?: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getProfile();
      if (response && response.user && response.user.profile) {
        setProfile(response.user.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user found' };

    try {
      await apiClient.updateProfile(updates);
      await fetchProfile();
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
      return { error };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: 'No user found' };

    try {
      const response = await apiClient.uploadAvatar(file);
      await fetchProfile();
      toast({
        title: "Avatar Updated",
        description: "Your profile photo has been updated successfully"
      });
      return { error: null, avatar_url: response.avatar_url };
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload avatar",
        variant: "destructive"
      });
      return { error };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  };
};