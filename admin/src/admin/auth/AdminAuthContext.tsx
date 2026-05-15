import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminLogin, AdminApiError, validateAdminSession } from '../api/adminApi';

const STORAGE_KEY = 'room_tablet_admin_token';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AdminAuthContextValue {
  status: SessionStatus;
  token: string | null;
  login: (tokenInput: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [token, setToken] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : window.sessionStorage.getItem(STORAGE_KEY)
  );

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setStatus('unauthenticated');
        return;
      }

      try {
        await validateAdminSession(token);
        setStatus('authenticated');
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setStatus('unauthenticated');
      }
    };

    void restoreSession();
  }, [token]);

  const login = useCallback(async (tokenInput: string) => {
    const normalized = tokenInput.trim();

    if (!normalized) {
      throw new AdminApiError('Token is required.', 400, null);
    }

    const result = await adminLogin(normalized);
    window.sessionStorage.setItem(STORAGE_KEY, result.token);
    setToken(result.token);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setStatus('unauthenticated');
  }, []);

  const contextValue = useMemo(
    () => ({
      status,
      token,
      login,
      logout
    }),
    [status, token, login, logout]
  );

  return <AdminAuthContext.Provider value={contextValue}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = (): AdminAuthContextValue => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider.');
  }

  return context;
};
