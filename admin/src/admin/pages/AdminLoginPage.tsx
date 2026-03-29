import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AdminApiError } from '../api/adminApi';
import { useAdminAuth } from '../auth/AdminAuthContext';

export function AdminLoginPage(): JSX.Element {
  const { status, login } = useAdminAuth();
  const location = useLocation();
  const [tokenInput, setTokenInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : '/dashboard';

  if (status === 'authenticated') {
    return <Navigate to={redirectPath} replace />;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await login(tokenInput);
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : 'Nie udalo sie zalogowac do panelu administratora.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-[520px] rounded-[24px] border border-[#2b3f5b] bg-[#0f1726]/95 p-7 shadow-[0_30px_80px_rgba(1,4,14,0.55)]">
        <p className="m-0 text-xs uppercase tracking-[0.16em] text-[#8ca0c4]">Admin Access</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#f1f6ff]">Logowanie administratora</h1>
        <p className="mt-2 text-sm text-[#9cb0d2]">
          Podaj token administratora, aby zarzadzac danymi w bazie projektu.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="admin-field">
            <span className="admin-label">Token admina</span>
            <input
              className="admin-input"
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Wprowadz ADMIN_TOKEN"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? (
            <p className="m-0 rounded-xl border border-[#4b2d3a] bg-[#2b1821] px-3 py-2 text-sm text-[#ffc5d4]">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={submitting}>
            {submitting ? 'Logowanie...' : 'Zaloguj do panelu'}
          </button>
        </form>
      </section>
    </div>
  );
}
