export function getReturnTo(search: string) {
  const value = new URLSearchParams(search).get('returnTo');
  return value === '/app' || value?.startsWith('/app/') ? value : '/app';
}
