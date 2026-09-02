import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiPostStrict, apiPost, ApiError, API_BASE } from '../services/apiService';

const STORAGE_KEY = 'codemantra.session.v1';

/** Seeded real accounts (from backend `seed_data`) for quick autofill in UI. */
export const DEMO_ACCOUNTS = [
  {
    username: 'owner_admin',
    password: 'admin123',
    role: 'OWNER',
    label: 'Owner / Admin',
    user: { id: 1, username: 'owner_admin', full_name: 'Nadia Okafor', email: 'owner@agency.com', profile: { role: 'OWNER', sub_role: 'NONE', company: 'Aura Studio Agency' } },
  },
  {
    username: 'alex_dev',
    password: 'emp123',
    role: 'EMPLOYEE',
    label: 'Developer / Employee',
    user: { id: 2, username: 'alex_dev', full_name: 'Alex Rivera', email: 'alex@agency.com', profile: { role: 'EMPLOYEE', sub_role: 'FRONTEND', company: 'Aura Studio' } },
  },
  {
    username: 'john_client',
    password: 'client123',
    role: 'CLIENT',
    label: 'Client',
    user: { id: 7, username: 'john_client', full_name: 'John Smith', email: 'john@acme.com', profile: { role: 'CLIENT', sub_role: 'NONE', company: 'Acme Global Corp' } },
  },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore corrupted session payloads */
    }
    setReady(true);
  }, []);

  const persist = (nextUser) => {
    setUser(nextUser);
    try {
      if (nextUser) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage may be unavailable in private mode */
    }
  };

  const login = async (username, password) => {
    setPending(true);
    setError(null);
    setNotice(null);

    const uname = String(username || '').trim();
    if (!uname || !password) {
      setPending(false);
      setError('Enter both your username and password.');
      return { ok: false };
    }

    try {
      const res = await apiPostStrict('auth/login/', { username: uname, password });
      if (res && res.user) {
        persist(res.user);
        setPending(false);
        return { ok: true, user: res.user };
      }
      setPending(false);
      setError('The server responded without a user. Please try again.');
      return { ok: false };
    } catch (err) {
      setPending(false);

      if (err instanceof ApiError && err.network) {
        setError(`${err.message} (API: ${API_BASE})`);
        return { ok: false };
      }

      setError(
        err.status === 401 || err.status === 400
          ? (err.message || 'Invalid username or password.')
          : `Sign in failed: ${err.message}`
      );
      return { ok: false };
    }
  };

  const register = async (payload) => {
    setPending(true);
    setError(null);
    setNotice(null);

    const username = String(payload.username || '').trim();
    if (!username || !payload.password) {
      setPending(false);
      setError('Username and password are required.');
      return { ok: false };
    }
    if (String(payload.password).length < 6) {
      setPending(false);
      setError('Password must be at least 6 characters.');
      return { ok: false };
    }

    try {
      const res = await apiPostStrict('auth/register/', { ...payload, username });
      if (res && res.user) {
        persist(res.user);
        setPending(false);
        setNotice('Account created — welcome aboard.');
        return { ok: true, user: res.user };
      }
      setPending(false);
      setError('Sign up did not return an account. Please try again.');
      return { ok: false };
    } catch (err) {
      setPending(false);
      const message = err instanceof ApiError && err.network
        ? `${err.message} (API: ${API_BASE})`
        : err.message;
      setError(message);
      return { ok: false, error: message };
    }
  };

  const logout = async () => {
    if (user?.id) await apiPost('auth/logout/', { user_id: user.id });
    persist(null);
    setError(null);
    setNotice(null);
  };

  const value = useMemo(
    () => ({
      user,
      role: user?.profile?.role || null,
      subRole: user?.profile?.sub_role || 'NONE',
      isAuthenticated: Boolean(user),
      isOwner: user?.profile?.role === 'OWNER',
      isEmployee: user?.profile?.role === 'EMPLOYEE',
      isClient: user?.profile?.role === 'CLIENT',
      ready,
      pending,
      error,
      notice,
      apiBase: API_BASE,
      clearMessages: () => { setError(null); setNotice(null); },
      login,
      register,
      logout,
    }),
    [user, ready, pending, error, notice]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
