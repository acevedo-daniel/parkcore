import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  createPluralTranslator,
  createTranslator,
  resolveLocale,
  type Locale,
  type PluralTranslator,
  type Translator,
} from '../lib/localization.js';

export type Theme = 'dark' | 'light';
export type ThemePreference = 'dark' | 'light' | 'system';
export type Language = 'en' | 'es';
export type { Locale } from '../lib/localization.js';

const THEME_STORAGE_KEY = 'parkcore-theme';
const LOCALE_STORAGE_KEY = 'parkcore-lang';
const THEME_COLOR_BY_THEME: Record<Theme, string> = {
  dark: '#111310',
  light: '#f7f7f4',
};

const noop = () => undefined;

interface AppearanceContextValue {
  language: Language;
  locale: Locale;
  setLanguage: (language: Language | Locale) => void;
  preference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  t: Translator;
  tPlural: PluralTranslator;
  theme: Theme;
}

const fallbackAppearance: AppearanceContextValue = {
  language: 'en',
  locale: 'en-US',
  setLanguage: () => undefined,
  preference: 'system',
  setThemePreference: () => undefined,
  t: createTranslator('en-US'),
  tPlural: createPluralTranslator('en-US'),
  theme: 'light',
};

const AppearanceContext = createContext<AppearanceContextValue>(fallbackAppearance);

function readStoredValue(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}

function parseThemePreference(value: string | null | undefined): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

function languageForLocale(locale: Locale): Language {
  return locale === 'es-AR' ? 'es' : 'en';
}

function getSystemTheme(): Theme {
  try {
    return typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

function subscribeToSystemTheme(onChange: () => void) {
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', onChange);
    return () => {
      mediaQuery.removeEventListener('change', onChange);
    };
  } catch {
    return noop;
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    parseThemePreference(readStoredValue(THEME_STORAGE_KEY)),
  );
  const subscribe = useCallback(
    (onChange: () => void) => (preference === 'system' ? subscribeToSystemTheme(onChange) : noop),
    [preference],
  );
  const getSnapshot = useCallback(
    (): Theme => (preference === 'system' ? getSystemTheme() : 'light'),
    [preference],
  );
  const systemTheme = useSyncExternalStore<Theme>(subscribe, getSnapshot, () => 'light');
  const theme = preference === 'system' ? systemTheme : preference;
  const [locale, setLocale] = useState<Locale>(() =>
    resolveLocale(readStoredValue(LOCALE_STORAGE_KEY)),
  );
  const language = languageForLocale(locale);
  const t = useMemo(() => createTranslator(locale), [locale]);
  const tPlural = useMemo(() => createPluralTranslator(locale), [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLOR_BY_THEME[theme]);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    writeStoredValue(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setLanguage = useCallback((nextLanguage: Language | Locale) => {
    setLocale(resolveLocale(nextLanguage));
  }, []);
  const setThemePreference = useCallback((nextPreference: ThemePreference) => {
    setPreference(nextPreference);
    writeStoredValue(THEME_STORAGE_KEY, nextPreference);
  }, []);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      language,
      locale,
      preference,
      setLanguage,
      setThemePreference,
      t,
      tPlural,
      theme,
    }),
    [language, locale, preference, setLanguage, setThemePreference, t, tPlural, theme],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

// Context hooks intentionally share this module with their provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAppearance() {
  return useContext(AppearanceContext);
}
