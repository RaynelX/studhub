import {
    createContext,
    useContext,
    type ReactNode,
} from 'react';
import { useAuth } from './hooks/use-auth';
import type { User } from '@supabase/supabase-js';
  
interface AdminContextValue {
  isAdmin: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, loading, error, signIn, signOut } = useAuth();

  return (
    <AdminContext.Provider
      value={{
        isAdmin: !!user,
        user,
        loading,
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin() must be used within <AdminProvider>');
  return ctx;
}