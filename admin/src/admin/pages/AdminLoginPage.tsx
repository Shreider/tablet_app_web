import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AdminApiError } from '../api/adminApi';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { AdminIcon } from '../components/AdminIcon';

export function AdminLoginPage(): JSX.Element {
  const { status, login } = useAdminAuth();
  const location = useLocation();
  const [tokenInput, setTokenInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Logowanie · Panel administratora';
  }, []);

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
          : 'Nie udało się zalogować do panelu administratora.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <section className="admin-login-card">
        <span className="admin-brand-icon mb-5">
          <AdminIcon name="rooms" size={26} />
        </span>
        <p className="admin-kicker">Panel administratora</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#f1f6ff]">Zarządzaj planem zajęć</h1>
        <p className="mt-2 text-sm text-[#a6bbdb]">
          Zaloguj się, aby edytować sale, harmonogram i dane zajęć.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="admin-field">
            <span className="admin-label">Token dostępu</span>
            <input
              className="admin-input"
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="Wprowadź token administratora"
              autoComplete="current-password"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? 'login-error' : undefined}
              required
            />
          </label>

          {errorMessage ? (
            <p id="login-error" role="alert" className="admin-notice admin-notice--error">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="admin-btn admin-btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? 'Logowanie...' : 'Zaloguj do panelu'}
          </button>
        </form>
      </section>
    </div>
  );
}
