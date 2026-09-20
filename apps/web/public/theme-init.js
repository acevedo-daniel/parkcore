(() => {
  const themeStorageKey = 'parkcore-theme';
  const localeStorageKey = 'parkcore-lang';
  const readStoredValue = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  try {
    const storedTheme = readStoredValue(themeStorageKey);
    const preference = ['system', 'light', 'dark'].includes(storedTheme ?? '')
      ? storedTheme
      : 'system';
    const storedLocale = readStoredValue(localeStorageKey);
    const locale = storedLocale === 'en' || storedLocale === 'en-US' ? 'en-US' : 'es-AR';
    const systemIsDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme =
      preference === 'dark' || (preference === 'system' && systemIsDark) ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.lang = locale;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#111310' : '#f7f7f4');
  } catch {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.lang = 'es-AR';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f7f7f4');
  }
})();
