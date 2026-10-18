const STORAGE_KEY = 'room_tablet_api_endpoint';
export const defaultApiEndpoint = '/api/room/{roomId}';

export function validateApiEndpoint(input: string): string {
  const value = input.trim();
  if (!/^(https?:\/\/|\/(?!\/))/i.test(value)) {
    throw new Error('Podaj adres http:// lub https:// albo ścieżkę zaczynającą się od /.');
  }
  if (/[{}]/.test(value.split('{roomId}').join(''))) {
    throw new Error('W adresie możesz użyć znacznika {roomId} dla numeru sali.');
  }

  let url: URL;
  try {
    url = new URL(value.split('{roomId}').join('205'), window.location.origin);
  } catch {
    throw new Error('Podany adres API jest nieprawidłowy.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error('Podaj adres HTTP lub HTTPS bez danych logowania i fragmentu #.');
  }
  if (window.location.protocol === 'https:' && url.protocol !== 'https:') {
    throw new Error('Dla strony otwartej przez HTTPS podaj również adres API z HTTPS.');
  }
  return value;
}

export function loadApiEndpoint(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? validateApiEndpoint(saved) : defaultApiEndpoint;
  } catch {
    return defaultApiEndpoint;
  }
}

export function saveApiEndpoint(endpoint: string): void {
  try {
    if (endpoint === defaultApiEndpoint) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, endpoint);
  } catch {
    // The selected endpoint still works for this tab when browser storage is unavailable.
  }
}

export const apiEndpointStorageKey = STORAGE_KEY;

export function resolveApiEndpoint(endpoint: string, roomId: string): string {
  return endpoint.split('{roomId}').join(encodeURIComponent(roomId));
}
