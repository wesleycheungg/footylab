import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as api from '../api';
import type { PublicUser } from '../types';
import { UserContext, type AuthStatus } from './userContext';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Restore the session on load. The cookie is httpOnly, so asking the
  // server is the only way to know whether one exists.
  useEffect(() => {
    let active = true;

    api
      .getCurrentUser()
      .then((current) => {
        if (!active) return;
        setUser(current);
        setStatus('authenticated');
      })
      .catch(() => {
        // A 401 here is the normal "not signed in" case, not an error.
        if (!active) return;
        setUser(null);
        setStatus('anonymous');
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const current = await api.login(email, password);
    setUser(current);
    setStatus('authenticated');
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const current = await api.signup(email, password);
    setUser(current);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      // Clear locally even if the request failed: leaving the UI signed in
      // after the user asked to leave is worse than a stale server session,
      // and the cookie is almost certainly gone either way.
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut]
  );

  return <UserContext value={value}>{children}</UserContext>;
}
