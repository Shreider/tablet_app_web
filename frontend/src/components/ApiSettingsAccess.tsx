import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { unlockApiSettings } from '../api/settingsApi';

export function ApiSettingsAccess({ children }: { children: ReactNode }): JSX.Element {
  const passwordId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, []);

  if (unlocked) return <>{children}</>;

  const unlock = async () => {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setBusy(true);
    setError(null);
    try {
      await unlockApiSettings(password, controller.signal);
      if (!controller.signal.aborted) {
        setPassword('');
        setUnlocked(true);
      }
    } catch (cause) {
      if (requestRef.current !== controller) return;
      if (controller.signal.aborted) {
        setError('Nie udało się połączyć z lokalnym serwerem. Spróbuj ponownie.');
      } else {
        setError(cause instanceof TypeError ? 'Nie udało się połączyć z lokalnym serwerem.' :
          cause instanceof Error ? cause.message : 'Nie udało się odblokować ustawień API.');
      }
      inputRef.current?.focus();
    } finally {
      window.clearTimeout(timeout);
      if (requestRef.current === controller) {
        requestRef.current = null;
        setBusy(false);
      }
    }
  };

  return (
    <form className="api-settings-form" onSubmit={(event) => {
      event.preventDefault();
      void unlock();
    }} aria-busy={busy}>
      <p id={`${passwordId}-hint`} className="api-settings-hint">
        Wpisz hasło, aby otworzyć edycję ustawień API i zarządzanie kopiami planów.
      </p>
      <label htmlFor={passwordId}>Hasło do ustawień API</label>
      <input ref={inputRef} id={passwordId} type="password" autoComplete="current-password"
        autoCapitalize="none" spellCheck={false} value={password} required maxLength={1024}
        readOnly={busy} aria-invalid={Boolean(error)}
        aria-describedby={`${passwordId}-hint${error ? ` ${passwordId}-error` : ''}`}
        onChange={(event) => { setPassword(event.target.value); setError(null); }} />
      {error && <p id={`${passwordId}-error`} className="api-settings-error" role="alert">{error}</p>}
      <div className="api-settings-actions">
        <button type="submit" className="button button--primary" disabled={busy || !password}>
          {busy ? 'Sprawdzanie…' : 'Odblokuj ustawienia'}
        </button>
      </div>
    </form>
  );
}
