import { createContext, useContext } from 'react';
import type { PublicUser } from '../types';

/**
 * Three states, not a nullable user. "Not signed in" and "we haven't asked
 * yet" look identical if you only store `user | null`, and a protected
 * route would bounce every refresh to the login page before /me resolves.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface UserContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Kept out of the provider's file so that file exports only a component;
// mixing hooks and components in one module breaks fast refresh.
export const UserContext = createContext<UserContextValue | null>(null);

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside a UserProvider');
  }
  return context;
}
