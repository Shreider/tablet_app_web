export async function unlockApiSettings(password: string, signal?: AbortSignal): Promise<void> {
  const response = await fetch('/api/cache/settings/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ password }),
    cache: 'no-store',
    signal
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = result && typeof result === 'object' && 'message' in result &&
      typeof result.message === 'string' ? result.message : 'Nie udało się odblokować ustawień API.';
    throw new Error(message);
  }
  if (!result || typeof result !== 'object' || !('authenticated' in result) || result.authenticated !== true) {
    throw new Error('Serwer nie potwierdził dostępu do ustawień API.');
  }
}
