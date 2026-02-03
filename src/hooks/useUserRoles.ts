import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/useAuth';

export type AppRole = 'user' | 'doctor' | 'admin' | 'moderator';

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    setRoles((user.roles as AppRole[]) ?? ['user']);
    setLoading(false);
  }, [user]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isDoctor = () => hasRole('doctor');
  const isAdmin = () => hasRole('admin');
  const isModerator = () => hasRole('moderator');
  const isUser = () => hasRole('user');

  return {
    roles,
    loading,
    hasRole,
    isDoctor,
    isAdmin,
    isModerator,
    isUser,
  };
}

