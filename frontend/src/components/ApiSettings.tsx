import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import {
  apiEndpointStorageKey,
  defaultApiEndpoint,
  loadApiEndpoint,
  saveApiEndpoint,
  validateApiEndpoint
} from '../lib/apiEndpoint';
import { Dialog } from './Dialog';
import { CacheBackupControls } from './CacheBackupControls';
import { ApiSettingsAccess } from './ApiSettingsAccess';

interface ApiSettingsContextValue {
  endpoint: string;
  open: boolean;
  openSettings: () => void;
}

const ApiSettingsContext = createContext<ApiSettingsContextValue | null>(null);

export function useApiSettings(): ApiSettingsContextValue {
  const context = useContext(ApiSettingsContext);
  if (!context) throw new Error('API settings provider is missing.');
  return context;
}

export function ApiSettingsButton(): JSX.Element {
  const { open, openSettings } = useApiSettings();
  return (
    <button
      type="button"
      className="button button--secondary"
      aria-label="Ustawienia API"
      aria-haspopup="dialog"
      aria-controls="api-settings"
      aria-expanded={open}
      onClick={openSettings}
    >
      API
    </button>
  );
}

export function ApiSettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const [endpoint, setEndpoint] = useState(loadApiEndpoint);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(endpoint);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  useEffect(() => {
    const syncSettings = (event: StorageEvent) => {
      if (event.key === apiEndpointStorageKey || event.key === null) setEndpoint(loadApiEndpoint());
    };
    window.addEventListener('storage', syncSettings);
    return () => window.removeEventListener('storage', syncSettings);
  }, []);

  const applyEndpoint = (value: string) => {
    saveApiEndpoint(value);
    setEndpoint(value);
    setOpen(false);
  };

  const openSettings = () => {
    setDraft(endpoint);
    setError(null);
    setOpen(true);
  };

  return (
    <ApiSettingsContext.Provider value={{ endpoint, open, openSettings }}>
      {children}
      <Dialog id="api-settings" title="Ustawienia API" open={open} onClose={() => setOpen(false)}>
        <ApiSettingsAccess>
          <form
            className="api-settings-form"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                applyEndpoint(validateApiEndpoint(draft));
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Nieprawidłowy adres API.');
              }
            }}
          >
            <label htmlFor={inputId}>Endpoint danych sali</label>
            <input
              id={inputId}
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              placeholder="https://serwer.example/api/room/{roomId}"
              aria-describedby={`${inputId}-hint${error ? ` ${inputId}-error` : ''}`}
              aria-invalid={Boolean(error)}
              required
            />
            <p id={`${inputId}-hint`} className="api-settings-hint">
              Wpisz pełny adres endpointu zwracającego JSON. Znacznik <code>{'{roomId}'}</code>
              {' '}zastępujemy numerem sali z adresu strony. Zmiana zadziała od razu i zostanie
              zapamiętana w tej przeglądarce.
              {' '}Domyślny adres korzysta z lokalnej kopii planu. Własny adres jest odpytywany bezpośrednio.
            </p>
            {error && (
              <p id={`${inputId}-error`} className="api-settings-error" role="alert">{error}</p>
            )}
            <div className="api-settings-actions">
              <button type="submit" className="button button--primary">Zapisz</button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => applyEndpoint(defaultApiEndpoint)}
              >
                Przywróć domyślne
              </button>
            </div>
          </form>
          <CacheBackupControls />
        </ApiSettingsAccess>
      </Dialog>
    </ApiSettingsContext.Provider>
  );
}
