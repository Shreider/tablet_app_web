import { useId, useState } from 'react';

export function CacheBackupControls(): JSX.Element {
  const tokenId = useId();
  const fileId = useId();
  const [token, setToken] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const transfer = async (importing: boolean) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (importing && (!file || file.size > 8 * 1024 * 1024)) {
        throw new Error('Wybierz plik kopii JSON o rozmiarze do 8 MB.');
      }
      const response = await fetch(importing ? '/api/cache/import' : '/api/cache/backup', {
        method: importing ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${token.trim()}`, ...(importing ? { 'Content-Type': 'application/json' } : {}) },
        body: importing ? await file!.text() : undefined,
        signal: AbortSignal.timeout(15_000)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? 'Nie udało się przesłać kopii planów.');
      }
      if (importing) {
        const result = await response.json() as { imported: number };
        setMessage(`Wczytano planów: ${result.imported}.`);
        window.dispatchEvent(new Event('room-tablet-cache-updated'));
      } else {
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a');
        link.href = url;
        link.download = `kopia-planow-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage('Pobrano kopię zapisanych planów.');
      }
    } catch (cause) {
      setError(cause instanceof TypeError || (cause instanceof DOMException && cause.name === 'TimeoutError')
        ? 'Brak połączenia z lokalnym serwerem. Spróbuj ponownie.'
        : cause instanceof Error ? cause.message : 'Nie udało się przesłać kopii planów.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="api-settings-form cache-backup" aria-label="Kopia zapisanych planów">
      <h3>Kopia zapisanych planów</h3>
      <p className="api-settings-hint">
        Pobierz lokalną kopię lub wczytaj wcześniej zapisany plik. Wczytanie zastąpi plany
        tych samych sal i dat. Kopia zawiera plany zajęć, bez danych logowania.
      </p>
      <label htmlFor={tokenId}>Token administratora kopii</label>
      <input id={tokenId} type="password" autoComplete="current-password" value={token}
        onChange={(event) => setToken(event.target.value)} disabled={busy} />
      <label htmlFor={fileId}>Plik kopii JSON</label>
      <input id={fileId} type="file" accept=".json,application/json" disabled={busy}
        onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(null); setMessage(null); }} />
      <div className="api-settings-actions">
        <button type="button" className="button button--secondary" disabled={busy || !token.trim()}
          onClick={() => void transfer(false)}>Pobierz kopię</button>
        <button type="button" className="button button--primary" disabled={busy || !token.trim() || !file}
          onClick={() => void transfer(true)}>{busy ? 'Przesyłanie…' : 'Wczytaj kopię'}</button>
      </div>
      {error && <p className="api-settings-error" role="alert">{error}</p>}
      {message && <p className="api-settings-hint" role="status">{message}</p>}
    </section>
  );
}
