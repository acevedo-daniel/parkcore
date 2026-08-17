const accessTokenKey = 'parkcore.access-token';

export function getAccessToken() {
  try {
    return window.localStorage.getItem(accessTokenKey) ?? undefined;
  } catch {
    return undefined;
  }
}

export function setAccessToken(accessToken: string) {
  try {
    window.localStorage.setItem(accessTokenKey, accessToken);
  } catch {
    // The in-memory session still works when storage is unavailable.
  }
}

export function clearAccessToken() {
  try {
    window.localStorage.removeItem(accessTokenKey);
  } catch {
    // There is no persisted token to remove when storage is unavailable.
  }
}
