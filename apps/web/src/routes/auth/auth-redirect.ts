export function getReturnTo(search: string) {
  const value = new URLSearchParams(search).get('returnTo');
  return isSafeReturnTo(value) ? value : '/app';
}

export function getAuthPath(pathname: '/login' | '/register', returnTo: string) {
  return `${pathname}?returnTo=${encodeURIComponent(isSafeReturnTo(returnTo) ? returnTo : '/app')}`;
}

function isSafeReturnTo(value: string | null): value is string {
  return value === '/app' || value?.startsWith('/app/') === true;
}
