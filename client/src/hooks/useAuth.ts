import { useContext } from 'react';
import { AuthProvider } from '@/contexts/auth-context';

export function useAuth() {
  const context = useContext(AuthProvider as any);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
